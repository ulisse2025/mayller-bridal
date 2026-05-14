import { NextRequest, NextResponse } from 'next/server'
import { getBookedSlots } from '@/lib/bookings'
 
export const runtime = 'nodejs'
 
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })
 
  try {
    const booked = await getBookedSlots(date)
    return NextResponse.json({ booked })
  } catch (err) {
    console.error('availability error:', err)
    // Return empty array so the calendar UI still renders all slots as free
    return NextResponse.json({ booked: [] })
  }
}
