// src/app/api/cron/reminders/route.ts
//
// Sends a 24h SMS reminder to customers with an appointment tomorrow.
// The real work lives in lib/reminders.ts (shared with the sync-calendar cron).
//
// Auth: protected by CRON_SECRET. Vercel Cron automatically sends
// `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
//
// Safe testing on the preview:
//   GET /api/cron/reminders?dryRun=1   (with the Bearer header)
//   -> runs the query and returns counts, sends NOTHING, writes NOTHING.

import { NextRequest, NextResponse } from 'next/server'
import { sendDueReminders } from '@/lib/reminders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // seconds

export async function GET(req: NextRequest) {
  // --- auth ---
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization') || ''
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'

  try {
    const result = await sendDueReminders({ dryRun })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[cron/reminders] error:', err)
    return NextResponse.json({ error: 'reminders failed' }, { status: 500 })
  }
}
