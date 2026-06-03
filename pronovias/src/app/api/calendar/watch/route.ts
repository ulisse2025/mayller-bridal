/**
 * src/app/api/calendar/watch/route.ts
 *
 * Register or renew a Google Calendar Push Notification channel.
 *
 * Why we need this:
 *   Google Calendar push notifications deliver real-time webhooks when events
 *   change. Each channel expires after at most ~30 days, so we renew daily
 *   from a Vercel cron - we use a 7-day TTL so missing one cron run is fine.
 *
 * Behaviour:
 *   1. Stop the previous channel (best effort, ignore errors).
 *   2. Register a new channel pointing at /api/calendar/webhook.
 *   3. Persist channel_id + resource_id + expiration in calendar_watches.
 *
 * Endpoint auth: protected by CRON_SECRET (Vercel cron Bearer header).
 *
 * FIX (2026-06-02): Google auth migrated from the personal OAuth refresh token
 * to the same service account Sofia uses. The OAuth token kept expiring
 * (consent screen in "Testing" mode -> 7-day expiry), so events.watch() failed
 * and NO push channel was registered: real-time calendar->site sync was dead
 * since 2026-05-31. The service account never expires.
 */

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { sql } from '@vercel/postgres'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Service-account auth, identical to Sofia (vapi-calendar.ts), the web booking
 * path (google-calendar.ts) and the mirror (calendar-mirror.ts). Vercel stores
 * the multiline private key with literal \n, so we restore the real newlines.
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

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const webhookToken = process.env.CALENDAR_WEBHOOK_TOKEN
  if (!webhookToken) {
    return NextResponse.json(
      { error: 'CALENDAR_WEBHOOK_TOKEN env var not configured' },
      { status: 500 },
    )
  }

  const calendar   = google.calendar({ version: 'v3', auth: getCalendarAuth() })
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'
  const webhookUrl = 'https://mayllerbridal.com/api/calendar/webhook'

  // 1. Stop previous channel (best effort - if it already expired, this errors).
  let stoppedPrevious = false
  try {
    const { rows } = await sql<{ channel_id: string; resource_id: string }>`
      SELECT channel_id, resource_id
      FROM calendar_watches
      ORDER BY created_at DESC
      LIMIT 1
    `
    if (rows[0]) {
      try {
        await calendar.channels.stop({
          requestBody: {
            id: rows[0].channel_id,
            resourceId: rows[0].resource_id,
          },
        })
        stoppedPrevious = true
      } catch (e) {
        // Most common: previous channel already expired. Not fatal.
        console.warn('[calendar/watch] stop previous failed (continuing):', e)
      }
    }
  } catch (e) {
    console.warn('[calendar/watch] read previous failed (continuing):', e)
  }

  // 2. Create new channel.
  const channelId = crypto.randomUUID()
  try {
    const res = await calendar.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        token: webhookToken,
        params: { ttl: '604800' }, // 7 days
      },
    })

    const expirationMs = res.data.expiration ? parseInt(res.data.expiration, 10) : null
    const expirationIso = expirationMs ? new Date(expirationMs).toISOString() : null

    // 3. Persist.
    await sql`
      INSERT INTO calendar_watches (channel_id, resource_id, expiration, created_at)
      VALUES (${channelId}, ${res.data.resourceId!}, ${expirationIso}, NOW())
    `

    return NextResponse.json({
      ok: true,
      stoppedPrevious,
      channelId,
      resourceId: res.data.resourceId,
      expiration: expirationIso,
    })
  } catch (err) {
    console.error('[calendar/watch] register failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
