-- ============================================================
-- CRM Migration — Mayller Bridal
-- Adds: crm_stages, crm_notes, crm_orders
-- All tables are ADDITIVE — nothing existing is altered or dropped.
-- Customers are derived from the existing bookings table (no
-- separate customers table). Each CRM row is foreign-keyed to
-- a booking row via booking_id, which acts as the customer anchor.
-- ============================================================

-- Pipeline stages per client (one row per booking/customer)
CREATE TABLE IF NOT EXISTS crm_stages (
  id            SERIAL PRIMARY KEY,
  booking_id    INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  stage         TEXT NOT NULL DEFAULT 'lead',
  follow_up_date DATE,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT crm_stages_unique UNIQUE (booking_id),
  CONSTRAINT crm_stages_stage_chk CHECK (
    stage IN ('lead','consultation_booked','dress_selected','alterations','final_fitting','completed')
  )
);

CREATE INDEX IF NOT EXISTS crm_stages_stage_idx ON crm_stages (stage);
CREATE INDEX IF NOT EXISTS crm_stages_followup_idx ON crm_stages (follow_up_date)
  WHERE follow_up_date IS NOT NULL;

-- Free-form notes per client
CREATE TABLE IF NOT EXISTS crm_notes (
  id            SERIAL PRIMARY KEY,
  booking_id    INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS crm_notes_booking_idx ON crm_notes (booking_id);
CREATE INDEX IF NOT EXISTS crm_notes_created_idx ON crm_notes (created_at DESC);

-- Orders & alterations tracking per client
CREATE TABLE IF NOT EXISTS crm_orders (
  id              SERIAL PRIMARY KEY,
  booking_id      INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  item_name       TEXT NOT NULL,
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit_paid    NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance_due     NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- alteration-specific fields
  is_alteration   BOOLEAN NOT NULL DEFAULT FALSE,
  due_date        DATE,
  status          TEXT NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT crm_orders_status_chk CHECK (
    status IN ('pending','in_progress','completed','cancelled')
  )
);

CREATE INDEX IF NOT EXISTS crm_orders_booking_idx ON crm_orders (booking_id);
CREATE INDEX IF NOT EXISTS crm_orders_due_idx ON crm_orders (due_date)
  WHERE due_date IS NOT NULL;
