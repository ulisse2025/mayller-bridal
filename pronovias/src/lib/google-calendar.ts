/**
 * src/lib/google-calendar.ts
 *
 * Google Calendar integration for Mayller Bridal bookings.
 *
 * Fixes:
 * - Timezone changed from Europe/Rome â America/New_York
 * - BUG FIX: datetime is now built as a local-time string (no UTC 'Z' suffix)
 *   so Google Calendar interprets it correctly in America/New_York.
 *   Previous version used new Date() + setHours() which produced a UTC
 *   ISO string â causing every event to land 4-5 hours early (e.g. 6 AM
 *   instead of 10 AM).
 */

import { google } from 'googleapis'

const TIMEZONE = 'America/New_York'

const DURATION_MINUTES: Record<string, number> = {
  alteration: 30,
  wedding: 90,
}

const SERVICE_LABELS: Record<string, string> = {
  alteration: 'Alteration',
  wedding: 'Wedding Dress',
}

/** Build the OAuth2 client using env vars. */
function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
  return client
}

/** Computes the right redirect URI for the current environment. */
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
    scope: ['https://www.googleapis.com/auth/calendar.events'],
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

/** Zero-pad a number to 2 digits. */
function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Build a local-time datetime string in YYYY-MM-DDTHH:MM:SS format.
 * NO 'Z' suffix â Google Calendar + timeZone parameter interprets this
 * as a wall-clock time in the given timezone (America/New_York).
 */
function buildLocalDateTime(date: string, hours: number, minutes: number): string {
  return `${date}T${pad(hours)}:${pad(minutes)}:00`
}

export async function createBookingEvent(data: {
  service: string
  date: string
  time: string
  name: string
  email: string
  phone: string
  notes?: string
}) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('Google Calendar credentials not configured â skipping event creation.')
    return { created: false, reason: 'missing-credentials' as const }
  }

  try {
    const auth = getOAuthClient()
    const calendar = google.calendar({ version: 'v3', auth })

    const duration = DURATION_MINUTES[data.service] ?? 60
    const label = SERVICE_LABELS[data.service] ?? data.service

    // Parse "10:00 AM" / "2:00 PM" â 24-hour integers
    const timeParts = data.time.match(/(\d+):(\d+)\s*(AM|PM)/i)
    let hh = timeParts ? parseInt(timeParts[1], 10) : 10
    const mm = timeParts ? parseInt(timeParts[2], 10) : 0
    const period = timeParts ? timeParts[3].toUpperCase() : 'AM'
    if (period === 'PM' && hh !== 12) hh += 12
    if (period === 'AM' && hh === 12) hh = 0

    // Compute end time in whole minutes, then back to H:M
    const startMinutes = hh * 60 + mm
    const endMinutes = startMinutes + duration
    const endHH = Math.floor(endMinutes / 60)
    const endMM = endMinutes % 60

    // Build LOCAL time strings (no 'Z') â Google Calendar uses timeZone param
    const startLocal = buildLocalDateTime(data.date, hh, mm)
    const endLocal = buildLocalDateTime(data.date, endHH, endMM)

    console.log(`[google-calendar] Creating event: ${label} on ${data.date} at ${data.time} â startLocal=${startLocal}`)

    const description = [
      `Service: ${label} (${duration} min)`,
      `Client: ${data.name}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      data.notes ? `Notes: ${data.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      sendUpdates: 'all',
      requestBody: {
        summary: `Mayller Bridal â ${label} â ${data.name}`,
        description,
        location: process.env.BUSINESS_ADDRESS || 'Mayller Bridal Italian Style, Sinking Spring, PA',
        start: { dateTime: startLocal, timeZone: TIMEZONE },
        end: { dateTime: endLocal, timeZone: TIMEZONE },
        attendees: [{ email: data.email, displayName: data.name }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 },       // 1 hour before
          ],
        },
      },
    })

    return { created: true as const }
  } catch (err) {
    console.error('Google Calendar error:', err)
    return { created: false, reason: 'api-error' as const, error: String(err) }
  }
}
