// ============================================================
// MAYLLER PHONE — Twilio REST client (server only)
// pronovias/src/lib/phone/twilio.ts
//
// Read-only access to Calls + Messages via the Twilio REST API,
// using the same fetch + Basic-auth pattern as the existing
// /api/sms/reply-send route (no SDK, no extra deps).
//
// SECURITY: imports nothing client-side; credentials come only
// from process.env and never leave the server.
// ============================================================

import type { CallRecord, SmsRecord, MediaItem, Paged, CallDirection } from './types';

const API_BASE = 'https://api.twilio.com/2010-04-01';
const TIMEOUT_MS = 10_000;

interface TwilioEnv {
  accountSid: string;
  authToken: string;
}

function getEnv(): TwilioEnv {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials are not configured');
  }
  return { accountSid, authToken };
}

function authHeader(env: TwilioEnv): string {
  return 'Basic ' + Buffer.from(`${env.accountSid}:${env.authToken}`).toString('base64');
}

function normalizeDirection(raw: string | undefined): CallDirection {
  if (!raw) return 'unknown';
  if (raw.startsWith('inbound')) return 'inbound';
  if (raw.startsWith('outbound')) return 'outbound';
  return 'unknown';
}

function toIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// --- raw Twilio response shapes (only the fields we consume) ---
interface TwilioCallRaw {
  sid: string;
  from: string;
  to: string;
  direction: string;
  status: string;
  duration: string | null;
  start_time: string | null;
}
interface TwilioCallsPage {
  calls: TwilioCallRaw[];
  next_page_uri: string | null;
}

interface TwilioMessageRaw {
  sid: string;
  from: string;
  to: string;
  body: string;
  direction: string;
  status: string;
  num_media: string | null;
  date_sent: string | null;
  date_created: string | null;
}
interface TwilioMessagesPage {
  messages: TwilioMessageRaw[];
  next_page_uri: string | null;
}

interface TwilioMediaRaw {
  sid: string;
  content_type: string | null;
}
interface TwilioMediaPage {
  media_list: TwilioMediaRaw[];
}

// Twilio resource SIDs are 34-char alphanumerics. Validate before
// interpolating into a URL or trusting a value from the client.
const SID_RE = /^[A-Za-z0-9]{34}$/;
export function isValidSid(value: string): boolean {
  return SID_RE.test(value);
}

async function twilioGet<T>(env: TwilioEnv, resource: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const url = `${API_BASE}/Accounts/${env.accountSid}/${resource}?${qs}`;
  const resp = await fetch(url, {
    headers: { Authorization: authHeader(env) },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Twilio HTTP ${resp.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
  }
  return (await resp.json()) as T;
}

export async function listCalls(page: number, pageSize: number): Promise<Paged<CallRecord>> {
  const env = getEnv();
  const data = await twilioGet<TwilioCallsPage>(env, 'Calls.json', {
    PageSize: String(pageSize),
    Page: String(page),
  });
  const items: CallRecord[] = (data.calls ?? []).map((c) => ({
    sid: c.sid,
    from: c.from,
    to: c.to,
    direction: normalizeDirection(c.direction),
    status: c.status,
    durationSec: c.duration ? Number.parseInt(c.duration, 10) || 0 : 0,
    startedAt: toIso(c.start_time),
  }));
  return { items, page, pageSize, hasMore: Boolean(data.next_page_uri) };
}

// List the media (photos/files) attached to one MMS message and map
// each to an auth-gated proxy path the dashboard can render directly.
async function listMedia(env: TwilioEnv, messageSid: string): Promise<MediaItem[]> {
  const data = await twilioGet<TwilioMediaPage>(env, `Messages/${messageSid}/Media.json`, {
    PageSize: '50',
  });
  return (data.media_list ?? []).map((md) => {
    const contentType = md.content_type ?? 'application/octet-stream';
    return {
      sid: md.sid,
      contentType,
      isImage: contentType.startsWith('image/'),
      path: `/api/admin/phone/media?message=${encodeURIComponent(messageSid)}&media=${encodeURIComponent(md.sid)}`,
    };
  });
}

export async function listMessages(page: number, pageSize: number): Promise<Paged<SmsRecord>> {
  const env = getEnv();
  const data = await twilioGet<TwilioMessagesPage>(env, 'Messages.json', {
    PageSize: String(pageSize),
    Page: String(page),
  });
  const items: SmsRecord[] = (data.messages ?? []).map((m) => ({
    sid: m.sid,
    from: m.from,
    to: m.to,
    body: m.body,
    direction: normalizeDirection(m.direction),
    status: m.status,
    numMedia: m.num_media ? Number.parseInt(m.num_media, 10) || 0 : 0,
    media: [],
    sentAt: toIso(m.date_sent) ?? toIso(m.date_created),
  }));

  // Enrich only the MMS messages with their media. Best-effort: a media
  // lookup failure must not blank the whole SMS log, so it degrades to
  // the numMedia count alone.
  await Promise.all(
    items
      .filter((m) => m.numMedia > 0)
      .map(async (m) => {
        try {
          m.media = await listMedia(env, m.sid);
        } catch {
          m.media = [];
        }
      }),
  );

  return { items, page, pageSize, hasMore: Boolean(data.next_page_uri) };
}

// Fetch the raw bytes of one media attachment. The /Media/{sid} endpoint
// (no .json) 307-redirects to a pre-signed CDN URL; Node's fetch drops the
// Authorization header on that cross-origin hop, so credentials never leak
// to the CDN. Caller (the proxy route) must already be admin-authorized.
export async function fetchMediaBinary(
  messageSid: string,
  mediaSid: string,
): Promise<{ body: ArrayBuffer; contentType: string }> {
  if (!isValidSid(messageSid) || !isValidSid(mediaSid)) {
    throw new Error('Invalid media identifier');
  }
  const env = getEnv();
  const url = `${API_BASE}/Accounts/${env.accountSid}/Messages/${messageSid}/Media/${mediaSid}`;
  const resp = await fetch(url, {
    headers: { Authorization: authHeader(env) },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
    redirect: 'follow',
  });
  if (!resp.ok) {
    throw new Error(`Twilio media HTTP ${resp.status}`);
  }
  const body = await resp.arrayBuffer();
  const contentType = resp.headers.get('content-type') ?? 'application/octet-stream';
  return { body, contentType };
}
