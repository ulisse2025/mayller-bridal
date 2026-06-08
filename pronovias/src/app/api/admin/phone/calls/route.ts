// ============================================================
// MAYLLER PHONE — Call Log API (server only)
// pronovias/src/app/api/admin/phone/calls/route.ts
//
// GET /api/admin/phone/calls?page=0&pageSize=25
// Auth: x-admin-password header (ADMIN_PASSWORD).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/phone/auth';
import { listCalls } from '@/lib/phone/twilio';
import type { ApiError, CallRecord, Paged } from '@/lib/phone/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 25;

export async function GET(
  req: NextRequest,
): Promise<NextResponse<Paged<CallRecord> | ApiError>> {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const params = req.nextUrl.searchParams;
  const page = Math.max(0, Number.parseInt(params.get('page') ?? '0', 10) || 0);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(params.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
  );

  try {
    const data = await listCalls(page, pageSize);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load calls', code: 'TWILIO_ERROR' },
      { status: 502 },
    );
  }
}
