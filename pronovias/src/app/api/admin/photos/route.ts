import { NextRequest, NextResponse } from 'next/server'
import { getPhotos, deletePhoto, type Section } from '@/lib/photos'

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get('section') as Section
  if (!section) return NextResponse.json({ error: 'Missing section' }, { status: 400 })
  return NextResponse.json({ photos: getPhotos(section) })
}

export async function DELETE(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  if (pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const section = req.nextUrl.searchParams.get('section') as Section
  const id = req.nextUrl.searchParams.get('id')
  if (!section || !id) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  const ok = deletePhoto(section, id)
  return NextResponse.json({ deleted: ok })
}
