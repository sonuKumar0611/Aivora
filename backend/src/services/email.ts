import nodemailer from 'nodemailer';
import { env } from '../utils/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  const sender = env.EMAIL_SENDER;
  const appPassword = env.GMAIL_APP_PASSWORD;
  if (!sender || !appPassword) return null;
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: sender,
      pass: appPassword,
    },
  });
  return transporter;
}

export interface InviteEmailParams {
  to: string;
  inviterName: string;
  organizationName: string;
  tempPassword: string;
  acceptInviteUrl: string;
}

export async function sendInviteEmail(params: InviteEmailParams): Promise<void> {
  const t = getTransporter();
  const from = env.EMAIL_SENDER;
  if (!t || !from) {
    console.warn('Email not configured (EMAIL_SENDER / GMAIL_APP_PASSWORD). Invite email skipped.');
    return;
  }
  const { to, inviterName, organizationName, tempPassword, acceptInviteUrl } = params;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to ${escapeHtml(organizationName)}</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden;">
          <tr>
            <td style="padding: 32px 28px 24px;">
              <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #1a1a1a;">
                You're invited to join ${escapeHtml(organizationName)}
              </h1>
              <p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.5;">
                ${escapeHtml(inviterName)} has invited you to join their team on Aivora.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 28px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Temporary password</p>
                    <p style="margin: 0; font-size: 16px; font-family: ui-monospace, monospace; font-weight: 600; color: #1e293b; letter-spacing: 0.5px;">${escapeHtml(tempPassword)}</p>
                    <p style="margin: 8px 0 0; font-size: 13px; color: #64748b;">You will set your own password when you accept the invite.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 28px 28px;">
              <a href="${escapeHtml(acceptInviteUrl)}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                Accept invite & set password
              </a>
              <p style="margin: 16px 0 0; font-size: 13px; color: #64748b;">
                Or copy this link: <br/>
                <a href="${escapeHtml(acceptInviteUrl)}" style="color: #6366f1; word-break: break-all;">${escapeHtml(acceptInviteUrl)}</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 20px 0 0; font-size: 12px; color: #94a3b8;">
          If you didn't expect this invite, you can ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  const text = [
    `You're invited to join ${organizationName}`,
    '',
    `${inviterName} has invited you to join their team on Aivora.`,
    '',
    `Temporary password: ${tempPassword}`,
    'You will set your own password when you accept the invite.',
    '',
    `Accept invite: ${acceptInviteUrl}`,
  ].join('\n');

  await t.sendMail({
    from: `Aivora <${from}>`,
    to,
    subject: `You're invited to join ${organizationName} on Aivora`,
    text,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
