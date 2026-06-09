// ============================================================
// MAYLLER PHONE — sent-reply store (server only, Postgres)
// pronovias/src/lib/phone/sms-store.ts
//
// Phase 2: persists SMS replies sent from the dashboard into
// Postgres (same @vercel/postgres client as the booking store).
// The table is created on first use, so no separate migration.
// ============================================================

import { sql } from '@vercel/postgres';

let tableReady = false;

async function ensureTable(): Promise<void> {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS phone_sms_replies (
      id          BIGSERIAL PRIMARY KEY,
      to_number   TEXT NOT NULL,
      body        TEXT NOT NULL,
      twilio_sid  TEXT,
      status      TEXT,
      sent_by     TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  tableReady = true;
}

/**
 * Record a sent reply. Best-effort: the SMS has already gone out by the
 * time we call this, so callers should not fail the request if this
 * throws — they should surface a "stored: false" flag instead.
 */
export async function recordSentReply(
  to: string,
  body: string,
  sid: string | null,
  status: string | null,
): Promise<void> {
  await ensureTable();
  await sql`
    INSERT INTO phone_sms_replies (to_number, body, twilio_sid, status, sent_by)
    VALUES (${to}, ${body}, ${sid}, ${status}, 'dashboard')
  `;
}
