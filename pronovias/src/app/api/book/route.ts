/**
 * src/app/api/book/route.ts
 *
 * Booking endpoint - production version.
 *
 * Pipeline (v2 - May 2026):
 *  1. Validate payload
 *  2. Realtime double-check: freebusy on Google Calendar (catches recent Sofia bookings)
 *  3. Atomically reserve slot in Postgres (with source='web')
 *  4. Create Google Calendar event - get back external_event_id
 *  5. Update Postgres row with external_event_id (so cron sync won't dup it)
 *  6. Send notification email to the shop
 *  7. Send branded confirmation email to the customer
 *  7b. Send confirmation SMS to the customer (only if smsConsent === true)
 *  8. Return result. Email/SMS failures DO NOT roll back the booking.
 *  9. If calendar creation fails AFTER reserveSlot, we still keep the row
 *     so the slot stays held; Stefano can resolve manually if needed.
 */

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createBookingEvent, isSlotBusyOnCalendar } from '@/lib/google-calendar'
import { reserveSlot, releaseSlot, updateBookingExternalRef } from '@/lib/bookings'
import { sendConfirmationSMS } from '@/lib/notifications'
import { getStoreClosure } from '@/lib/booking-types'
import type { BookingResult } from '@/lib/booking-types'

export const runtime = 'nodejs'

/**
 * Fase 3 (June 2026): maps the web form service id to display label,
 * Sofia-compatible appointmentType and duration, so the form can offer
 * Tuxedo Fitting (60 min) alongside Wedding / Alteration.
 */
const SERVICE_MAP: Record<string, { label: string; appointmentType: 'wedding_consultation' | 'alteration' | 'tuxedo_fitting'; duration: number }> = {
  wedding: { label: 'Wedding Dress', appointmentType: 'wedding_consultation', duration: 90 },
  alteration: { label: 'Alteration', appointmentType: 'alteration', duration: 30 },
  tuxedo_fitting: { label: 'Tuxedo Fitting', appointmentType: 'tuxedo_fitting', duration: 60 },
}

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`)
  return `${DAYS_EN[d.getDay()]}, ${MONTHS_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/* ─── EMAIL TEMPLATES (unchanged) ─────────────────────────────────────── */

interface EmailData {
  service: string
  date: string
  time: string
  name: string
  email: string
  phone: string
  notes?: string
  shortBookingId?: string
}

function buildShopNotificationHtml(d: EmailData) {
  const formattedDate = formatDate(d.date)
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/>
<style>
  body{margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif}
  .wrap{max-width:580px;margin:32px auto;background:#fff}
  .hdr{background:#0a0a0a;padding:48px 40px;text-align:center}
  .hdr-brand{color:#fff;font-size:26px;font-weight:300;letter-spacing:.35em;margin:0}
  .hdr-sub{color:rgba(255,255,255,.4);font-size:10px;letter-spacing:.3em;text-transform:uppercase;margin:8px 0 0}
  .badge{display:inline-block;background:#b45309;color:#fff;font-size:9px;letter-spacing:.25em;text-transform:uppercase;padding:6px 14px;margin-top:16px}
  .body{padding:40px}
  .section-title{font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:#999;margin:0 0 20px}
  .row{display:flex;padding:14px 0;border-bottom:1px solid #f0ede8}
  .row:last-child{border-bottom:none}
  .lbl{color:#aaa;font-size:11px;letter-spacing:.15em;text-transform:uppercase;width:120px;flex-shrink:0;padding-top:2px}
  .val{color:#1a1a1a;font-size:14px;line-height:1.5}
  .divider{height:1px;background:#f0ede8;margin:24px 0}
  .ftr{background:#f5f5f0;padding:24px 40px;text-align:center}
  .ftr-brand{font-size:10px;letter-spacing:.3em;color:#aaa;text-transform:uppercase}
  .ftr-note{font-size:11px;color:#bbb;margin-top:4px}
</style></head>
<body>
<div class="wrap">
  <div class="hdr">
    <p class="hdr-brand">MAYLLER</p>
    <p class="hdr-sub">Luxury Bridal Italian Style</p>
    <div class="badge">New Booking - Web</div>
  </div>
  <div class="body">
    <p class="section-title">Appointment Details</p>
    <div class="row"><div class="lbl">Service</div><div class="val"><strong>${d.service}</strong></div></div>
    <div class="row"><div class="lbl">Date</div><div class="val">${formattedDate}</div></div>
    <div class="row"><div class="lbl">Time</div><div class="val">${d.time}</div></div>
    <div class="divider"></div>
    <p class="section-title">Client Details</p>
    <div class="row"><div class="lbl">Name</div><div class="val">${d.name}</div></div>
    <div class="row"><div class="lbl">Email</div><div class="val"><a href="mailto:${d.email}" style="color:#b45309;text-decoration:none">${d.email}</a></div></div>
    <div class="row"><div class="lbl">Phone</div><div class="val"><a href="tel:${d.phone}" style="color:#b45309;text-decoration:none">${d.phone}</a></div></div>
    ${d.notes ? `<div class="row"><div class="lbl">Notes</div><div class="val" style="color:#666;font-style:italic">${d.notes}</div></div>` : ''}
  </div>
  <div class="ftr">
    <div class="ftr-brand">MAYLLER</div>
    <div class="ftr-note">Received on ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} ET</div>
  </div>
</div>
</body>
</html>`
}

function buildCustomerConfirmationHtml(d: EmailData) {
  const formattedDate = formatDate(d.date)
  const firstName = d.name.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/>
<style>
  body{margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif}
  .wrap{max-width:580px;margin:32px auto;background:#fff}
  .hdr{background:#0a0a0a;padding:56px 40px;text-align:center}
  .hdr-brand{color:#fff;font-size:28px;font-weight:300;letter-spacing:.35em;margin:0}
  .hdr-sub{color:rgba(255,255,255,.55);font-size:10px;letter-spacing:.3em;text-transform:uppercase;margin:10px 0 0}
  .body{padding:48px 40px;color:#1a1a1a}
  .greeting{font-size:22px;font-weight:300;letter-spacing:.02em;margin:0 0 8px;color:#1a1a1a}
  .lede{font-size:14px;line-height:1.7;color:#555;margin:0 0 28px}
  .card{background:#faf9f5;border:1px solid #ece8db;padding:24px 28px;margin:0 0 28px}
  .card-title{font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:#b45309;margin:0 0 16px}
  .row{display:flex;padding:10px 0;border-bottom:1px solid #ece8db}
  .row:last-child{border-bottom:none}
  .lbl{color:#888;font-size:11px;letter-spacing:.15em;text-transform:uppercase;width:110px;flex-shrink:0;padding-top:2px}
  .val{color:#1a1a1a;font-size:14px;line-height:1.5}
  .note{font-size:13px;line-height:1.7;color:#555;margin:0 0 20px}
  .ftr{background:#f5f5f0;padding:32px 40px;text-align:center}
  .ftr-brand{font-size:10px;letter-spacing:.3em;color:#888;text-transform:uppercase;margin:0}
  .ftr-addr{font-size:11px;color:#aaa;margin:8px 0 0;line-height:1.6}
  .ftr-link{color:#b45309;text-decoration:none}
</style></head>
<body>
<div class="wrap">
  <div class="hdr">
    <p class="hdr-brand">MAYLLER</p>
    <p class="hdr-sub">Luxury Bridal Italian Style</p>
  </div>
  <div class="body">
    <h1 class="greeting">Thank you, ${firstName}.</h1>
    <p class="lede">Your appointment has been received. We're looking forward to welcoming you and helping you find the perfect dress for your special day.</p>
    <div class="card">
      <p class="card-title">Your Appointment</p>
      <div class="row"><div class="lbl">Service</div><div class="val"><strong>${d.service}</strong></div></div>
      <div class="row"><div class="lbl">Date</div><div class="val">${formattedDate}</div></div>
      <div class="row"><div class="lbl">Time</div><div class="val">${d.time} (ET)</div></div>
      ${d.shortBookingId ? '<div class="row"><div class="lbl">Code</div><div class="val" style="font-family:monospace;font-weight:700;letter-spacing:0.2em;color:#b45309">' + d.shortBookingId + '</div></div>' : ''}
    </div>
    <p class="note"><strong>A few things to know before you arrive:</strong></p>
    <p class="note">- Please arrive 5 minutes early so we can welcome you properly.<br/>
       - Feel free to bring up to two guests with you.<br/>
       - If you have inspiration photos or a Pinterest board, bring them along — we'd love to see your vision.<br/>
       - Need to reschedule? Just reply to this email and we'll take care of it.</p>
    <p class="note" style="margin-top:32px;color:#1a1a1a">With love,<br/><strong>The Mayller Team</strong></p>
  </div>
  <div class="ftr">
    <p class="ftr-brand">MAYLLER BRIDAL ITALIAN STYLE</p>
    <p class="ftr-addr">Sinking Spring, Pennsylvania<br/>
      <a class="ftr-link" href="mailto:mayllerbridalitalianstyle@gmail.com">mayllerbridalitalianstyle@gmail.com</a>
    </p>
  </div>
</div>
</body>
</html>`
}

/* ─── POST /api/book ──────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { service, date, time, name, email, phone, notes, smsConsent } = body

    if (!service || !date || !time || !name || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    const svc = SERVICE_MAP[service]
    if (!svc) {
      return NextResponse.json({ error: 'Unknown service.' }, { status: 400 })
    }
    const serviceLabel = svc.label

    // 1b. Store closed for vacation/holiday? Reject before reserving a slot.
    //     Single source of truth: STORE_CLOSURES in booking-types.ts.
    //     Uses 400 (not 409) so the client surfaces this exact message instead
    //     of the generic "slot just taken" copy reserved for 409.
    const closure = getStoreClosure(date)
    if (closure) {
      return NextResponse.json(
        { error: `Our boutique is closed for ${closure.reason.toLowerCase()} from ${formatDate(closure.from)} through ${formatDate(closure.to)}. Please choose a date outside that period.` },
        { status: 400 },
      )
    }

    // 2. REALTIME freebusy double-check (covers race with Sofia)
    try {
      const busy = await isSlotBusyOnCalendar(date, time, service)
      if (busy) {
        return NextResponse.json(
          { error: 'This time slot was just taken (possibly via phone). Please choose another time.' },
          { status: 409 },
        )
      }
    } catch (fbErr) {
      // freebusy is a safety net; don't block the booking if it fails
      console.warn('[book] freebusy check failed, continuing:', fbErr)
    }

    // 3. Atomically reserve in Postgres
    let bookingId: number | null = null
    try {
      bookingId = await reserveSlot(date, time, {
        service, name, email, phone, notes,
        source: 'web',
        consent: smsConsent === true, // persist SMS consent for the 24h reminder cron
      })
    } catch (dbErr) {
      console.error('DB error reserving slot:', dbErr)
      return NextResponse.json({ error: 'We could not save your booking. Please try again.' }, { status: 500 })
    }
    if (!bookingId) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please choose another time.' },
        { status: 409 },
      )
    }

    const emailData: EmailData = { service: serviceLabel, date, time, name, email, phone, notes }

    // 4. Google Calendar (best effort)
    const calResult = await createBookingEvent({
      service, date, time, name, email, phone, notes,
            bookingId,


    })

    if (calResult.shortBookingId) emailData.shortBookingId = calResult.shortBookingId

    // 5. Update Postgres with external_event_id so the cron mirror won't try
    //    to re-insert this event or send a duplicate email.
    if (calResult.created && calResult.eventId) {
      try {
        await updateBookingExternalRef(bookingId, calResult.eventId, /*emailSent*/ true)
      } catch (e) {
        console.warn('[book] could not write external_event_id:', e)
      }
    } else {
      // Still mark email_sent to avoid duplicate from cron
      try { await updateBookingExternalRef(bookingId, '', true) } catch {}
    }

    // 6 + 7. Send emails (best effort)
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD
    const notificationEmail = process.env.NOTIFICATION_EMAIL || 'mayllerbridalitalianstyle@gmail.com'

    let shopEmailSent = false
    let customerEmailSent = false

    if (gmailUser && gmailPass && !gmailPass.startsWith('xxxx')) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: gmailUser, pass: gmailPass },
        })
        const [shopRes, custRes] = await Promise.allSettled([
          transporter.sendMail({
            from: `"Mayller Bridal" <${gmailUser}>`,
            to: notificationEmail,
            subject: `New Booking - ${serviceLabel} - ${formatDate(date)} ${time}`,
            html: buildShopNotificationHtml(emailData),
          }),
          transporter.sendMail({
            from: `"Mayller Bridal Italian Style" <${gmailUser}>`,
            to: email,
            replyTo: notificationEmail,
            subject: `Your appointment is confirmed - ${formatDate(date)}`,
            html: buildCustomerConfirmationHtml(emailData),
          }),
        ])
        shopEmailSent = shopRes.status === 'fulfilled'
        customerEmailSent = custRes.status === 'fulfilled'
        if (shopRes.status === 'rejected') console.error('Shop email failed:', shopRes.reason)
        if (custRes.status === 'rejected') console.error('Customer email failed:', custRes.reason)
      } catch (mailErr) {
        console.error('Email transport error:', mailErr)
      }
    }

    // 7b. SMS confirmation — only if the customer ticked the consent box
    let smsSent = false
    if (smsConsent === true && phone) {
      try {
        await sendConfirmationSMS({
          bookingId: calResult.shortBookingId || String(bookingId),
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          date,
          time,
          appointmentType: svc.appointmentType,
          label: serviceLabel,
          duration: svc.duration,
        } as BookingResult)
        smsSent = true
      } catch (smsErr) {
        console.error('[book] SMS failed (booking still OK):', smsErr)
      }
    }

    return NextResponse.json({
      success: true,
      bookingId,
      shopEmailSent,
      customerEmailSent,
      smsSent,
      calendarCreated: calResult.created,
    })
  } catch (err) {
    console.error('Booking error:', err)
    return NextResponse.json({ error: 'Internal error. Please try again.' }, { status: 500 })
  }
}
