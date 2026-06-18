// src/lib/reminders.ts
//
// 24h SMS reminder logic for Mayller Bridal.
// Queries tomorrow's appointments (America/New_York) that have SMS consent and
// have not been reminded yet, and sends each customer a reminder via Twilio.
//
// Used by:
//   - /api/cron/reminders          (dedicated endpoint, manual test + optional cron)
//   - /api/cron/sync-calendar      (daily 09:00 ET cron, calls this best-effort)
//
// Idempotent: the bookings.reminder_sent flag guarantees a customer is reminded
// at most once, even if this runs twice in the same day.
//
// IMPORTANT — real schema (data/db-schema.sql): the table is `bookings` with
// columns slot_date (DATE), slot_time (TEXT, already "10:30 AM" format), service
// (form id: 'wedding' | 'alteration' | 'tuxedo_fitting'), customer_name,
// customer_phone, plus sms_consent + reminder_sent added by the v4 migration.

import { sql } from '@vercel/postgres'
import { STORE_ADDRESS, STORE_PHONE } from './booking-types'

export interface ReminderResult {
  date: string
  total: number
  sent: number
  failed: number
  dryRun: boolean
}

interface DueRow {
  id: number
  customer_name: string
  customer_phone: string
  slot_date: string // forced to "YYYY-MM-DD" via to_char in the query
  slot_time: string // e.g. "10:30 AM"
  service: string
}

// --- helpers ---------------------------------------------------------------

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  return phone.startsWith('+') ? phone : `+${digits}`
}

// slot_time from the website is already "H:MM AM/PM". Voice/mirror rows could be
// "HH:MM" 24h — handle both defensively.
function formatTime(slot: string): string {
  const s = (slot || '').trim()
  if (/[ap]m/i.test(s)) return s.replace(/\s+/g, ' ').toUpperCase()
  const m = s.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return s
  const h = parseInt(m[1], 10)
  const min = m[2]
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${min} ${ampm}`
}

// "YYYY-MM-DD" -> "Wednesday, July 9" in ET. Anchor at 12:00 UTC so the calendar
// day never shifts under any timezone/DST condition.
function formatDateReadable(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  return dt.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  })
}

function serviceLabel(service: string): string {
  switch ((service || '').toLowerCase()) {
    case 'wedding':
    case 'wedding_consultation':
      return 'Wedding Dress Consultation'
    case 'tuxedo_fitting':
      return 'Tuxedo Fitting'
    case 'alteration':
      return 'Alteration'
    default:
      return 'appointment'
  }
}

// Tomorrow's date in America/New_York as "YYYY-MM-DD".
function tomorrowET(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const [y, m, d] = fmt.format(now).split('-').map(Number)
  // Advance one day using a 12:00 UTC anchor (DST-safe), then re-read in ET.
  const next = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0))
  return fmt.format(next)
}

// --- Twilio send (mirrors lib/notifications.ts: REST, no SDK, 8s timeout) ----

async function sendReminderSMS(toRaw: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials missing (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)')
  }

  const params: Record<string, string> = { To: formatPhone(toRaw), Body: body }
  if (messagingServiceSid) {
    params.MessagingServiceSid = messagingServiceSid // A2P 10DLC compliant path
  } else if (from) {
    params.From = from
  } else {
    throw new Error('No Twilio sender configured (TWILIO_MESSAGING_SERVICE_SID / TWILIO_PHONE_NUMBER)')
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params).toString(),
      signal: AbortSignal.timeout(8_000),
    },
  )

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    throw new Error(`Twilio HTTP ${resp.status}: ${txt.substring(0, 200)}`)
  }
}

function buildBody(name: string, dateStr: string, timeStr: string, service: string): string {
  return (
    `Hi ${name}! This is a reminder from Mayller Bridal Italian Style. ` +
    `You have a ${serviceLabel(service)} appointment tomorrow, ${dateStr} at ${timeStr}. ` +
    `We are located at ${STORE_ADDRESS}. ` +
    `Questions? Call us at ${STORE_PHONE}. See you tomorrow! Reply STOP to opt out.`
  )
}

// --- main ------------------------------------------------------------------

/**
 * Send reminders for every consenting, not-yet-reminded appointment scheduled
 * for tomorrow (ET). Pass { dryRun: true } to compute the set and return counts
 * WITHOUT sending any SMS or writing reminder_sent (safe for preview testing).
 */
export async function sendDueReminders(
  opts: { dryRun?: boolean } = {},
): Promise<ReminderResult> {
  const dryRun = opts.dryRun === true
  const date = tomorrowET()

  // Idempotent inline migration so a fresh DB never 500s. The authoritative
  // statements live in data/db-schema.sql and should be run there once.
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN NOT NULL DEFAULT FALSE`
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE`

  const { rows } = await sql<DueRow>`
    SELECT
      id,
      customer_name,
      customer_phone,
      to_char(slot_date, 'YYYY-MM-DD') AS slot_date,
      slot_time,
      service
    FROM bookings
    WHERE slot_date = ${date}::date
      AND sms_consent = TRUE
      AND reminder_sent = FALSE
      AND customer_phone IS NOT NULL
      AND customer_phone <> ''
    ORDER BY slot_time
  `

  console.log(`[reminders] date=${date} due=${rows.length} dryRun=${dryRun}`)

  let sent = 0
  let failed = 0

  for (const row of rows) {
    if (dryRun) continue

    const body = buildBody(
      row.customer_name,
      formatDateReadable(row.slot_date),
      formatTime(row.slot_time),
      row.service,
    )

    try {
      await sendReminderSMS(row.customer_phone, body)
      await sql`UPDATE bookings SET reminder_sent = TRUE WHERE id = ${row.id}`
      sent++
      console.log(`[reminders] sent to ${row.customer_name} (${row.customer_phone})`)
    } catch (err) {
      failed++
      console.error(`[reminders] FAILED for booking ${row.id}:`, err)
    }

    // Gentle pacing between messages.
    await new Promise((r) => setTimeout(r, 300))
  }

  return { date, total: rows.length, sent, failed, dryRun }
}
