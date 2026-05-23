/**
 * src/lib/bookings.ts
 *
 * Postgres-backed booking slot store.
 * Replaces the previous file-based implementation that crashed on Vercel
 * (EROFS — Read-Only File System).
 *
 * v2 (May 2026): added source / external_event_id / customer_email_sent
 * columns to support calendar mirror sync. See data/db-schema.sql.
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
 * Returns the new booking row id on success, or null if the slot was already taken.
 *
 * Uses INSERT ... ON CONFLICT to guarantee atomicity even under concurrent requests.
 *
 * v2: takes optional source / externalEventId, defaults to 'web'.
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
    source?: 'web' | 'voice' | 'manual'
    externalEventId?: string | null
    customerEmailSent?: boolean
  },
): Promise<number | null> {
  try {
    const result = await sql<{ id: number }>`
      INSERT INTO bookings
        (slot_date, slot_time, service, customer_name, customer_email,
         customer_phone, notes, source, external_event_id, customer_email_sent,
         created_at, updated_at)
      VALUES
        (${date}, ${time}, ${meta.service}, ${meta.name}, ${meta.email},
         ${meta.phone}, ${meta.notes ?? null},
         ${meta.source ?? 'web'},
         ${meta.externalEventId ?? null},
         ${meta.customerEmailSent ?? false},
         NOW(), NOW())
      ON CONFLICT (slot_date, slot_time) DO NOTHING
      RETURNING id
    `
    return result.rows[0]?.id ?? null
  } catch (err) {
    console.error('reserveSlot DB error:', err)
    throw err
  }
}

/** Update the external_event_id and email_sent flag after a booking. */
export async function updateBookingExternalRef(
  bookingId: number,
  externalEventId: string,
  customerEmailSent: boolean,
): Promise<void> {
  await sql`
    UPDATE bookings
       SET external_event_id = ${externalEventId},
           customer_email_sent = ${customerEmailSent},
           updated_at = NOW()
     WHERE id = ${bookingId}
  `
}

/** Release a slot (used when calendar event creation fails after reserve). */
export async function releaseSlot(bookingId: number): Promise<void> {
  await sql`DELETE FROM bookings WHERE id = ${bookingId}`
}
