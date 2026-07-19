import { NextRequest, NextResponse } from 'next/server'
import { getOrders, addOrder, updateOrder, deleteOrder } from '@/lib/crm'

function checkAuth(req: NextRequest): boolean {
  const pw = req.headers.get('x-admin-password')
  return pw === process.env.ADMIN_PASSWORD
}

// GET /api/admin/crm/clients/[id]/orders — list orders
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const bookingId = parseInt(id, 10)
  if (isNaN(bookingId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const orders = await getOrders(bookingId)
    return NextResponse.json({ orders })
  } catch (err) {
    console.error('CRM orders GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// POST — add order
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const bookingId = parseInt(id, 10)
  if (isNaN(bookingId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const body = await req.json() as {
      item_name: string
      price: number
      deposit_paid: number
      balance_due: number
      is_alteration: boolean
      due_date?: string | null
      status: string
    }

    if (!body.item_name?.trim()) {
      return NextResponse.json({ error: 'item_name is required' }, { status: 400 })
    }

    const order = await addOrder({
      booking_id: bookingId,
      item_name: body.item_name.trim(),
      price: body.price ?? 0,
      deposit_paid: body.deposit_paid ?? 0,
      balance_due: body.balance_due ?? 0,
      is_alteration: body.is_alteration ?? false,
      due_date: body.due_date ?? null,
      status: body.status ?? 'pending',
    })
    return NextResponse.json({ order })
  } catch (err) {
    console.error('CRM orders POST error:', err)
    return NextResponse.json({ error: 'Failed to add order' }, { status: 500 })
  }
}

// PATCH — update order (body: { order_id, ...fields })
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  void id
  try {
    const body = await req.json() as {
      order_id: number
      item_name?: string
      price?: number
      deposit_paid?: number
      balance_due?: number
      is_alteration?: boolean
      due_date?: string | null
      status?: string
    }
    const { order_id, ...fields } = body
    if (!order_id) return NextResponse.json({ error: 'order_id is required' }, { status: 400 })
    await updateOrder(order_id, fields)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('CRM orders PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

// DELETE — delete order (?order_id=N)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  void id
  const url = new URL(req.url)
  const orderId = parseInt(url.searchParams.get('order_id') ?? '', 10)
  if (isNaN(orderId)) return NextResponse.json({ error: 'order_id is required' }, { status: 400 })

  try {
    await deleteOrder(orderId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('CRM orders DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
