// ============================================================
// MAYLLER BRIDAL — Booking System
// lib/notifications.ts
// Email via Gmail (Nodemailer + App Password) + SMS via Twilio REST API
// NOTE: SMS uses fetch() directly — no Twilio SDK / no Axios 30s timeout
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

// ── Email (Gmail + App Password) ──────────────────────────────

function getMailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER!,         // mayllerbridalitalianstyle@gmail.com
      pass: process.env.GMAIL_APP_PASSWORD!, // 16-char App Password from Google
    },
  });
}

// ── SMS via Twilio REST API (no SDK, no Axios) ────────────────

/**
 * Send an SMS via Twilio REST API using native fetch().
 * Uses AbortSignal.timeout(8000) to fail fast if Twilio is unreachable.
 */
async function sendTwilioSMS(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken  = process.env.TWILIO_AUTH_TOKEN!;
  const from       = process.env.TWILIO_PHONE_NUMBER!;

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
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

// ── Email Templates ───────────────────────────────────────────

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
                We can't wait to be part of your special journey. ✨
              </p>
              <p style="margin:8px 0 0;font-size:15px;color:#555;">
                — The ${STORE_NAME} Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f5f5;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;font-size:11px;color:#aaa;letter-spacing:1px;">
                © 2026 ${STORE_NAME} · ${STORE_ADDRESS}
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

  return `<h2 style="color:#1a1a1a;">🤖 New Booking — Sofia AI</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
  <tr><td><b>Customer</b></td><td>${booking.customerName}</td></tr>
  <tr><td><b>Phone</b></td><td>${booking.customerPhone}</td></tr>
  <tr><td><b>Email</b></td><td>${booking.customerEmail ?? '—'}</td></tr>
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

// ── Public Functions ──────────────────────────────────────────

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
        subject: `✨ Appointment Confirmed — ${config.label} | Mayller Bridal`,
        html: customerEmailHTML(booking),
      })
    );
  }

  // Notification email to the store (always)
  promises.push(
    transporter.sendMail({
      from: `"Sofia AI Booking" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER!,
      subject: `📅 New Booking [${shortId}] — ${config.label} — ${booking.customerName}`,
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
