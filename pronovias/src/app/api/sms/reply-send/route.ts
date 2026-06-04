// ============================================================
// MAYLLER BRIDAL — Send SMS reply via TOLL-FREE number
// pronovias/src/app/api/sms/reply-send/route.ts
//
// Called by /sms-reply page. Sends the reply FROM the toll-free
// number (TWILIO_TOLLFREE_NUMBER), NOT via the A2P Messaging
// Service (which would be blocked while the 10DLC campaign is
// still under review).
//
// Auth: body must include t === SMS_REPLY_TOKEN.
// ============================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return phone.startsWith('+') ? phone : `+${digits}`;
}

export async function POST(req: Request): Promise<Response> {
  let to = '';
  let body = '';
  let token = '';
  try {
    const data = (await req.json()) as { to?: string; body?: string; t?: string };
    to = String(data.to ?? '').trim();
    body = String(data.body ?? '').trim();
    token = String(data.t ?? '');
  } catch {
    return Response.json({ ok: false, error: 'Bad request' }, { status: 400 });
  }

  // --- auth ---
  if (!process.env.SMS_REPLY_TOKEN || token !== process.env.SMS_REPLY_TOKEN) {
    return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  if (!to || !body) {
    return Response.json({ ok: false, error: 'Missing recipient or message' }, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromTollFree = process.env.TWILIO_TOLLFREE_NUMBER; // e.g. +18773624142
  if (!accountSid || !authToken || !fromTollFree) {
    return Response.json({ ok: false, error: 'Twilio not configured' }, { status: 500 });
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const params = new URLSearchParams({
    To: formatPhone(to),
    From: fromTollFree, // force toll-free sender, bypass A2P Messaging Service
    Body: body,
  });

  try {
    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: AbortSignal.timeout(8_000),
      }
    );
    const json = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resp.ok) {
      return Response.json(
        { ok: false, error: (json.message as string) || `Twilio HTTP ${resp.status}` },
        { status: 502 }
      );
    }
    return Response.json({ ok: true, sid: json.sid ?? null, status: json.status ?? null });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'Send failed' },
      { status: 502 }
    );
  }
}
