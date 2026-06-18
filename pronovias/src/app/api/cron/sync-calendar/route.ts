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
import { sendDueReminders, type ReminderResult } from '@/lib/reminders'

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

  // 24h SMS reminders. Best-effort: a reminder failure must never break the
  // calendar sync. This runs here (instead of a dedicated 3rd Vercel cron) so it
  // works on any Vercel plan, including Hobby's 2-cron limit. This cron already
  // fires daily at 13:00 UTC (~09:00 ET), the intended reminder time.
  let reminders: ReminderResult | { error: string }
  try {
    reminders = await sendDueReminders()
    console.log('[cron/sync-calendar] reminders', reminders)
  } catch (err) {
    console.error('[cron/sync-calendar] reminders failed (sync still OK):', err)
    reminders = { error: 'reminders failed' }
  }

  return NextResponse.json({
    ok: result.ok,
    durationMs: ms,
    scanned: result.scanned,
    inserted: result.inserted,
    updated: result.updated,
    cancelled: result.cancelled,
    emailsSent: result.emailsSent,
    errors: result.errors,
    reminders,
  })
}
