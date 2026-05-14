import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'bookings.json')

interface Store { slots: Record<string, boolean> }

function read(): Store {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf-8')) } catch { return { slots: {} } }
}
function write(s: Store) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(s, null, 2))
}

export function getBookedSlots(date: string): string[] {
  return Object.keys(read().slots)
    .filter(k => k.startsWith(date + 'T'))
    .map(k => k.split('T')[1])
}

export function isSlotFree(date: string, time: string): boolean {
  return !read().slots[`${date}T${time}`]
}

export function reserveSlot(date: string, time: string): boolean {
  const s = read()
  const key = `${date}T${time}`
  if (s.slots[key]) return false
  s.slots[key] = true
  write(s)
  return true
}
