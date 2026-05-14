/**
 * src/lib/bookings.ts
 *
 * Postgres-backed booking slot store.
 * Replaces the previous file-based implementation that crashed on Vercel
 * (EROFS — Read-Only File System).
 *
 * Requirements:
 *  - Vercel Postgres integration enabled on the project
 *  - Environment variables auto-injected by Vercel:
 *      POSTGRES_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING, etc.
 *  - Run the SQL in db-schema.sql once to create the `bookings` table.
 */
 
import { sql } from '@vercel/postgres'
 
/**
 * Returns the list of times already booked on a given date.
 * Used by /api/bookings/availability.
 */
export async function getBookedSlots(date: string): Promise<string[]> {
  const { rows } = await sql<{ slot_time: string }>`
    SELECT slot_time
    FROM bookings
    WHERE slot_date = ${date}
  `
  return rows.map(r => r.slot_time)
}
 
/**
 * Checks whether a slot is still free.
 */
export async function isSlotFree(date: string, time: string): Promise<boolean> {
  const { rows } = await sql`
    SELECT 1
    FROM bookings
    WHERE slot_date = ${date} AND slot_time = ${time}
    LIMIT 1
  `
  return rows.length === 0
}
 
/**
 * Atomically reserves a slot.
 * Returns true on success, false if the slot was already taken.
 *
 * Uses INSERT ... ON CONFLICT to guarantee atomicity even under
 * concurrent requests (two clients clicking the same slot at the same time).
 */
export async function reserveSlot(
  date: string,
  time: string,
  meta: {
    service: string
    name: string
    email: string
    phone: string
    notes?: string
  },
): Promise<boolean> {
  try {
    const result = await sql`
      INSERT INTO bookings
        (slot_date, slot_time, service, customer_name, customer_email,
         customer_phone, notes, created_at)
      VALUES
        (${date}, ${time}, ${meta.service}, ${meta.name}, ${meta.email},
         ${meta.phone}, ${meta.notes ?? null}, NOW())
      ON CONFLICT (slot_date, slot_time) DO NOTHING
      RETURNING id
    `
    return result.rows.length > 0
  } catch (err) {
    console.error('reserveSlot DB error:', err)
    throw err
  }
}
