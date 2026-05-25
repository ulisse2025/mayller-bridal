/**
 * src/app/api/calendar/webhook/route.ts
 *
 * Receives Push Notifications from Google Calendar.
 * When ANY event changes (create, update, delete, manual edit on the
 * Calendar UI by Stefano), Google calls this endpoint within seconds.
 * We re-run the calendar->Postgres mirror so the website availability
 * calendar reflects the change immediately - no 5/24h cron wait.
 *
 * Security:
 * - The watch is registered with token = CALENDAR_WEBHOOK_TOKEN.
 *   Google echoes that back in the X-Goog-Channel-Token header.
 *   We reject anything else.
 *
 * Google sends these resource states:
 *   - 'sync'        : initial handshake after channel creation, no payload
 *   - 'exists'      : something in the resource changed (run sync)
 *   - 'not_exists'  : the watched resource was deleted (run sync to clean up)
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncCalendarToPostgres } from '@/lib/calendar-mirror'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-goog-channel-token') || ''
  const expected = process.env.CALENDAR_WEBHOOK_TOKEN || ''

  if (!expected || token !== expected) {
    console.warn('[calendar/webhook] rejected: invalid or missing token')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const channelId  = req.headers.get('x-goog-channel-id')
  const resState   = req.headers.get('x-goog-resource-state')
  const resourceId = req.headers.get('x-goog-resource-id')

  console.log('[calendar/webhook] received', { channelId, resState, resourceId })

  // 'sync' is just the handshake - ack and exit.
  if (resState === 'sync') {
    return NextResponse.json({ ok: true, ack: 'sync' })
  }

  // For any change, re-mirror Calendar -> Postgres.
  try {
    const result = await syncCalendarToPostgres()
    console.log('[calendar/webhook] sync done', result)
    return NextResponse.json({ ok: true, synced: result })
  } catch (err) {
    console.error('[calendar/webhook] sync failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// Google also probes the URL with GET sometimes during channel setup.
export async function GET() {
  return NextResponse.json({ ok: true, hint: 'POST endpoint for Google Calendar push notifications' })
}
