/**
 * src/app/api/diag/calendar/route.ts
 * Diagnostic endpoint: tries to authenticate with Google Calendar OAuth and
 * lists upcoming events (read-only). Returns the raw error if anything fails.
 * Protected by ?token= matching HEALTH_TOKEN env var.
 */
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!process.env.HEALTH_TOKEN || token !== process.env.HEALTH_TOKEN) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    envPresent: {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REFRESH_TOKEN: !!process.env.GOOGLE_REFRESH_TOKEN,
      GOOGLE_CALENDAR_ID: !!process.env.GOOGLE_CALENDAR_ID,
    },
    calendarIdValue: process.env.GOOGLE_CALENDAR_ID || '(unset, will use primary)',
  }

  try {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    )
    client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })

    // Step 1: try to refresh the access token
    let accessToken: string | undefined
    try {
      const t = await client.getAccessToken()
      accessToken = t.token ?? undefined
      result.accessTokenObtained = !!accessToken
    } catch (e) {
      result.step = 'getAccessToken'
      result.error = e instanceof Error ? { name: e.name, message: e.message, stack: e.stack?.split('\n').slice(0,5) } : String(e)
      return NextResponse.json(result, { status: 500 })
    }

    // Step 2: try to list calendar events
    try {
      const calendar = google.calendar({ version: 'v3', auth: client })
      const list = await calendar.events.list({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 3,
        singleEvents: true,
        orderBy: 'startTime',
      })
      result.eventsListed = list.data.items?.length ?? 0
      result.sampleEvent = list.data.items?.[0]
        ? {
            id: list.data.items[0].id,
            summary: list.data.items[0].summary,
            start: list.data.items[0].start,
          }
        : null
    } catch (e) {
      const err = e as { code?: number; message?: string; errors?: unknown; response?: { data?: unknown } }
      result.step = 'events.list'
      result.error = {
        code: err.code,
        message: err.message,
        errors: err.errors,
        responseData: err.response?.data,
      }
      return NextResponse.json(result, { status: 500 })
    }

    // Step 3: try a test insert (then delete) to verify write access
    try {
      const calendar = google.calendar({ version: 'v3', auth: client })
      const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      const ins = await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        requestBody: {
          summary: 'DIAGNOSTIC TEST EVENT (will be deleted)',
          description: 'Test event from /api/diag/calendar - safe to ignore',
          start: { dateTime: new Date(future.getTime()).toISOString() },
          end: { dateTime: new Date(future.getTime() + 30 * 60_000).toISOString() },
        },
      })
      result.testInsertOk = true
      result.testEventId = ins.data.id
      // Clean up
      if (ins.data.id) {
        await calendar.events.delete({ calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary', eventId: ins.data.id })
        result.testEventDeleted = true
      }
    } catch (e) {
      const err = e as { code?: number; message?: string; errors?: unknown; response?: { data?: unknown } }
      result.step = 'events.insert'
      result.error = {
        code: err.code,
        message: err.message,
        errors: err.errors,
        responseData: err.response?.data,
      }
      return NextResponse.json(result, { status: 500 })
    }

    result.ok = true
    return NextResponse.json(result)
  } catch (e) {
    result.step = 'outer'
    result.error = e instanceof Error ? e.message : String(e)
    return NextResponse.json(result, { status: 500 })
  }
}
