/**
 * src/app/api/cron/sync-calendar/route.ts
 *
 * Vercel Cron endpoint. Runs every 5 min (see vercel.json).
 * Mirrors Google Calendar -> Postgres and sends emails for new voice bookings.
 *
 * Protected by Vercel's standard cron auth: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncCalendarToPostgres } from '@/lib/calendar-mirror'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // seconds

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  const result = await syncCalendarToPostgres()
  const ms = Date.now() - start

  console.log('[cron/sync-calendar]', { ms, ...result })

  return NextResponse.json({
    ok: result.ok,
    durationMs: ms,
    scanned: result.scanned,
    inserted: result.inserted,
    updated: result.updated,
    cancelled: result.cancelled,
    emailsSent: result.emailsSent,
    errors: result.errors,
  })
}
