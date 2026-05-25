/**
 * src/lib/calendar-mirror.ts
 *
 * Periodic mirror Google Calendar -> Postgres.
 *
 * - Reads the next 60 days of events from the shared calendar.
 * - Upserts each event into the `bookings` table.
 * - Removes Postgres rows whose external_event_id no longer exists in the
 *   calendar (handles cancellations made by Sofia / Vapi).
 * - Sends a branded customer confirmation email for newly synced VOICE
 *   bookings (Sofia already sends SMS, this complements with email).
 *
 * Auth: reuses the same OAuth refresh token as /api/book (read-only scope
 * is enough but we keep calendar.events scope to share credentials).
 *
 * Safety: does NOT touch Sofia's code, does NOT write to the calendar,
 * does NOT modify rows where source='voice' beyond inserting them.
 */

import { google, calendar_v3 } from 'googleapis'
import { sql } from '@vercel/postgres'
import nodemailer, { Transporter } from 'nodemailer'

// ── time helpers ───────────────────────────────────────────────────────
const ET_TZ = 'America/New_York'

/** Parse Google Calendar dateTime to YYYY-MM-DD + "H:MM AM/PM" in ET */
function splitDateTimeET(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: ET_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
  const parts = fmt.formatToParts(d).reduce<Record<string, string>>((a, p) => {
    if (p.type !== 'literal') a[p.type] = p.value
    return a
  }, {})
  const date = `${parts.year}-${parts.month}-${parts.day}`
  const h = parts.hour
  const m = parts.minute
  const ap = parts.dayPeriod.toUpperCase()
  const time = `${parseInt(h, 10)}:${m} ${ap}`
  return { date, time }
}

/** Heuristic: infer service code from event summary (set by Sofia / web) */
function inferService(summary: string | null | undefined): 'wedding' | 'alteration' {
  const s = (summary || '').toLowerCase()
  if (s.includes('wedding') || s.includes('consultation') || s.includes('gown')) return 'wedding'
  return 'alteration'
}

/** Heuristic: infer source from event creator / organizer / description */
function inferSource(ev: calendar_v3.Schema$Event): 'web' | 'voice' | 'manual' {
  const haystack = `${ev.summary || ''}\n${ev.description || ''}`.toLowerCase()
  // [BookingID:n] tag is only injected by the web flow, strongest signal
  if (/\[bookingid:\d+\]/.test(haystack)) return 'web'
  if (haystack.includes('booked online') || haystack.includes('mayllerbridal.com')) return 'web'
  if (haystack.includes('vapi') || haystack.includes('sofia') || haystack.includes('voice')) return 'voice'
  // Default: assume Sofia (since the site already writes 'web' itself with external_event_id)
  return 'voice'
}

/** Extract email and phone from event attendees / description */
function extractCustomer(ev: calendar_v3.Schema$Event): {
  name: string; email: string; phone: string
} {
  const attendee = ev.attendees?.find(a => !a.organizer && !a.self)
  const email = attendee?.email || ''
  const name = attendee?.displayName || ''

  // Try to extract phone from description (Sofia writes "Phone: ...")
  const desc = ev.description || ''
  const phoneMatch = desc.match(/(?:Phone|Tel|Telephone)[:\s]+([+\d\s\-().]+)/i)
  const phone = phoneMatch ? phoneMatch[1].trim() : ''

  // Try to extract name if not in attendee
  let finalName = name
  if (!finalName) {
    const nameMatch = desc.match(/(?:Client|Customer|Name)[:\s]+([^\n]+)/i)
    if (nameMatch) finalName = nameMatch[1].trim()
  }

  return { name: finalName, email, phone }
}

// ── Google Calendar client ────────────────────────────────────────────
function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
  return client
}

async function listUpcomingEvents(): Promise<calendar_v3.Schema$Event[]> {
  const calendar = google.calendar({ version: 'v3', auth: getOAuthClient() })
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'
  const now = new Date()
  const future = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) // 60 days ahead

  const res = await calendar.events.list({
    calendarId,
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: true,
    maxResults: 500,
    orderBy: 'startTime',
  })
  return res.data.items || []
}

// ── Email (branded Mayller template, same look as /api/book) ──────────
function getMailer(): Transporter | null {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass || pass.startsWith('xxxx')) return null
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
}

function buildVoiceCustomerHtml(d: {
  name: string; date: string; time: string; service: string
}) {
  const firstName = d.name.split(' ')[0] || 'there'
  const serviceLabel = d.service === 'wedding' ? 'Wedding Dress Consultation' : 'Alteration Fitting'
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<style>
  body{margin:0;padding:0;background:#f5f5f0;font-family:Helvetica,Arial,sans-serif}
  .wrap{max-width:580px;margin:32px auto;background:#fff}
  .hdr{background:#0a0a0a;padding:56px 40px;text-align:center}
  .hdr-brand{color:#fff;font-size:28px;font-weight:300;letter-spacing:.35em;margin:0}
  .hdr-sub{color:rgba(255,255,255,.55);font-size:10px;letter-spacing:.3em;text-transform:uppercase;margin:10px 0 0}
  .body{padding:48px 40px;color:#1a1a1a}
  .greeting{font-size:22px;font-weight:300;margin:0 0 8px}
  .lede{font-size:14px;line-height:1.7;color:#555;margin:0 0 28px}
  .card{background:#faf9f5;border:1px solid #ece8db;padding:24px 28px;margin:0 0 28px}
  .card-title{font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:#b45309;margin:0 0 16px}
  .row{display:flex;padding:10px 0;border-bottom:1px solid #ece8db}
  .row:last-child{border-bottom:none}
  .lbl{color:#888;font-size:11px;letter-spacing:.15em;text-transform:uppercase;width:110px;flex-shrink:0;padding-top:2px}
  .val{color:#1a1a1a;font-size:14px;line-height:1.5}
  .ftr{background:#f5f5f0;padding:32px 40px;text-align:center}
  .ftr-brand{font-size:10px;letter-spacing:.3em;color:#888;text-transform:uppercase;margin:0}
  .ftr-addr{font-size:11px;color:#aaa;margin:8px 0 0;line-height:1.6}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <p class="hdr-brand">MAYLLER</p>
    <p class="hdr-sub">Luxury Bridal Italian Style</p>
  </div>
  <div class="body">
    <h1 class="greeting">Thank you, ${firstName}.</h1>
    <p class="lede">A friendly confirmation of the appointment you just booked over the phone. We look forward to welcoming you at the atelier.</p>
    <div class="card">
      <p class="card-title">Your Appointment</p>
      <div class="row"><div class="lbl">Service</div><div class="val"><strong>${serviceLabel}</strong></div></div>
      <div class="row"><div class="lbl">Date</div><div class="val">${d.date}</div></div>
      <div class="row"><div class="lbl">Time</div><div class="val">${d.time} (ET)</div></div>
    </div>
    <p style="font-size:13px;color:#555;line-height:1.7">Need to reschedule or cancel? Just reply to this email and we'll take care of it.</p>
    <p style="font-size:13px;color:#1a1a1a;margin-top:32px">With love,<br/><strong>The Mayller Team</strong></p>
  </div>
  <div class="ftr">
    <p class="ftr-brand">MAYLLER BRIDAL ITALIAN STYLE</p>
    <p class="ftr-addr">Sinking Spring, Pennsylvania</p>
  </div>
</div></body></html>`
}

async function sendVoiceCustomerEmail(opts: {
  to: string; name: string; date: string; time: string; service: string
}): Promise<boolean> {
  const t = getMailer()
  if (!t || !opts.to) return false
  try {
    const user = process.env.GMAIL_USER!
    const notif = process.env.NOTIFICATION_EMAIL || 'mayllerbridalitalianstyle@gmail.com'
    await t.sendMail({
      from: `"Mayller Bridal Italian Style" <${user}>`,
      to: opts.to,
      replyTo: notif,
      subject: `Your Mayller appointment — ${opts.date} ${opts.time}`,
      html: buildVoiceCustomerHtml({ name: opts.name, date: opts.date, time: opts.time, service: opts.service }),
    })
    return true
  } catch (err) {
    console.error('[calendar-mirror] voice email failed:', err)
    return false
  }
}

// ── Main sync ─────────────────────────────────────────────────────────
export type SyncResult = {
  ok: boolean
  scanned: number
  inserted: number
  updated: number
  cancelled: number
  emailsSent: number
  errors: string[]
}

export async function syncCalendarToPostgres(): Promise<SyncResult> {
  const result: SyncResult = {
    ok: true, scanned: 0, inserted: 0, updated: 0, cancelled: 0, emailsSent: 0, errors: [],
  }

  let events: calendar_v3.Schema$Event[] = []
  try {
    events = await listUpcomingEvents()
  } catch (err) {
    console.error('[calendar-mirror] list events failed:', err)
    result.ok = false
    result.errors.push(`list_events: ${String(err)}`)
    return result
  }

  result.scanned = events.length
  const seenIds = new Set<string>()

  for (const ev of events) {
    if (!ev.id || !ev.start?.dateTime || ev.status === 'cancelled') continue
    seenIds.add(ev.id)

    try {
      const { date, time } = splitDateTimeET(ev.start.dateTime)
      const service = inferService(ev.summary)
      const source = inferSource(ev)
      const { name, email, phone } = extractCustomer(ev)

      // Orphan cleanup: if this event was moved to a different slot, remove
      // any stale rows still keyed to the OLD slot_date/slot_time but pointing
      // to this event id. Without this the website would keep the old slot
      // marked as booked after every reschedule.
      try {
        await sql`
          DELETE FROM bookings
          WHERE external_event_id = ${ev.id}
            AND (slot_date <> ${date} OR slot_time <> ${time})
        `
      } catch (err) {
        console.error('[calendar-mirror] orphan cleanup failed for', ev.id, err)
      }

      // Upsert by external_event_id (preferred) — fallback by slot_date+time
      const upsert = await sql`
        INSERT INTO bookings
          (slot_date, slot_time, service, customer_name, customer_email,
           customer_phone, source, external_event_id, customer_email_sent,
           updated_at)
        VALUES
          (${date}, ${time}, ${service}, ${name || 'Unknown'}, ${email || ''},
           ${phone || ''}, ${source}, ${ev.id}, FALSE, NOW())
        ON CONFLICT (slot_date, slot_time) DO UPDATE
          SET external_event_id = EXCLUDED.external_event_id,
              source = COALESCE(NULLIF(bookings.source, ''), EXCLUDED.source),
              customer_name = COALESCE(NULLIF(bookings.customer_name, ''), EXCLUDED.customer_name),
              customer_email = COALESCE(NULLIF(bookings.customer_email, ''), EXCLUDED.customer_email),
              customer_phone = COALESCE(NULLIF(bookings.customer_phone, ''), EXCLUDED.customer_phone),
              updated_at = NOW()
        RETURNING (xmax = 0) AS inserted, customer_email_sent, source, customer_email, customer_name
      `

      const row = upsert.rows[0] as {
        inserted: boolean; customer_email_sent: boolean
        source: string; customer_email: string; customer_name: string
      } | undefined

      if (!row) continue
      if (row.inserted) result.inserted++; else result.updated++

      // If this is a voice booking we haven't emailed yet, send the email
      if (row.source === 'voice' && !row.customer_email_sent && row.customer_email) {
        const sent = await sendVoiceCustomerEmail({
          to: row.customer_email,
          name: row.customer_name,
          date,
          time,
          service,
        })
        if (sent) {
          await sql`UPDATE bookings SET customer_email_sent = TRUE WHERE external_event_id = ${ev.id}`
          result.emailsSent++
        }
      }
    } catch (err) {
      console.error('[calendar-mirror] upsert failed for event', ev.id, err)
      result.errors.push(`upsert ${ev.id}: ${String(err)}`)
    }
  }

  // Cancellation sync: rows with external_event_id NOT in seenIds (and future) -> delete
  if (seenIds.size > 0) {
    try {
      // @vercel/postgres tagged template does not accept arrays as parameters.
      // We pass the ids as a comma-separated string and split it server-side
      // using string_to_array.
      const idsCsv = Array.from(seenIds).join(',')
      const cancelled = await sql`
        DELETE FROM bookings
        WHERE external_event_id IS NOT NULL
          AND external_event_id <> ALL(string_to_array(${idsCsv}, ','))
          AND (slot_date || ' ' || slot_time)::timestamp > NOW() - INTERVAL '1 hour'
        RETURNING id
      `
      result.cancelled = cancelled.rowCount ?? 0
    } catch (err) {
      console.error('[calendar-mirror] cancellation sweep failed:', err)
      result.errors.push(`cancellation_sweep: ${String(err)}`)
    }
  }

  return result
}
