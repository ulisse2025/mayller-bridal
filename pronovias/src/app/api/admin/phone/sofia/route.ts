// ============================================================
// MAYLLER PHONE — Sofia (Vapi) Log API (server only)
// pronovias/src/app/api/admin/phone/sofia/route.ts
//
// GET /api/admin/phone/sofia?limit=25
// Auth: x-admin-password header (ADMIN_PASSWORD).
// Returns { configured: false } when no Vapi key is set yet.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/phone/auth';
import { listSofiaCalls } from '@/lib/phone/vapi';
import type { ApiError, SofiaResponse } from '@/lib/phone/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 25;

export async function GET(
  req: NextRequest,
): Promise<NextResponse<SofiaResponse | ApiError>> {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.nextUrl.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
  );

  try {
    const data = await listSofiaCalls(limit);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load Sofia calls', code: 'VAPI_ERROR' },
      { status: 502 },
    );
  }
}
