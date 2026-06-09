// ============================================================
// MAYLLER PHONE — click-to-call bridge (server only)
// pronovias/src/app/api/admin/phone/call/route.ts
//
// POST /api/admin/phone/call  { customer: string }
// Auth: x-admin-password header (ADMIN_PASSWORD).
// Rings the agent's cell (PHONE_AGENT_NUMBER); on answer Twilio
// dials the customer with the STORE number as caller ID, so the
// customer never sees the agent's personal number.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/phone/auth';
import { createBridgeCall } from '@/lib/phone/twilio-actions';
import type { ApiError, CallResponse } from '@/lib/phone/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
): Promise<NextResponse<CallResponse | ApiError>> {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let customer = '';
  try {
    const data = (await req.json()) as { customer?: string };
    customer = String(data.customer ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Bad request', code: 'BAD_REQUEST' }, { status: 400 });
  }
  if (!customer) {
    return NextResponse.json({ error: 'Missing customer number', code: 'MISSING_FIELDS' }, { status: 400 });
  }

  try {
    const res = await createBridgeCall(customer);
    return NextResponse.json({ ok: true, sid: res.sid, status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Call failed', code: 'TWILIO_ERROR' },
      { status: 502 },
    );
  }
}
