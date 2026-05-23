-- Mayller Bookings - Postgres schema
-- Run these statements once on Vercel Postgres (via dashboard SQL editor)

-- Initial table (created in v1, kept here for documentation)
CREATE TABLE IF NOT EXISTS bookings (
  id              SERIAL PRIMARY KEY,
  slot_date       DATE NOT NULL,
  slot_time       TEXT NOT NULL,
  service         TEXT NOT NULL,
  customer_name   TEXT NOT NULL,
  customer_email  TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT bookings_slot_unique UNIQUE (slot_date, slot_time)
);

-- v2 migration (May 2026) - calendar mirror integration
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS external_event_id TEXT,
  ADD COLUMN IF NOT EXISTS customer_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes for the cron sync (fast lookups by external_event_id)
CREATE UNIQUE INDEX IF NOT EXISTS bookings_external_event_idx
  ON bookings (external_event_id)
  WHERE external_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS bookings_source_idx ON bookings (source);
CREATE INDEX IF NOT EXISTS bookings_email_sent_idx ON bookings (customer_email_sent)
  WHERE customer_email_sent = FALSE;

-- Update slot_unique to allow soft-delete recovery (cancelled events freed for re-booking)
-- The constraint already enforces uniqueness; no change needed.

-- Optional cleanup: rows older than 2 years
-- DELETE FROM bookings WHERE created_at < NOW() - INTERVAL '2 years';
