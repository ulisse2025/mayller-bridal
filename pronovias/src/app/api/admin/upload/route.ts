import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { addPhoto, type Section } from '@/lib/photos'

export async function POST(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  if (pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fd = await req.formData()
  const file = fd.get('file') as File
  const section = fd.get('section') as Section
  const caption = (fd.get('caption') as string) || ''

  if (!file || !section) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const dir = path.join(process.cwd(), 'public', 'uploads', section)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))

  const photo = addPhoto(section, `/uploads/${section}/${filename}`, caption)
  return NextResponse.json({ photo })
}
