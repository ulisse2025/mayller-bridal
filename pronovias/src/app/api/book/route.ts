import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createBookingEvent } from '@/lib/google-calendar'
import { reserveSlot } from '@/lib/bookings'

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${DAYS_EN[d.getDay()]}, ${MONTHS_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function buildEmailHtml(data: {
  service: string
  date: string
  time: string
  name: string
  email: string
  phone: string
  notes?: string
}) {
  const formattedDate = formatDate(data.date)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
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
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <p class="hdr-brand">MAYLLER</p>
    <p class="hdr-sub">Luxury Bridal Since 1964</p>
    <div class="badge">New Booking</div>
  </div>
  <div class="body">
    <p class="section-title">Appointment Details</p>
    <div class="row">
      <div class="lbl">Service</div>
      <div class="val"><strong>${data.service}</strong></div>
    </div>
    <div class="row">
      <div class="lbl">Date</div>
      <div class="val">${formattedDate}</div>
    </div>
    <div class="row">
      <div class="lbl">Time</div>
      <div class="val">${data.time}</div>
    </div>
    <div class="divider"></div>
    <p class="section-title">Client Details</p>
    <div class="row">
      <div class="lbl">Name</div>
      <div class="val">${data.name}</div>
    </div>
    <div class="row">
      <div class="lbl">Email</div>
      <div class="val"><a href="mailto:${data.email}" style="color:#b45309;text-decoration:none">${data.email}</a></div>
    </div>
    <div class="row">
      <div class="lbl">Phone</div>
      <div class="val"><a href="tel:${data.phone}" style="color:#b45309;text-decoration:none">${data.phone}</a></div>
    </div>
    ${data.notes ? `<div class="row"><div class="lbl">Notes</div><div class="val" style="color:#666;font-style:italic">${data.notes}</div></div>` : ''}
  </div>
  <div class="ftr">
    <div class="ftr-brand">MAYLLER</div>
    <div class="ftr-note">Booking received on ${new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
  </div>
</div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { service, date, time, name, email, phone, notes } = body

    if (!service || !date || !time || !name || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const reserved = reserveSlot(date, time)
    if (!reserved) {
      return NextResponse.json({ error: 'This time slot is no longer available. Please choose another time.' }, { status: 409 })
    }

    const serviceLabel = service === 'wedding' ? 'Wedding Dress' : 'Alteration'
    const emailData = { service: serviceLabel, date, time, name, email, phone, notes }

    // ── Email notification ────────────────────────────────────────────────────
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD
    const notificationEmail = process.env.NOTIFICATION_EMAIL

    let emailSent = false
    if (gmailUser && gmailPass && !gmailPass.startsWith('xxxx')) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      })
      await transporter.sendMail({
        from: `"Mayller Bridal" <${gmailUser}>`,
        to: notificationEmail,
        subject: `✦ New Booking — ${serviceLabel} — ${formatDate(date)} ${time}`,
        html: buildEmailHtml(emailData),
      })
      emailSent = true
    } else {
      console.warn('Email credentials not configured — booking logged only.')
      console.log('BOOKING:', emailData)
    }

    // ── Google Calendar event ─────────────────────────────────────────────────
    const calResult = await createBookingEvent({ service, date, time, name, email, phone, notes })

    return NextResponse.json({ success: true, emailSent, calendarCreated: calResult.created })
  } catch (err) {
    console.error('Booking error:', err)
    return NextResponse.json({ error: 'Internal error. Please try again.' }, { status: 500 })
  }
}
