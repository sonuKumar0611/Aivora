import mongoose from 'mongoose';
import { OrganizationIntegration } from '../models/OrganizationIntegration';
import { AgentTool } from '../models/AgentTool';
import type { AgentToolType, IAgentToolConfig } from '../models/AgentTool';
import type { IntegrationProvider } from '../models/OrganizationIntegration';
import { env } from '../utils/env';

const TOOL_TO_PROVIDER: Record<AgentToolType, IntegrationProvider> = {
  google_calendar_create_event: 'google_calendar',
  google_calendar_check_availability: 'google_calendar',
  google_sheets_create_row: 'google_sheets',
};

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
}

/** Get valid Google access token for org; refresh if needed. */
async function getGoogleAccessToken(organizationId: string, provider: IntegrationProvider): Promise<string> {
  const integration = await OrganizationIntegration.findOne({
    organizationId: new mongoose.Types.ObjectId(organizationId),
    provider,
    status: 'connected',
  }).lean();

  if (!integration) {
    throw new Error(`${provider === 'google_calendar' ? 'Google Calendar' : 'Google Sheets'} is not connected. Connect it in Dashboard → Integrations.`);
  }

  const meta = (integration as { metadata?: GoogleTokens }).metadata;
  if (!meta?.access_token) {
    throw new Error('Integration missing credentials. Reconnect in Dashboard → Integrations.');
  }

  const expiresAt = meta.expires_at ? new Date(meta.expires_at).getTime() : 0;
  const now = Date.now();
  if (expiresAt > now + 60 * 1000) {
    return meta.access_token;
  }

  const refreshToken = meta.refresh_token;
  if (!refreshToken || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Token expired and refresh not configured. Reconnect the integration.');
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('Google token refresh failed:', tokenRes.status, errText);
    throw new Error('Failed to refresh Google token. Reconnect the integration.');
  }

  const data = (await tokenRes.json()) as { access_token: string; expires_in: number };
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  await OrganizationIntegration.findOneAndUpdate(
    { organizationId: new mongoose.Types.ObjectId(organizationId), provider },
    { $set: { 'metadata.access_token': data.access_token, 'metadata.expires_at': newExpiresAt } }
  );
  return data.access_token;
}

/** Try to parse a date string to ISO 8601. Returns the string if it already looks like ISO, or parses common formats. */
function parseToISO8601(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return trimmed;
}

/** Execute Google Calendar: create event. Args: summary, startDateTime (ISO), endDateTime (ISO), description? */
async function executeGoogleCalendarCreateEvent(
  organizationId: string,
  config: IAgentToolConfig,
  args: Record<string, unknown>
): Promise<string> {
  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken(organizationId, 'google_calendar');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Calendar connection failed.';
    console.error('[Tool] Google Calendar token error:', msg);
    throw new Error('Calendar is not connected or the connection expired. Please connect Google Calendar in Dashboard → Integrations and try again.');
  }

  const calendarId = (config.calendarId ?? 'primary').trim() || 'primary';
  const summary = String(args.summary ?? args.title ?? 'Site visit').trim() || 'Site visit';
  let startRaw = String(args.startDateTime ?? args.start ?? '').trim();
  let endRaw = String(args.endDateTime ?? args.end ?? '').trim();
  const description = args.description != null ? String(args.description).trim() : '';

  if (!startRaw) {
    throw new Error('Missing start date/time. Please provide when the visit should start (e.g. 2026-02-22T11:00:00).');
  }
  const startDateTime = parseToISO8601(startRaw);
  let endDateTime: string;
  if (endRaw) {
    endDateTime = parseToISO8601(endRaw);
  } else {
    const startDate = new Date(startDateTime);
    if (Number.isNaN(startDate.getTime())) {
      throw new Error('Invalid start date/time format. Use ISO 8601 (e.g. 2026-02-22T11:00:00).');
    }
    startDate.setHours(startDate.getHours() + 1);
    endDateTime = startDate.toISOString();
  }

  const body = {
    summary,
    start: { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    end: { dateTime: endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    ...(description && { description }),
  };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('[Tool] Google Calendar API error:', res.status, errText);
    if (res.status === 403 && /Calendar API has not been used|accessNotConfigured|SERVICE_DISABLED/i.test(errText)) {
      throw new Error(
        'Google Calendar API is not enabled for your Google Cloud project. Enable it at: https://console.developers.google.com/apis/api/calendar-json.googleapis.com (select the same project as your OAuth client). After enabling, wait a minute and try again.'
      );
    }
    throw new Error('Could not create the calendar event. The date/time format may be invalid, or the calendar connection may need to be reconnected in Dashboard → Integrations.');
  }
  const event = (await res.json()) as { htmlLink?: string; id?: string };
  return `Event created successfully. ${event.htmlLink ? `Link: ${event.htmlLink}` : `ID: ${event.id}`}`;
}

/** Execute Google Calendar: check availability. Args: timeMin (ISO), timeMax (ISO). Returns list of busy slots or "available". */
async function executeGoogleCalendarCheckAvailability(
  organizationId: string,
  config: IAgentToolConfig,
  args: Record<string, unknown>
): Promise<string> {
  const accessToken = await getGoogleAccessToken(organizationId, 'google_calendar');
  const calendarId = (config.calendarId ?? 'primary').trim() || 'primary';
  const timeMin = String(args.timeMin ?? args.start ?? '').trim();
  const timeMax = String(args.timeMax ?? args.end ?? '').trim();

  if (!timeMin || !timeMax) {
    throw new Error('Missing required fields: timeMin and timeMax (use ISO 8601 format).');
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: calendarId }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar API error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }> };
  const cal = data.calendars?.[calendarId];
  const busy = cal?.busy ?? [];
  if (busy.length === 0) {
    return 'The calendar is available between the requested times.';
  }
  const slots = busy.map((b) => `${b.start} to ${b.end}`).join('; ');
  return `Busy slots: ${slots}. Suggest times outside these.`;
}

/** Execute Google Sheets: append row. Args: object with column names as keys, or "values" array. */
async function executeGoogleSheetsCreateRow(
  organizationId: string,
  config: IAgentToolConfig,
  args: Record<string, unknown>
): Promise<string> {
  const accessToken = await getGoogleAccessToken(organizationId, 'google_sheets');
  const spreadsheetId = (config.spreadsheetId ?? '').trim();
  const sheetName = (config.sheetName ?? 'Sheet1').trim() || 'Sheet1';
  if (!spreadsheetId) {
    throw new Error('Tool config missing spreadsheetId. Edit the tool and set the spreadsheet ID.');
  }

  let values: string[];
  if (Array.isArray(args.values)) {
    values = args.values.map((v) => String(v ?? ''));
  } else if (config.columns && Array.isArray(config.columns)) {
    values = config.columns.map((col) => String((args as Record<string, unknown>)[col] ?? ''));
  } else {
    values = Object.keys(args)
      .filter((k) => k !== 'values')
      .sort()
      .map((k) => String(args[k] ?? ''));
  }

  const range = sheetName.includes('!') ? sheetName : `${sheetName}!A:Z`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [values] }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets API error: ${res.status} ${err}`);
  }
  return 'Row added to the sheet successfully.';
}

/**
 * Execute a tool by ID for the given organization. Arguments are type-specific.
 */
export async function executeTool(
  toolId: string,
  organizationId: string,
  args: Record<string, unknown>
): Promise<string> {
  const tool = await AgentTool.findOne({
    _id: new mongoose.Types.ObjectId(toolId),
    organizationId: new mongoose.Types.ObjectId(organizationId),
  }).lean();

  if (!tool) {
    throw new Error('Tool not found or access denied.');
  }

  const type = tool.type as AgentToolType;
  const config = (tool.config ?? {}) as IAgentToolConfig;

  switch (type) {
    case 'google_calendar_create_event':
      return executeGoogleCalendarCreateEvent(organizationId, config, args);
    case 'google_calendar_check_availability':
      return executeGoogleCalendarCheckAvailability(organizationId, config, args);
    case 'google_sheets_create_row':
      return executeGoogleSheetsCreateRow(organizationId, config, args);
    default:
      throw new Error(`Unknown tool type: ${type}`);
  }
}
