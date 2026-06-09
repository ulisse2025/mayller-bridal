// ============================================================
// MAYLLER PHONE — shared DTOs (server + client)
// pronovias/src/lib/phone/types.ts
//
// Plain types only. Safe to import from both server route
// handlers and client components.
// ============================================================

export type CallDirection = 'inbound' | 'outbound' | 'unknown';

export interface CallRecord {
  sid: string;
  from: string;
  to: string;
  direction: CallDirection;
  status: string; // completed, no-answer, busy, failed, canceled, ...
  durationSec: number; // 0 when the call never connected
  startedAt: string | null; // ISO 8601 (UTC)
}

export interface SmsRecord {
  sid: string;
  from: string;
  to: string;
  body: string;
  direction: CallDirection;
  status: string; // delivered, sent, received, failed, undelivered, ...
  numMedia: number;
  sentAt: string | null; // ISO 8601 (UTC)
}

export interface SofiaCall {
  id: string;
  from: string | null; // customer number
  to: string | null; // our Vapi number
  startedAt: string | null; // ISO 8601 (UTC)
  durationSec: number | null;
  endedReason: string | null;
  transcript: string | null;
  summary: string | null;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// The Sofia endpoint reports when no Vapi key is configured yet, so the
// dashboard can show a clean "not connected" state instead of an error.
export type SofiaResponse =
  | ({ configured: true } & Paged<SofiaCall>)
  | { configured: false };

export interface ApiError {
  error: string;
  code?: string;
}

// --- Phase 2: actions (reply + click-to-call) ---

export interface ReplyResponse {
  ok: true;
  sid: string | null;
  status: string | null;
  stored: boolean; // whether the reply was also saved to Postgres
}

export interface CallResponse {
  ok: true;
  sid: string | null;
  status: string | null;
}
