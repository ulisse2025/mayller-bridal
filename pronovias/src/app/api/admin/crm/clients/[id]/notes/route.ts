import { NextRequest, NextResponse } from 'next/server'
import { getNotes, addNote, updateNote, deleteNote } from '@/lib/crm'

function checkAuth(req: NextRequest): boolean {
  const pw = req.headers.get('x-admin-password')
  return pw === process.env.ADMIN_PASSWORD
}

// GET /api/admin/crm/clients/[id]/notes — list notes
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
    const notes = await getNotes(bookingId)
    return NextResponse.json({ notes })
  } catch (err) {
    console.error('CRM notes GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

// POST — add note
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
    const { body } = await req.json() as { body: string }
    if (!body?.trim()) return NextResponse.json({ error: 'Note body is required' }, { status: 400 })
    const note = await addNote(bookingId, body.trim())
    return NextResponse.json({ note })
  } catch (err) {
    console.error('CRM notes POST error:', err)
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
  }
}

// PATCH — update note (body: { note_id, body })
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
    const { note_id, body } = await req.json() as { note_id: number; body: string }
    if (!note_id) return NextResponse.json({ error: 'note_id is required' }, { status: 400 })
    await updateNote(note_id, body)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('CRM notes PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

// DELETE — delete note (?note_id=N)
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
  const noteId = parseInt(url.searchParams.get('note_id') ?? '', 10)
  if (isNaN(noteId)) return NextResponse.json({ error: 'note_id is required' }, { status: 400 })

  try {
    await deleteNote(noteId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('CRM notes DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
