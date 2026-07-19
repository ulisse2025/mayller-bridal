import { NextRequest, NextResponse } from 'next/server'
import { getAppointments, getStage, getNotes, getOrders } from '@/lib/crm'

function checkAuth(req: NextRequest): boolean {
  const pw = req.headers.get('x-admin-password')
  return pw === process.env.ADMIN_PASSWORD
}

// GET /api/admin/crm/clients/[id] — full client profile
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const bookingId = parseInt(id, 10)
  if (isNaN(bookingId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  try {
    const [appointments, stage, notes, orders] = await Promise.all([
      getAppointments(bookingId),
      getStage(bookingId),
      getNotes(bookingId),
      getOrders(bookingId),
    ])

    return NextResponse.json({ appointments, stage, notes, orders })
  } catch (err) {
    console.error('CRM client detail error:', err)
    return NextResponse.json({ error: 'Failed to fetch client details' }, { status: 500 })
  }
}
