/**
 * src/lib/google-calendar.ts
 *
 * Google Calendar integration for the WEB booking flow.
 *
 * FIX (2026-06-02): the WEB path now authenticates with the SAME Google
 * Service Account that Sofia (vapi-calendar.ts) uses, instead of a personal
 * OAuth refresh token. The OAuth refresh token kept expiring (the OAuth
 * consent screen is in "Testing" mode -> 7-day token expiry), which made
 * website bookings silently fail to appear on Google Calendar while the
 * confirmation email still went out. The service account never expires.
 *
 * Two behavioural notes vs the old OAuth version:
 *  - A service account WITHOUT domain-wide delegation cannot invite
 *    attendees, so we no longer add the customer as an attendee and no
 *    longer call sendUpdates:'all'. The customer still receives the branded
 *    confirmation email sent by /api/book, exactly like before.
 *  - Everything else (extendedProperties, [BookingID:N] tag, shortBookingId,
 *    timezone handling) is unchanged, so Sofia and the cron mirror keep
 *    recognising web bookings.
 *
 * The old OAuth helpers (getAuthUrl / exchangeCodeForTokens) are kept so the
 * /api/auth/google/callback route still compiles, but they are no longer on
 * the booking path.
 */

import { google } from 'googleapis'
import { randomUUID } from 'crypto'
const TIMEZONE = 'America/New_York'

const DURATION_MINUTES: Record<string, number> = {
    alteration: 30,
    wedding: 90,
    tuxedo_fitting: 60,
}

const SERVICE_LABELS: Record<string, string> = {
    alteration: 'Alteration',
    wedding: 'Wedding Dress',
    tuxedo_fitting: 'Tuxedo Fitting',
}

/**
 * Service-account auth, identical to the one Sofia uses in vapi-calendar.ts.
 * Vercel stores the multiline private key with literal \n, so we restore the
 * real newlines here.
 */
function getCalendarAuth() {
    return new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL!,
            private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/calendar'],
    })
}

/* ─── Legacy OAuth helpers (kept only for /api/auth/google/callback) ────── */

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
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) return false

  const { hh, mm } = parse12h(time)
    const duration = DURATION_MINUTES[service] ?? 60
    const startLocal = buildLocalDateTime(date, hh, mm)
    const endMins = hh * 60 + mm + duration
    const endLocal = buildLocalDateTime(date, Math.floor(endMins / 60), endMins % 60)

  const startUTC = etLocalToUTC(startLocal)
    const endUTC = etLocalToUTC(endLocal)

  const calendar = google.calendar({ version: 'v3', auth: getCalendarAuth() })
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
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
        console.warn('Google Calendar service account not configured - skipping event creation.')
        return { created: false, reason: 'missing-credentials' }
  }

  try {
        const auth = getCalendarAuth()
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

      console.log(`[google-calendar] Creating event (service account): ${label} on ${data.date} at ${data.time} (startLocal=${startLocal})`)

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
              requestBody: {
                        summary,
                        description,
                        location: process.env.BUSINESS_ADDRESS || 'Mayller Bridal Italian Style, Sinking Spring, PA',
                        start: { dateTime: startLocal, timeZone: TIMEZONE },
                        end: { dateTime: endLocal, timeZone: TIMEZONE },
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
