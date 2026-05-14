import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'photos.json')

export type Section = 'collection' | 'alteration' | 'events'

export interface Photo {
  id: string
  url: string
  caption: string
  uploadedAt: string
}

interface Store { collection: Photo[]; alteration: Photo[]; events: Photo[] }

function read(): Store {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf-8')) }
  catch { return { collection: [], alteration: [], events: [] } }
}
function write(s: Store) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(s, null, 2))
}

export function getPhotos(section: Section): Photo[] { return read()[section] }

export function addPhoto(section: Section, url: string, caption: string): Photo {
  const s = read()
  const photo: Photo = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, url, caption, uploadedAt: new Date().toISOString() }
  s[section].push(photo)
  write(s)
  return photo
}

export function deletePhoto(section: Section, id: string): boolean {
  const s = read()
  const before = s[section].length
  s[section] = s[section].filter(p => p.id !== id)
  if (s[section].length === before) return false
  write(s)
  return true
}
