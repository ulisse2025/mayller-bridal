// ============================================================
// MAYLLER PHONE — send SMS reply (server only)
// pronovias/src/app/api/admin/phone/reply/route.ts
//
// POST /api/admin/phone/reply  { to: string, body: string }
// Auth: x-admin-password header (ADMIN_PASSWORD).
// Sends FROM the toll-free number (bypasses the pending A2P
// campaign) and records the reply in Postgres.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/phone/auth';
import { sendTollFreeSms, toE164 } from '@/lib/phone/twilio-actions';
import { recordSentReply } from '@/lib/phone/sms-store';
import type { ApiError, ReplyResponse } from '@/lib/phone/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ReplyResponse | ApiError>> {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let to = '';
  let body = '';
  try {
    const data = (await req.json()) as { to?: string; body?: string };
    to = String(data.to ?? '').trim();
    body = String(data.body ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Bad request', code: 'BAD_REQUEST' }, { status: 400 });
  }
  if (!to || !body) {
    return NextResponse.json({ error: 'Missing recipient or message', code: 'MISSING_FIELDS' }, { status: 400 });
  }

  // 1) Send the SMS (toll-free). If this fails, nothing was sent.
  let sid: string | null = null;
  let status: string | null = null;
  try {
    const res = await sendTollFreeSms(to, body);
    sid = res.sid;
    status = res.status;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Send failed', code: 'TWILIO_ERROR' },
      { status: 502 },
    );
  }

  // 2) Best-effort persist. The SMS already went out, so a DB failure
  //    must NOT turn into a "send failed" — we report stored:false instead.
  let stored = true;
  try {
    await recordSentReply(toE164(to), body, sid, status);
  } catch (err) {
    stored = false;
    console.error('[phone/reply] DB store failed:', err);
  }

  return NextResponse.json({ ok: true, sid, status, stored });
}
