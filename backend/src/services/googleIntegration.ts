import mongoose from 'mongoose';
import { OrganizationIntegration } from '../models/OrganizationIntegration';
import type { IntegrationProvider } from '../models/OrganizationIntegration';
import { env } from '../utils/env';

const GOOGLE_OAUTH_PROVIDERS: IntegrationProvider[] = ['google_calendar', 'google_sheets'];

export interface GoogleIntegrationMetadata {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  linked_email?: string;
}

/** Margin before expiry to trigger refresh (ms). */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

/**
 * Returns a valid access token for the org's Google integration.
 * Refreshes the token if expired or about to expire.
 * Use this when calling Google Calendar or Sheets APIs for future features.
 */
export async function getValidAccessToken(
  organizationId: string | mongoose.Types.ObjectId,
  provider: IntegrationProvider
): Promise<{ accessToken: string; linkedEmail?: string } | null> {
  if (!GOOGLE_OAUTH_PROVIDERS.includes(provider)) {
    return null;
  }
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return null;
  }
  const orgId = typeof organizationId === 'string' ? organizationId : organizationId.toString();
  const doc = await OrganizationIntegration.findOne({
    organizationId: orgId,
    provider,
    status: 'connected',
  }).exec();
  if (!doc) return null;
  const meta = (doc as { metadata?: GoogleIntegrationMetadata }).metadata;
  if (!meta?.access_token) return null;

  const expiresAt = meta.expires_at ? new Date(meta.expires_at).getTime() : 0;
  const now = Date.now();
  if (expiresAt && now < expiresAt - REFRESH_MARGIN_MS) {
    return { accessToken: meta.access_token, linkedEmail: meta.linked_email };
  }

  if (!meta.refresh_token) {
    return null;
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: meta.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  if (!tokenRes.ok) {
    return null;
  }
  const body = (await tokenRes.json()) as { access_token: string; expires_in: number };
  const newExpiresAt = new Date(Date.now() + body.expires_in * 1000).toISOString();
  (doc as { metadata?: GoogleIntegrationMetadata }).metadata = {
    ...meta,
    access_token: body.access_token,
    expires_at: newExpiresAt,
  };
  await doc.save();
  return { accessToken: body.access_token, linkedEmail: meta.linked_email };
}
