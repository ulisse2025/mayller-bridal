// ============================================================
// MAYLLER BRIDAL â Booking System
// lib/notifications.ts
// Email via Gmail (Nodemailer + App Password) + SMS via Twilio REST API
// NOTE: SMS uses fetch() directly â no Twilio SDK / no Axios 30s timeout
// ============================================================

import nodemailer from 'nodemailer';
import {
  BookingResult,
  APPOINTMENT_CONFIG,
  formatDate,
  STORE_ADDRESS,
  STORE_PHONE,
  STORE_NAME,
} from './booking-types';

// ââ Email (Gmail + App Password) ââââââââââââââââââââââââââââââ

function getMailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER!,         // mayllerbridalitalianstyle@gmail.com
      pass: process.env.GMAIL_APP_PASSWORD!, // 16-char App Password from Google
    },
  });
}

// ââ SMS via Twilio REST API (no SDK, no Axios) ââââââââââââââââ

/**
 * Send an SMS via Twilio REST API using native fetch().
 * Uses AbortSignal.timeout(8000) to fail fast if Twilio is unreachable.
 */
async function sendTwilioSMS(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_PHONE_NUMBER!;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  // Use MessagingServiceSid for A2P 10DLC compliance
  const smsParams: Record<string, string> = { To: to, Body: body };
  if (messagingServiceSid) {
    smsParams.MessagingServiceSid = messagingServiceSid;
    console.log('[sms] Using MessagingServiceSid for A2P compliance');
  } else {
    smsParams.From = from;
    console.log('[sms] Falling back to direct From number');
  }
  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(smsParams).toString(),
      signal: AbortSignal.timeout(8_000), // fail in 8s, not 30s
    }
  );

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Twilio HTTP ${resp.status}: ${txt.substring(0, 200)}`);
  }

  const data = await resp.json().catch(() => ({})) as Record<string, unknown>;
  console.log('[sms] Twilio sent, sid:', data.sid ?? 'unknown');
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return phone.startsWith('+') ? phone : `+${digits}`;
}

// ââ Email Templates âââââââââââââââââââââââââââââââââââââââââââ

function customerEmailHTML(booking: BookingResult): string {
  const config = APPOINTMENT_CONFIG[booking.appointmentType];
  const shortId = booking.bookingId.slice(0, 8).toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background:#f9f6f0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="580" style="background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;letter-spacing:4px;color:#fff;font-weight:normal;">
                MAYLLER BRIDAL
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#c9a96e;letter-spacing:2px;font-style:italic;">
                ITALIAN STYLE
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#333;">
                Dear ${booking.customerName},
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
                Your appointment has been confirmed. We look forward to welcoming you to our atelier.
              </p>

              <!-- Appointment Card -->
              <table width="100%" style="background:#f9f6f0;border-left:4px solid #c9a96e;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px;font-size:13px;letter-spacing:2px;color:#1a1a1a;font-weight:bold;">
                      APPOINTMENT DETAILS
                    </p>
                    <table>
                      <tr>
                        <td style="padding:4px 16px 4px 0;color:#888;font-size:14px;">Type</td>
                        <td style="padding:4px 0;color:#333;font-size:14px;font-weight:bold;">${config.label}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 16px 4px 0;color:#888;font-size:14px;">Date</td>
                        <td style="padding:4px 0;color:#333;font-size:14px;">${formatDate(booking.date)}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 16px 4px 0;color:#888;font-size:14px;">Time</td>
                        <td style="padding:4px 0;color:#333;font-size:14px;">${booking.time}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 16px 4px 0;color:#888;font-size:14px;">Duration</td>
                        <td style="padding:4px 0;color:#333;font-size:14px;">${config.duration} minutes</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 16px 4px 0;color:#888;font-size:14px;">Location</td>
                        <td style="padding:4px 0;color:#333;font-size:14px;">${STORE_ADDRESS}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 16px 4px 0;color:#888;font-size:14px;">Booking ID</td>
                        <td style="padding:4px 0;color:#c9a96e;font-size:14px;font-weight:bold;">${shortId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;font-size:14px;color:#777;line-height:1.6;font-style:italic;">
                Need to cancel or reschedule? Please call us at
                <a href="tel:${STORE_PHONE}" style="color:#c9a96e;">${STORE_PHONE}</a>
                at least 24 hours in advance, or reply to this email.
              </p>

              <p style="margin:0;font-size:15px;color:#333;">
                We can't wait to be part of your special journey. â¨
              </p>
              <p style="margin:8px 0 0;font-size:15px;color:#555;">
                â The ${STORE_NAME} Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f5f5;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;font-size:11px;color:#aaa;letter-spacing:1px;">
                Â© 2026 ${STORE_NAME} Â· ${STORE_ADDRESS}
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#aaa;">
                <a href="tel:${STORE_PHONE}" style="color:#c9a96e;text-decoration:none;">${STORE_PHONE}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function storeNotificationHTML(booking: BookingResult): string {
  const config = APPOINTMENT_CONFIG[booking.appointmentType];
  const shortId = booking.bookingId.slice(0, 8).toUpperCase();

  return `<h2 style="color:#1a1a1a;">ð¤ New Booking â Sofia AI</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
  <tr><td><b>Customer</b></td><td>${booking.customerName}</td></tr>
  <tr><td><b>Phone</b></td><td>${booking.customerPhone}</td></tr>
  <tr><td><b>Email</b></td><td>${booking.customerEmail ?? 'â'}</td></tr>
  <tr><td><b>Type</b></td><td>${config.label}</td></tr>
  <tr><td><b>Date</b></td><td>${formatDate(booking.date)}</td></tr>
  <tr><td><b>Time</b></td><td>${booking.time}</td></tr>
  <tr><td><b>Duration</b></td><td>${config.duration} min</td></tr>
  <tr><td><b>Booking ID</b></td><td><b style="color:#c9a96e;">${shortId}</b></td></tr>
  <tr><td><b>Full ID</b></td><td style="font-size:11px;color:#999;">${booking.bookingId}</td></tr>
</table>
<p style="color:#888;font-size:12px;margin-top:20px;">
  This appointment has been automatically added to your Google Calendar.<br>
  Booked by Sofia AI Voice Assistant on ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
</p>`;
}

// ââ Public Functions ââââââââââââââââââââââââââââââââââââââââââ

/**
 * Send confirmation email to customer (if email provided)
 * and notification email to the store.
 */
export async function sendConfirmationEmail(booking: BookingResult): Promise<void> {
  const transporter = getMailTransporter();
  const config = APPOINTMENT_CONFIG[booking.appointmentType];
  const shortId = booking.bookingId.slice(0, 8).toUpperCase();

  const promises: Promise<unknown>[] = [];

  // Email to customer (only if they provided an email)
  if (booking.customerEmail) {
    promises.push(
      transporter.sendMail({
        from: `"${STORE_NAME}" <${process.env.GMAIL_USER}>`,
        to: booking.customerEmail,
        subject: `â¨ Appointment Confirmed â ${config.label} | Mayller Bridal`,
        html: customerEmailHTML(booking),
      })
    );
  }

  // Notification email to the store (always)
  promises.push(
    transporter.sendMail({
      from: `"Sofia AI Booking" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER!,
      subject: `ð New Booking [${shortId}] â ${config.label} â ${booking.customerName}`,
      html: storeNotificationHTML(booking),
    })
  );

  await Promise.all(promises);
}

/**
 * Send SMS confirmation to customer via Twilio REST API.
 */
export async function sendConfirmationSMS(booking: BookingResult): Promise<void> {
  if (!booking.customerPhone) return;

  const config = APPOINTMENT_CONFIG[booking.appointmentType];
  const shortId = booking.bookingId.slice(0, 8).toUpperCase();

  const body = [
    `Mayller Bridal - Appointment CONFIRMED`,
    `Type: ${config.label}`,
    `Date: ${formatDate(booking.date)}`,
    `Time: ${booking.time}`,
    `Location: ${STORE_ADDRESS}`,
    `ID: ${shortId}`,
    `Questions? Call ${STORE_PHONE}`,
  ].join('\n');

  await sendTwilioSMS(formatPhone(booking.customerPhone), body);
}

/**
 * Send cancellation notification email to the store.
 */
export async function sendCancellationEmail(
  customerName: string,
  bookingId: string,
): Promise<void> {
  const transporter = getMailTransporter();
  const shortId = bookingId.slice(0, 8).toUpperCase();
  const ts = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

  await transporter.sendMail({
    from: `"Sofia AI Booking" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER!,
    subject: `â Booking Cancelled [${shortId}] â ${customerName}`,
    html: `
      <h2 style="color:#c00;">â Appointment Cancelled</h2>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        <tr><td><b>Customer</b></td><td>${customerName}</td></tr>
        <tr><td><b>Booking ID</b></td><td><b style="color:#c9a96e;">${shortId}</b></td></tr>
        <tr><td><b>Full ID</b></td><td style="font-size:11px;color:#999;">${bookingId}</td></tr>
      </table>
      <p style="color:#888;font-size:12px;margin-top:20px;">
        Cancelled via Sofia AI on ${ts} ET
      </p>`,
  });
}
/**
 * Send cancellation SMS to customer.
 */
export async function sendCancellationSMS(
  customerPhone: string,
  bookingId: string
): Promise<void> {
  const shortId = bookingId.slice(0, 8).toUpperCase();

  const body = [
    `Mayller Bridal`,
    `Your appointment (ID: ${shortId}) has been cancelled.`,
    `To rebook, call ${STORE_PHONE}`,
  ].join('\n');

  await sendTwilioSMS(formatPhone(customerPhone), body);
}


// ────────────────────────────────────────────────────────────
// VOICEMAIL (added 2026-05-27)
// ────────────────────────────────────────────────────────────

export type VoicemailType = 'running_late' | 'cant_come' | 'callback_request' | 'question' | 'at_door_urgent' | 'other';

export interface VoicemailPayload {
  messageText: string;
  messageType: VoicemailType;
  customerName?: string;
  callerPhone: string;
  callId?: string;
  booking?: {
    appointmentLabel?: string;
    date?: string;
    time?: string;
    shortBookingId?: string;
  } | null;
}

function subjectFor(p: VoicemailPayload): string {
  const who = p.customerName ? p.customerName : p.callerPhone;
  const where = p.booking?.appointmentLabel && p.booking?.time
    ? ' (' + p.booking.appointmentLabel + ' ' + (p.booking?.date || '') + ' ' + p.booking.time + ')'
    : '';
  switch (p.messageType) {
    case 'at_door_urgent':   return '[URGENT] Customer at the door — ' + who;
    case 'running_late':     return '[Sofia voicemail] Late arrival — ' + who + where;
    case 'cant_come':        return '[Sofia voicemail] Cancellation message — ' + who + where;
    case 'callback_request': return '[Sofia voicemail] Callback request — ' + who;
    case 'question':         return '[Sofia voicemail] Question — ' + who;
    default:                 return '[Sofia voicemail] Message — ' + who;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function voicemailHtml(p: VoicemailPayload): string {
  const ts = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' });
  const isUrgent = p.messageType === 'at_door_urgent';
  const accent = isUrgent ? '#b91c1c' : '#1a1a1a';
  const label = isUrgent ? 'URGENT — CUSTOMER AT THE DOOR' : 'SOFIA VOICEMAIL';
  const phoneE164 = p.callerPhone.replace(/[^+\d]/g, '');
  const bookingBlock = p.booking
    ? '<tr><td class="lbl">Booking</td><td class="val">' + escapeHtml((p.booking.appointmentLabel || '') + ' — ' + (p.booking.date || '') + ' ' + (p.booking.time || '') + (p.booking.shortBookingId ? ' (code ' + p.booking.shortBookingId + ')' : '')) + '</td></tr>'
    : '';
  const callIdBlock = p.callId
    ? '<tr><td class="lbl">Call ID</td><td class="val"><a href="https://dashboard.vapi.ai/calls/' + escapeHtml(p.callId) + '" style="color:#888;text-decoration:none">' + escapeHtml(p.callId.slice(0,8)) + '…</a></td></tr>'
    : '';
  return '<!doctype html><html><head><meta charset="utf-8"><style>' +
    'body{font-family:-apple-system,BlinkMacSystemFont,Helvetica,sans-serif;background:#faf9f5;color:#1a1a1a;margin:0;padding:24px}' +
    '.wrap{max-width:560px;margin:0 auto;background:#fff;border:1px solid #ece8db}' +
    '.hdr{background:' + accent + ';color:#fff;padding:20px 28px;letter-spacing:.3em;font-size:11px;text-transform:uppercase}' +
    '.body{padding:28px}' +
    'table{width:100%;border-collapse:collapse}' +
    '.lbl{color:#888;font-size:10px;letter-spacing:.2em;text-transform:uppercase;padding:8px 0;width:120px;vertical-align:top}' +
    '.val{color:#1a1a1a;font-size:14px;padding:8px 0;line-height:1.5}' +
    '.msg{background:#faf9f5;border-left:3px solid ' + accent + ';padding:14px 18px;margin-top:18px;font-size:14px;line-height:1.6;font-style:italic;color:#333}' +
    '</style></head><body><div class="wrap">' +
    '<div class="hdr">' + label + '</div>' +
    '<div class="body">' +
    '<table>' +
    '<tr><td class="lbl">From</td><td class="val">' + escapeHtml(p.customerName || 'Unknown caller') + '</td></tr>' +
    '<tr><td class="lbl">Phone</td><td class="val"><a href="tel:' + phoneE164 + '" style="color:#1a1a1a">' + escapeHtml(p.callerPhone) + '</a></td></tr>' +
    bookingBlock +
    '<tr><td class="lbl">Received</td><td class="val">' + escapeHtml(ts) + ' ET</td></tr>' +
    callIdBlock +
    '</table>' +
    '<div class="msg">' + escapeHtml(p.messageText) + '</div>' +
    '</div></div></body></html>';
}

/**
 * Send a voicemail email to the shop with a customer message captured by Sofia.
 * Uses the same Gmail SMTP transport configured for confirmation emails.
 */
export async function sendVoicemailEmail(p: VoicemailPayload): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('[voicemail] GMAIL_USER or GMAIL_APP_PASSWORD missing');
    return false;
  }
  try {
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    const subject = subjectFor(p);
    const html = voicemailHtml(p);
    const textBody = 'Voicemail from ' + (p.customerName || 'Unknown') + ' (' + p.callerPhone + ')\n\n' +
      'Message: ' + p.messageText + '\n\n' +
      (p.booking ? 'Booking: ' + (p.booking.appointmentLabel || '') + ' ' + (p.booking.date || '') + ' ' + (p.booking.time || '') + '\n' : '') +
      (p.callId ? 'Call ID: ' + p.callId + '\n' : '');
    await transporter.sendMail({
      from: '"Mayller Bridal" <' + process.env.GMAIL_USER + '>',
      to: process.env.GMAIL_USER,
      subject,
      text: textBody,
      html,
    });
    return true;
  } catch (err) {
    console.error('[voicemail] send failed:', err);
    return false;
  }
}
