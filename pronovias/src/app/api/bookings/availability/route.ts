import { NextRequest, NextResponse } from 'next/server'
import { getBookedSlots } from '@/lib/bookings'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  return NextResponse.json({ booked: getBookedSlots(date) })
}
