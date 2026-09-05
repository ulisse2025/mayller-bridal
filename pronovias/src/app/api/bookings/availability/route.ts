import { NextRequest, NextResponse } from 'next/server'
import { getBookedSlots } from '@/lib/bookings'
import { getAvailableSlots } from '@/lib/vapi-calendar'
import { normalizeAppointmentType } from '@/lib/booking-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Slot availability for the website booking calendar.
 *
 * `booked`    — exact times already taken, from Postgres. What this endpoint
 *               has always returned; kept so nothing that reads it breaks, and
 *               used by the client as the fallback.
 * `available` — the duration-aware list, only when `service` is given: exactly
 *               the slots Sofia offers (Google Calendar freebusy). It also
 *               excludes times that would RUN INTO a later appointment, and
 *               events created by hand in the calendar, which `booked` cannot
 *               see. Null when the lookup fails, so the client falls back.
 */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  const service = req.nextUrl.searchParams.get('service')
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })

  let booked: string[] = []
  try {
    booked = await getBookedSlots(date)
  } catch (err) {
    // Empty list so the calendar UI still renders all slots as free.
    console.error('availability error (postgres):', err)
  }

  let available: string[] | null = null
  if (service) {
    try {
      available = await getAvailableSlots(date, normalizeAppointmentType(service))
    } catch (err) {
      console.error('availability error (calendar):', err)
      available = null
    }
  }

  return NextResponse.json({ booked, available })
}
