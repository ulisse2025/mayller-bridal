// ============================================================
// MAYLLER PHONE — MMS media proxy (server only)
// pronovias/src/app/api/admin/phone/media/route.ts
//
// GET /api/admin/phone/media?message=MMxxx&media=MExxx&pw=<admin>
// Streams one MMS attachment (photo/file) back to the browser.
//
// Auth: the admin password, accepted EITHER as the usual
// `x-admin-password` header OR as a `pw` query param — because an
// <img src> cannot send custom headers. Twilio media URLs require
// Basic auth, so we proxy the bytes here instead of exposing the
// account credentials to the client.
// READ-ONLY: never deletes or sends anything.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { fetchMediaBinary } from '@/lib/phone/twilio';
import type { ApiError } from '@/lib/phone/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function unauthorized(): NextResponse<ApiError> {
  return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: 'Server auth not configured', code: 'NO_ADMIN_PASSWORD' },
      { status: 500 },
    );
  }

  const params = req.nextUrl.searchParams;
  const provided = req.headers.get('x-admin-password') ?? params.get('pw');
  if (provided !== expected) return unauthorized();

  const message = params.get('message') ?? '';
  const media = params.get('media') ?? '';
  if (!message || !media) {
    return NextResponse.json({ error: 'Missing message or media', code: 'BAD_REQUEST' }, { status: 400 });
  }

  try {
    const { body, contentType } = await fetchMediaBinary(message, media);
    return new NextResponse(Buffer.from(body), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Private cache: the bytes are admin-only; safe to reuse within the session.
        'Cache-Control': 'private, max-age=86400',
        'Content-Disposition': 'inline',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load media', code: 'TWILIO_ERROR' },
      { status: 502 },
    );
  }
}
