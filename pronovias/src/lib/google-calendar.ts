import { google } from 'googleapis'

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

export function getAuthUrl(): string {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth/google/callback',
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
    'http://localhost:3000/api/auth/google/callback',
  )
  const { tokens } = await client.getToken(code)
  return tokens
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

  if (!clientId || !clientSecret || !refreshToken) return { created: false }

  const auth = getOAuthClient()
  const calendar = google.calendar({ version: 'v3', auth })

  const duration = DURATION_MINUTES[data.service] ?? 60
  const label = SERVICE_LABELS[data.service] ?? data.service

  // Parse "10:00 AM" / "2:00 PM" format
  const timeParts = data.time.match(/(\d+):(\d+)\s*(AM|PM)/i)
  let hh = timeParts ? parseInt(timeParts[1]) : 10
  const mm = timeParts ? parseInt(timeParts[2]) : 0
  const period = timeParts ? timeParts[3].toUpperCase() : 'AM'
  if (period === 'PM' && hh !== 12) hh += 12
  if (period === 'AM' && hh === 12) hh = 0
  const start = new Date(`${data.date}T00:00:00`)
  start.setHours(hh, mm, 0, 0)
  const end = new Date(start.getTime() + duration * 60 * 1000)

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
      summary: `✦ ${label} — ${data.name}`,
      description,
      location: 'Mayller Atelier',
      start: { dateTime: start.toISOString(), timeZone: 'Europe/Rome' },
      end: { dateTime: end.toISOString(), timeZone: 'Europe/Rome' },
      attendees: [{ email: data.email, displayName: data.name }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
    },
  })

  return { created: true }
}
