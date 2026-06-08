// ============================================================
// MAYLLER PHONE — admin auth guard (server only)
// pronovias/src/lib/phone/auth.ts
//
// Reuses the EXISTING /admin shared-secret pattern: the client
// sends the admin password in the `x-admin-password` header and
// we compare it to ADMIN_PASSWORD (same env var as
// /api/admin/verify and the photo admin). No new auth system.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from './types';

/**
 * Returns a 401/500 NextResponse when the request is NOT authorized,
 * or `null` when it is allowed to proceed.
 *
 * Usage in a route handler:
 *   const denied = requireAdmin(req);
 *   if (denied) return denied;
 */
export function requireAdmin(req: NextRequest): NextResponse<ApiError> | null {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    // Fail closed: never allow access if the secret is missing.
    return NextResponse.json(
      { error: 'Server auth not configured', code: 'NO_ADMIN_PASSWORD' },
      { status: 500 },
    );
  }

  const provided = req.headers.get('x-admin-password');
  if (provided !== expected) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  return null;
}
