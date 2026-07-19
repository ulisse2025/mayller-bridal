import { NextRequest, NextResponse } from 'next/server'
import { upsertStage } from '@/lib/crm'

function checkAuth(req: NextRequest): boolean {
  const pw = req.headers.get('x-admin-password')
  return pw === process.env.ADMIN_PASSWORD
}

// PATCH /api/admin/crm/clients/[id]/stage — update pipeline stage and/or follow-up date
export async function PATCH(
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
    const body = await req.json()
    const { stage, follow_up_date } = body as { stage?: string; follow_up_date?: string | null }

    if (!stage) {
      return NextResponse.json({ error: 'stage is required' }, { status: 400 })
    }

    const validStages = ['lead','consultation_booked','dress_selected','alterations','final_fitting','completed']
    if (!validStages.includes(stage)) {
      return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })
    }

    await upsertStage(bookingId, stage as never, follow_up_date ?? undefined)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('CRM stage update error:', err)
    return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 })
  }
}
