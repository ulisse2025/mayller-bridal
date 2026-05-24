/**
 * src/app/api/diag/retry-booking/route.ts
 * Retry creating a calendar event for a booking that has external_event_id NULL.
 * Usage: GET /api/diag/retry-booking?id=23&token=<HEALTH_TOKEN>
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { createBookingEvent } from '@/lib/google-calendar'
import { updateBookingExternalRef } from '@/lib/bookings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!process.env.HEALTH_TOKEN || token !== process.env.HEALTH_TOKEN) {
    return new NextResponse('Forbidden', { status: 403 })
  }
  const idStr = req.nextUrl.searchParams.get('id')
  const id = idStr ? parseInt(idStr, 10) : NaN
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Missing or invalid ?id=' }, { status: 400 })
  }

  const { rows } = await sql<{
    id: number; slot_date: string; slot_time: string; service: string;
    customer_name: string; customer_email: string; customer_phone: string;
    notes: string | null; external_event_id: string | null;
  }>`SELECT id, slot_date, slot_time, service, customer_name, customer_email,
            customer_phone, notes, external_event_id
       FROM bookings WHERE id = ${id} LIMIT 1`

  if (rows.length === 0) {
    return NextResponse.json({ error: 'booking not found', id }, { status: 404 })
  }
  const b = rows[0]
  if (b.external_event_id) {
    return NextResponse.json({ ok: true, alreadyHasEvent: true, external_event_id: b.external_event_id })
  }

  const dateStr = typeof b.slot_date === 'string' ? b.slot_date : new Date(b.slot_date).toISOString().slice(0, 10)

  const result = await createBookingEvent({
    service: b.service,
    date: dateStr,
    time: b.slot_time,
    name: b.customer_name,
    email: b.customer_email,
    phone: b.customer_phone,
    notes: b.notes ?? undefined,
  })

  if (result.created && result.eventId) {
    await updateBookingExternalRef(id, result.eventId, true)
    return NextResponse.json({ ok: true, eventId: result.eventId, booking: b })
  }
  return NextResponse.json({ ok: false, result, booking: b }, { status: 500 })
}
