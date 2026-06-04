// ============================================================
// MAYLLER BRIDAL — Inbound SMS -> Email
// pronovias/src/app/api/twilio/sms-inbound/route.ts
//
// Twilio posts here when a customer texts +1 484-638-6555.
// We email the message to the shop inbox (GMAIL_USER) with a
// "Reply" link, and return an empty TwiML (NO auto-reply).
//
// Auth: the webhook URL must include ?k=<SMS_WEBHOOK_KEY>.
// Reply link points to /sms-reply (sends via toll-free once verified).
// ============================================================

import nodemailer from 'nodemailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function baseUrl(): string {
  return (process.env.PUBLIC_BASE_URL || 'https://mayllerbridal.com').replace(/\/+$/, '');
}

function esc(s: string): string {
  return (s || '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  );
}

function emptyTwiml(): Response {
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { status: 200, headers: { 'Content-Type': 'text/xml' } }
  );
}

export async function POST(req: Request): Promise<Response> {
  // --- simple shared-secret auth via ?k= ---
  const key = new URL(req.url).searchParams.get('k');
  if (!process.env.SMS_WEBHOOK_KEY || key !== process.env.SMS_WEBHOOK_KEY) {
    return new Response('Forbidden', { status: 403 });
  }

  // --- parse Twilio's x-www-form-urlencoded body ---
  let from = '';
  let to = '';
  let body = '';
  let numMedia = '0';
  try {
    const form = await req.formData();
    from = String(form.get('From') ?? '');
    to = String(form.get('To') ?? '');
    body = String(form.get('Body') ?? '');
    numMedia = String(form.get('NumMedia') ?? '0');
  } catch {
    return emptyTwiml();
  }

  if (!from) return emptyTwiml();

  // --- build the shop notification email ---
  const ts = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const replyUrl =
    `${baseUrl()}/sms-reply?to=${encodeURIComponent(from)}` +
    (process.env.SMS_REPLY_TOKEN ? `&t=${encodeURIComponent(process.env.SMS_REPLY_TOKEN)}` : '');
  const hasMedia = Number(numMedia) > 0;

  const html =
    '<!doctype html><html><head><meta charset="utf-8"></head>' +
    '<body style="font-family:-apple-system,Helvetica,sans-serif;background:#faf9f5;margin:0;padding:24px;color:#1a1a1a;">' +
    '<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #ece8db;">' +
    '<div style="background:#1a1a1a;color:#fff;padding:18px 28px;letter-spacing:.25em;font-size:11px;text-transform:uppercase;">INCOMING SMS</div>' +
    '<div style="padding:26px 28px;">' +
    '<table style="width:100%;border-collapse:collapse;">' +
    '<tr><td style="color:#888;font-size:10px;letter-spacing:.2em;text-transform:uppercase;padding:6px 0;width:90px;vertical-align:top;">From</td>' +
    '<td style="font-size:14px;padding:6px 0;"><a href="tel:' + esc(from) + '" style="color:#1a1a1a;">' + esc(from) + '</a></td></tr>' +
    '<tr><td style="color:#888;font-size:10px;letter-spacing:.2em;text-transform:uppercase;padding:6px 0;">To</td>' +
    '<td style="font-size:14px;padding:6px 0;">' + esc(to) + '</td></tr>' +
    '<tr><td style="color:#888;font-size:10px;letter-spacing:.2em;text-transform:uppercase;padding:6px 0;">Received</td>' +
    '<td style="font-size:14px;padding:6px 0;">' + esc(ts) + ' ET</td></tr>' +
    '</table>' +
    '<div style="background:#faf9f5;border-left:3px solid #c9a96e;padding:14px 18px;margin-top:16px;font-size:15px;line-height:1.6;color:#333;">' +
    esc(body || '(no text)') + (hasMedia ? '<br><span style="color:#888;font-size:12px;">[' + esc(numMedia) + ' media attachment(s) — open Twilio to view]</span>' : '') +
    '</div>' +
    '<div style="margin-top:24px;text-align:center;">' +
    '<a href="' + replyUrl + '" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:13px 30px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;">Reply to ' + esc(from) + '</a>' +
    '</div>' +
    '<p style="color:#aaa;font-size:11px;margin-top:20px;text-align:center;">Reply is sent from the Mayller toll-free number — your personal number stays private.</p>' +
    '</div></div></body></html>';

  const text =
    'Incoming SMS\nFrom: ' + from + '\nTo: ' + to + '\nReceived: ' + ts + ' ET\n\n' +
    'Message: ' + (body || '(no text)') + '\n\n' +
    'Reply: ' + replyUrl + '\n';

  // --- send via Gmail SMTP (same transport as the rest of the app) ---
  try {
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      });
      await transporter.sendMail({
        from: '"Mayller SMS" <' + process.env.GMAIL_USER + '>',
        to: process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER,
        replyTo: process.env.GMAIL_USER,
        subject: '📩 SMS from ' + from + ' — Mayller Bridal',
        text,
        html,
      });
    } else {
      console.error('[sms-inbound] GMAIL_USER / GMAIL_APP_PASSWORD missing');
    }
  } catch (err) {
    console.error('[sms-inbound] email send failed:', err);
    // Do not fail the webhook — Twilio would retry and double-email.
  }

  return emptyTwiml();
}

// Some Twilio setups send a GET probe; answer politely.
export async function GET(): Promise<Response> {
  return emptyTwiml();
}
