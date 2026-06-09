// ============================================================
// MAYLLER PHONE — Twilio write actions (server only)
// pronovias/src/lib/phone/twilio-actions.ts
//
// Phase 2: send an SMS reply (from the toll-free number) and
// start a click-to-call bridge. Kept SEPARATE from the read-only
// twilio.ts so the "actions that change things" live in one place.
//
// Click-to-call flow (keeps the agent's personal number private):
//   1. Twilio rings PHONE_AGENT_NUMBER (the agent's cell).
//   2. When the agent answers, Twilio dials the customer with the
//      STORE number as caller ID, so the customer never sees the
//      agent's personal number.
// ============================================================

const API_BASE = 'https://api.twilio.com/2010-04-01';
const TIMEOUT_MS = 10_000;

interface Creds {
  accountSid: string;
  authToken: string;
}

function getCreds(): Creds {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials are not configured');
  }
  return { accountSid, authToken };
}

function authHeader(c: Creds): string {
  return 'Basic ' + Buffer.from(`${c.accountSid}:${c.authToken}`).toString('base64');
}

/** Normalize to E.164 (US default). */
export function toE164(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('1') && d.length === 11) return `+${d}`;
  if (d.length === 10) return `+1${d}`;
  return phone.startsWith('+') ? phone : `+${d}`;
}

function xmlEscape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!),
  );
}

async function twilioPost(c: Creds, resource: string, params: Record<string, string>) {
  const resp = await fetch(`${API_BASE}/Accounts/${c.accountSid}/${resource}`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(c),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  });
  const json = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
  if (!resp.ok) {
    throw new Error((json.message as string) || `Twilio HTTP ${resp.status}`);
  }
  return json;
}

export interface TwilioResult {
  sid: string | null;
  status: string | null;
}

/** Send an SMS FROM the toll-free number (bypasses the pending A2P campaign). */
export async function sendTollFreeSms(to: string, body: string): Promise<TwilioResult> {
  const creds = getCreds();
  const from = process.env.TWILIO_TOLLFREE_NUMBER;
  if (!from) throw new Error('TWILIO_TOLLFREE_NUMBER is not configured');

  const json = await twilioPost(creds, 'Messages.json', {
    To: toE164(to),
    From: from,
    Body: body,
  });
  return { sid: (json.sid as string) ?? null, status: (json.status as string) ?? null };
}

/**
 * Start a two-leg bridge: ring the agent, then connect to the customer
 * with the store number as caller ID. Caller ID defaults to the store
 * number (TWILIO_PHONE_NUMBER); override with PHONE_CALLER_ID if needed
 * (e.g. fall back to the toll-free number until the 484 finishes porting).
 */
export async function createBridgeCall(customer: string): Promise<TwilioResult> {
  const creds = getCreds();
  const agent = process.env.PHONE_AGENT_NUMBER;
  if (!agent) throw new Error('PHONE_AGENT_NUMBER (the cell to ring) is not configured');
  const callerId = process.env.PHONE_CALLER_ID || process.env.TWILIO_PHONE_NUMBER;
  if (!callerId) throw new Error('No caller ID configured (PHONE_CALLER_ID / TWILIO_PHONE_NUMBER)');

  const twiml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response><Dial callerId="${xmlEscape(callerId)}">${xmlEscape(toE164(customer))}</Dial></Response>`;

  const json = await twilioPost(creds, 'Calls.json', {
    To: toE164(agent), // ring the agent first
    From: callerId, // agent sees the store number too
    Twiml: twiml, // on answer, dial the customer (store caller ID)
  });
  return { sid: (json.sid as string) ?? null, status: (json.status as string) ?? null };
}
