/**
 * src/lib/google-calendar.ts
 *
 * Google Calendar integration for the WEB booking flow.
 *
 * IMPORTANT: this file is the WEB path. Sofia (Vapi voice agent) uses a
 * separate path: /lib/vapi-calendar.ts with its own credentials. Do NOT
 * cross-wire the two.
 *
 * v2 (May 2026):
 *  - createBookingEvent returns the calendar event id so the caller can
 *    store it in Postgres (for cron mirror dedup).
 *  - Added isSlotBusyOnCalendar() for realtime double-check.
 *
 * v3 (2026-05-24):
 *  - createBookingEvent now accepts an optional bookingId and injects a
 *    machine-readable [BookingID:n] tag into the event summary and
 *    description. Sofia (Vapi) and the calendar mirror parse that tag
 *    to manage web-originated bookings the same way as voice ones.
 *  - Added extractBookingIdFromEvent() utility for consumers.
 */

import { google } from 'googleapis'
import { randomUUID } from 'crypto'
const TIMEZONE = 'America/New_York'

const DURATION_MINUTES: Record<string, number> = {
    alteration: 30,
    wedding: 90,
}

const SERVICE_LABELS: Record<string, string> = {
    alteration: 'Alteration',
    wedding: 'Wedding Dress',
}

function getOAuthClient() {
    const client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
        )
    client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
    return client
}

function getRedirectUri(): string {
    if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/auth/google/callback`
    return 'http://localhost:3000/api/auth/google/callback'
}

export function getAuthUrl(): string {
    const client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          getRedirectUri(),
        )
    return client.generateAuthUrl({
          access_type: 'offline',
          prompt: 'consent',
          scope: [
                  'https://www.googleapis.com/auth/calendar.events',
                  'https://www.googleapis.com/auth/calendar.readonly',
                ],
    })
}

export async function exchangeCodeForTokens(code: string) {
    const client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          getRedirectUri(),
        )
    const { tokens } = await client.getToken(code)
    return tokens
}

function pad(n: number): string {
    return String(n).padStart(2, '0')
}

function buildLocalDateTime(date: string, hours: number, minutes: number): string {
    return `${date}T${pad(hours)}:${pad(minutes)}:00`
}

/** Parse "10:00 AM" / "2:30 PM" into 24h {hh, mm}. */
function parse12h(time: string): { hh: number; mm: number } {
    const m = time.match(/(\d+):(\d+)\s*(AM|PM)/i)
    let hh = m ? parseInt(m[1], 10) : 10
    const mm = m ? parseInt(m[2], 10) : 0
    const ap = m ? m[3].toUpperCase() : 'AM'
    if (ap === 'PM' && hh !== 12) hh += 12
    if (ap === 'AM' && hh === 12) hh = 0
    return { hh, mm }
}

function etLocalToUTC(localISO: string): Date {
    for (const offset of ['-04:00', '-05:00']) {
          const candidate = new Date(`${localISO}${offset}`)
          const fmt = new Intl.DateTimeFormat('en-US', {
                  timeZone: 'America/New_York', hourCycle: 'h23',
                  year: 'numeric', month: '2-digit', day: '2-digit',
                  hour: '2-digit', minute: '2-digit',
          }).formatToParts(candidate).reduce<Record<string, string>>((a, p) => {
                  if (p.type !== 'literal') a[p.type] = p.value
                  return a
          }, {})
          const wall = `${fmt.year}-${fmt.month}-${fmt.day}T${fmt.hour}:${fmt.minute}:00`
          if (wall === localISO) return candidate
    }
    return new Date(`${localISO}-05:00`)
}

/**
 * Extract the Postgres bookings.id from a Google Calendar event's summary or
 * description, looking for the `[BookingID:N]` tag injected by web bookings.
 * Returns null for events without the tag (typically voice bookings).
 */
export function extractBookingIdFromEvent(ev: {
    summary?: string | null
    description?: string | null
}): number | null {
    const haystack = `${ev.summary ?? ''}\n${ev.description ?? ''}`
    const m = haystack.match(/\[BookingID:(\d+)\]/)
    return m ? parseInt(m[1], 10) : null
}

export async function isSlotBusyOnCalendar(date: string, time: string, service: string): Promise<boolean> {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) return false

  const { hh, mm } = parse12h(time)
    const duration = DURATION_MINUTES[service] ?? 60
    const startLocal = buildLocalDateTime(date, hh, mm)
    const endMins = hh * 60 + mm + duration
    const endLocal = buildLocalDateTime(date, Math.floor(endMins / 60), endMins % 60)

  const startUTC = etLocalToUTC(startLocal)
    const endUTC = etLocalToUTC(endLocal)

  const calendar = google.calendar({ version: 'v3', auth: getOAuthClient() })
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'

  const res = await calendar.freebusy.query({
        requestBody: {
                timeMin: startUTC.toISOString(),
                timeMax: endUTC.toISOString(),
                items: [{ id: calendarId }],
        },
  })
    const busy = res.data.calendars?.[calendarId]?.busy ?? []
        return busy.length > 0
}

export async function createBookingEvent(data: {
    service: string
    date: string
    time: string
    name: string
    email: string
    phone: string
    notes?: string
    /**
     * Postgres bookings.id of this reservation.
     * Embedded in event title and description so Sofia (Vapi voice agent)
     * and any human operator can look it up and manage the booking.
     */
                                           bookingId?: number
}): Promise<{ created: boolean; eventId?: string; reason?: string ; shortBookingId?: string }> {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
        console.warn('Google Calendar credentials not configured - skipping event creation.')
        return { created: false, reason: 'missing-credentials' }
  }

  try {
        const auth = getOAuthClient()
        const calendar = google.calendar({ version: 'v3', auth })

      const duration = DURATION_MINUTES[data.service] ?? 60
        const label = SERVICE_LABELS[data.service] ?? data.service

      const { hh, mm } = parse12h(data.time)
        const startMinutes = hh * 60 + mm
        const endMinutes = startMinutes + duration
        const endHH = Math.floor(endMinutes / 60)
        const endMM = endMinutes % 60

      const startLocal = buildLocalDateTime(data.date, hh, mm)
        const endLocal = buildLocalDateTime(data.date, endHH, endMM)

      console.log(`[google-calendar] Creating event: ${label} on ${data.date} at ${data.time} (startLocal=${startLocal})`)

      const bookingUuid = randomUUID()
          const shortBookingId = bookingUuid.slice(0, 8).toUpperCase()
              const idTag = data.bookingId ? `[BookingID:${data.bookingId}]` : ''

      const description = [
              `Service: ${label} (${duration} min)`,
              `Client: ${data.name}`,
              `Email: ${data.email}`,
              `Phone: ${data.phone}`,
              data.notes ? `Notes: ${data.notes}` : null,
              '',
              data.bookingId ? `Booking ID: ${data.bookingId}` : null,
              `Source: web (mayllerbridal.com)`,
              data.bookingId ? idTag : null,
            ].filter(Boolean).join('\n')

      // Clean human-readable summary; the [BookingID:N] tag lives in description for the cron mirror,
    // and the customer-facing 8-char shortBookingId is in extendedProperties + the confirmation email.
    const summary = `Mayller Bridal - ${label} - ${data.name}`

      const insertRes = await calendar.events.insert({
              calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
              sendUpdates: 'all',
              requestBody: {
                        summary,
                        description,
                        location: process.env.BUSINESS_ADDRESS || 'Mayller Bridal Italian Style, Sinking Spring, PA',
                        start: { dateTime: startLocal, timeZone: TIMEZONE },
                        end: { dateTime: endLocal, timeZone: TIMEZONE },
                        attendees: [{ email: data.email, displayName: data.name }],
                  extendedProperties: {
                      private: {
                          bookingId: bookingUuid,
                          shortBookingId,
                          customerName: data.name,
                          customerPhone: data.phone,
                          customerEmail: data.email,
                          appointmentType: data.service,
                          notes: data.notes ?? '',
                          source: 'web',
                      },
                  },
                        reminders: {
                                    useDefault: false,
                                    overrides: [
                                      { method: 'email', minutes: 24 * 60 },
                                      { method: 'popup', minutes: 60 },
                                                ],
                        },
              },
      })

      return { created: true, eventId: insertRes.data.id || undefined, shortBookingId }
  } catch (err) {
        console.error('Google Calendar error:', err)
        return { created: false, reason: 'api-error' }
  }
}
