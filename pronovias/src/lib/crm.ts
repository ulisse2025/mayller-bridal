/**
 * src/lib/crm.ts
 *
 * CRM data layer for Mayller Bridal.
 * Uses @vercel/postgres — same DB client as the rest of the app.
 *
 * Self-migration pattern: ensureTables() runs once per warm lambda,
 * creates crm_stages, crm_notes, crm_orders IF NOT EXISTS.
 *
 * Customers are NOT a separate table — they are derived from the
 * existing bookings table, grouped by customer_email (or customer_phone
 * if email is empty). Each unique customer gets a "anchor" booking_id
 * (the earliest booking for that customer).
 */

import { sql } from '@vercel/postgres'

// ─── Types ──────────────────────────────────────────────

export type Stage =
  | 'lead'
  | 'consultation_booked'
  | 'dress_selected'
  | 'alterations'
  | 'final_fitting'
  | 'completed'

export const STAGES: { key: Stage; label: string }[] = [
  { key: 'lead', label: 'Lead' },
  { key: 'consultation_booked', label: 'Consultation Booked' },
  { key: 'dress_selected', label: 'Dress Selected' },
  { key: 'alterations', label: 'Alterations' },
  { key: 'final_fitting', label: 'Final Fitting' },
  { key: 'completed', label: 'Completed' },
]

export interface CrmClient {
  booking_id: number          // anchor booking
  customer_name: string
  customer_email: string
  customer_phone: string
  wedding_date?: string | null
  stage: Stage
  follow_up_date?: string | null
  total_bookings: number
  last_visit?: string | null
}

export interface CrmNote {
  id: number
  booking_id: number
  body: string
  created_at: string
  updated_at: string
}

export interface CrmOrder {
  id: number
  booking_id: number
  item_name: string
  price: number
  deposit_paid: number
  balance_due: number
  is_alteration: boolean
  due_date?: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface CrmAppointment {
  id: number
  slot_date: string
  slot_time: string
  service: string
  notes?: string | null
  source: string
  created_at: string
  customer_name: string
  customer_email: string
  customer_phone: string
}

// ─── Self-migration ─────────────────────────────────────

let tablesEnsured = false
export async function ensureCrmTables(): Promise<void> {
  if (tablesEnsured) return
  await sql`
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
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS crm_stages_stage_idx ON crm_stages (stage)`
  await sql`CREATE INDEX IF NOT EXISTS crm_stages_followup_idx ON crm_stages (follow_up_date) WHERE follow_up_date IS NOT NULL`

  await sql`
    CREATE TABLE IF NOT EXISTS crm_notes (
      id            SERIAL PRIMARY KEY,
      booking_id    INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      body          TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS crm_notes_booking_idx ON crm_notes (booking_id)`
  await sql`CREATE INDEX IF NOT EXISTS crm_notes_created_idx ON crm_notes (created_at DESC)`

  await sql`
    CREATE TABLE IF NOT EXISTS crm_orders (
      id              SERIAL PRIMARY KEY,
      booking_id      INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      item_name       TEXT NOT NULL,
      price           NUMERIC(10,2) NOT NULL DEFAULT 0,
      deposit_paid    NUMERIC(10,2) NOT NULL DEFAULT 0,
      balance_due     NUMERIC(10,2) NOT NULL DEFAULT 0,
      is_alteration   BOOLEAN NOT NULL DEFAULT FALSE,
      due_date        DATE,
      status          TEXT NOT NULL DEFAULT 'pending',
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at     TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT crm_orders_status_chk CHECK (
        status IN ('pending','in_progress','completed','cancelled')
      )
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS crm_orders_booking_idx ON crm_orders (booking_id)`
  await sql`CREATE INDEX IF NOT EXISTS crm_orders_due_idx ON crm_orders (due_date) WHERE due_date IS NOT NULL`

  tablesEnsured = true
}

// ─── Clients ────────────────────────────────────────────

/**
 * Returns all unique customers derived from the bookings table.
 * Groups by customer_email (or customer_phone when email is empty).
 * The anchor booking_id is the earliest booking for each customer.
 */
export async function getClients(): Promise<CrmClient[]> {
  await ensureCrmTables()
  const { rows } = await sql<CrmClient>`
    WITH ranked AS (
      SELECT
        b.id AS booking_id,
        b.customer_name,
        b.customer_email,
        b.customer_phone,
        b.slot_date,
        b.service,
        b.created_at,
        b.notes,
        ROW_NUMBER() OVER (
          PARTITION BY COALESCE(NULLIF(b.customer_email, ''), b.customer_phone)
          ORDER BY b.created_at ASC
        ) AS rn,
        COUNT(*) OVER (
          PARTITION BY COALESCE(NULLIF(b.customer_email, ''), b.customer_phone)
        ) AS total_bookings
      FROM bookings b
      ORDER BY b.created_at DESC
    )
    SELECT
      r.booking_id,
      r.customer_name,
      r.customer_email,
      r.customer_phone,
      r.notes AS wedding_date,
      COALESCE(s.stage, 'lead') AS stage,
      s.follow_up_date,
      r.total_bookings::int,
      MAX(r.slot_date) OVER (PARTITION BY COALESCE(NULLIF(r.customer_email, ''), r.customer_phone)) AS last_visit
    FROM ranked r
    LEFT JOIN crm_stages s ON s.booking_id = r.booking_id
    WHERE r.rn = 1
    ORDER BY r.created_at DESC
  `
  return rows
}

// ─── Appointments (from existing bookings) ─────────────

export async function getAppointments(bookingId: number): Promise<CrmAppointment[]> {
  // Get the anchor booking first to find the customer identity
  const { rows: anchor } = await sql<{ customer_email: string; customer_phone: string }>`
    SELECT customer_email, customer_phone FROM bookings WHERE id = ${bookingId}
  `
  if (anchor.length === 0) return []
  const email = anchor[0].customer_email
  const phone = anchor[0].customer_phone

  const { rows } = await sql<CrmAppointment>`
    SELECT id, slot_date, slot_time, service, notes, source, created_at,
           customer_name, customer_email, customer_phone
    FROM bookings
    WHERE customer_email = ${email} OR (customer_email = '' AND customer_phone = ${phone})
    ORDER BY slot_date DESC, slot_time DESC
  `
  return rows
}

// ─── Stage ──────────────────────────────────────────────

export async function getStage(bookingId: number) {
  const { rows } = await sql<{ stage: Stage; follow_up_date: string | null }>`
    SELECT stage, follow_up_date FROM crm_stages WHERE booking_id = ${bookingId}
  `
  return rows[0] ?? { stage: 'lead' as Stage, follow_up_date: null }
}

export async function upsertStage(bookingId: number, stage: Stage, followUpDate?: string | null) {
  await ensureCrmTables()
  if (followUpDate !== undefined) {
    await sql`
      INSERT INTO crm_stages (booking_id, stage, follow_up_date, updated_at)
      VALUES (${bookingId}, ${stage}, ${followUpDate}, NOW())
      ON CONFLICT (booking_id) DO UPDATE
      SET stage = ${stage}, follow_up_date = ${followUpDate}, updated_at = NOW()
    `
  } else {
    await sql`
      INSERT INTO crm_stages (booking_id, stage, updated_at)
      VALUES (${bookingId}, ${stage}, NOW())
      ON CONFLICT (booking_id) DO UPDATE
      SET stage = ${stage}, updated_at = NOW()
    `
  }
}

// ─── Notes ──────────────────────────────────────────────

export async function getNotes(bookingId: number): Promise<CrmNote[]> {
  await ensureCrmTables()
  const { rows } = await sql<CrmNote>`
    SELECT id, booking_id, body, created_at, updated_at
    FROM crm_notes
    WHERE booking_id = ${bookingId}
    ORDER BY created_at DESC
  `
  return rows
}

export async function addNote(bookingId: number, body: string): Promise<CrmNote> {
  await ensureCrmTables()
  const { rows } = await sql<CrmNote>`
    INSERT INTO crm_notes (booking_id, body)
    VALUES (${bookingId}, ${body})
    RETURNING id, booking_id, body, created_at, updated_at
  `
  return rows[0]
}

export async function updateNote(noteId: number, body: string): Promise<void> {
  await sql`
    UPDATE crm_notes SET body = ${body}, updated_at = NOW() WHERE id = ${noteId}
  `
}

export async function deleteNote(noteId: number): Promise<void> {
  await sql`DELETE FROM crm_notes WHERE id = ${noteId}`
}

// ─── Orders & Alterations ───────────────────────────────

export async function getOrders(bookingId: number): Promise<CrmOrder[]> {
  await ensureCrmTables()
  const { rows } = await sql<CrmOrder>`
    SELECT id, booking_id, item_name, price, deposit_paid, balance_due,
           is_alteration, due_date, status, created_at, updated_at
    FROM crm_orders
    WHERE booking_id = ${bookingId}
    ORDER BY created_at DESC
  `
  return rows
}

export async function addOrder(order: {
  booking_id: number
  item_name: string
  price: number
  deposit_paid: number
  balance_due: number
  is_alteration: boolean
  due_date?: string | null
  status: string
}): Promise<CrmOrder> {
  await ensureCrmTables()
  const { rows } = await sql<CrmOrder>`
    INSERT INTO crm_orders
      (booking_id, item_name, price, deposit_paid, balance_due,
       is_alteration, due_date, status)
    VALUES
      (${order.booking_id}, ${order.item_name}, ${order.price},
       ${order.deposit_paid}, ${order.balance_due},
       ${order.is_alteration}, ${order.due_date ?? null}, ${order.status})
    RETURNING id, booking_id, item_name, price, deposit_paid, balance_due,
              is_alteration, due_date, status, created_at, updated_at
  `
  return rows[0]
}

export async function updateOrder(orderId: number, fields: {
  item_name?: string
  price?: number
  deposit_paid?: number
  balance_due?: number
  is_alteration?: boolean
  due_date?: string | null
  status?: string
}): Promise<void> {
  const sets: string[] = []
  const vals: unknown[] = []
  let i = 1

  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) {
      sets.push(`${k} = $${i}`)
      vals.push(v)
      i++
    }
  }
  if (sets.length === 0) return
  sets.push(`updated_at = NOW()`)
  vals.push(orderId)
  await sql.query(
    `UPDATE crm_orders SET ${sets.join(', ')} WHERE id = $${i}`,
    vals
  )
}

export async function deleteOrder(orderId: number): Promise<void> {
  await sql`DELETE FROM crm_orders WHERE id = ${orderId}`
}

// ─── Follow-up Dashboard ────────────────────────────────

export async function getFollowUps(): Promise<CrmClient[]> {
  await ensureCrmTables()
  const { rows } = await sql<CrmClient>`
    WITH ranked AS (
      SELECT
        b.id AS booking_id,
        b.customer_name,
        b.customer_email,
        b.customer_phone,
        b.notes AS wedding_date,
        ROW_NUMBER() OVER (
          PARTITION BY COALESCE(NULLIF(b.customer_email, ''), b.customer_phone)
          ORDER BY b.created_at ASC
        ) AS rn
      FROM bookings b
      JOIN crm_stages s ON s.booking_id = b.id
      WHERE s.follow_up_date IS NOT NULL
        AND s.follow_up_date <= CURRENT_DATE
        AND s.stage NOT IN ('completed')
    )
    SELECT
      booking_id, customer_name, customer_email, customer_phone,
      wedding_date, 'lead' AS stage, NULL::date AS follow_up_date,
      1::int AS total_bookings, NULL::date AS last_visit
    FROM ranked
    WHERE rn = 1
    ORDER BY (SELECT follow_up_date FROM crm_stages WHERE booking_id = ranked.booking_id) ASC
  `
  // Enrich with actual stage and follow_up_date
  const result: CrmClient[] = []
  for (const row of rows) {
    const stageInfo = await getStage(row.booking_id)
    result.push({
      ...row,
      stage: stageInfo.stage,
      follow_up_date: stageInfo.follow_up_date,
    })
  }
  return result
}
