'use client'

import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { getLunchBreak, isStoreClosed, STORE_CLOSURES } from '@/lib/booking-types'

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

// Service-aware time slots — generated from the SAME seasonal rule Sofia uses
// (getLunchBreak in booking-types.ts): starts every 30 minutes within business
// hours (10 AM – 6 PM), and no appointment may overlap the lunch break.
// Summer (Jun–Aug): lunch 12:00–1:00 PM → last starts: Alteration 11:30,
// Tuxedo 11:00, Wedding 10:30. Rest of the year: lunch 1:00–2:00 PM.
const SERVICE_DURATION: Record<string, number> = {
  alteration: 30,
  wedding: 90,
  tuxedo_fitting: 60,
}

const OPEN_MIN = 10 * 60 // 10:00 AM
const CLOSE_MIN = 18 * 60 // 6:00 PM

function formatSlotLabel(min: number): string {
  let h = Math.floor(min / 60)
  const m = min % 60
  const ap = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return `${h}:${String(m).padStart(2, '0')} ${ap}`
}

function getSlotsForService(service: string, dateISO: string): { am: string[]; pm: string[] } {
  const duration = SERVICE_DURATION[service] ?? 30
  const lunch = dateISO ? getLunchBreak(dateISO) : { startMin: 13 * 60, endMin: 14 * 60 }
  const am: string[] = []
  const pm: string[] = []
  for (let start = OPEN_MIN; start + duration <= CLOSE_MIN; start += 30) {
    // No slot may overlap the lunch break.
    if (start < lunch.endMin && start + duration > lunch.startMin) continue
    if (start < lunch.startMin) am.push(formatSlotLabel(start))
    else pm.push(formatSlotLabel(start))
  }
  return { am, pm }
}

// Saturday rule: bookings accepted only up to a 2:00 PM start, not beyond.
const SAT_LAST_START_MIN = 14 * 60 // 14:00

function slotStartMinutes(s: string): number {
  const mt = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!mt) return 0
  let h = parseInt(mt[1], 10)
  const mi = parseInt(mt[2], 10)
  const ap = mt[3].toUpperCase()
  if (ap === 'PM' && h !== 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return h * 60 + mi
}

const SERVICES = [
  { id: 'alteration', label: 'Alteration', sublabel: 'Expert tailoring session with our master seamstress', duration: '30 min' },
  { id: 'wedding', label: 'Wedding Dress', sublabel: 'Private consultation - find your perfect gown', duration: '90 min' },
  { id: 'tuxedo_fitting', label: 'Tuxedo Fitting', sublabel: 'Groom & groomsmen - jacket, trousers, perfect fit', duration: '60 min' },
]


type Step = 'service' | 'datetime' | 'info' | 'done'

interface BookingForm {
  service: string
  date: string
  time: string
  name: string
  email: string
  phone: string
  notes: string
  smsConsent: boolean
}

function toISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isDateAvailable(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = date.getDay()
  if (date < today || day === 0) return false
  // Store closed for vacation/holiday (single source of truth: STORE_CLOSURES
  // in booking-types.ts) — these dates are greyed out and not selectable.
  if (isStoreClosed(toISO(date))) return false
  return true
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const cells: (Date | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function formatSelectedDate(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS_EN[m - 1]} ${d}, ${y}`
}

export function BookingCalendar() {
  const today = new Date()
  const [step, setStep] = useState<Step>('service')
  const [form, setForm] = useState<BookingForm>({ service: '', date: '', time: '', name: '', email: '', phone: '', notes: '', smsConsent: false })
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { am: amSlots, pm: pmSlots } = useMemo(() => getSlotsForService(form.service, form.date), [form.service, form.date])

  // Saturday (day 6): show only slots that START at or before 2:00 PM.
  const isSaturday = useMemo(() => {
    if (!form.date) return false
    const [y, m, d] = form.date.split('-').map(Number)
    return new Date(y, m - 1, d).getDay() === 6
  }, [form.date])

  const amSlotsShown = useMemo(
    () => (isSaturday ? amSlots.filter(s => slotStartMinutes(s) <= SAT_LAST_START_MIN) : amSlots),
    [isSaturday, amSlots]
  )
  const pmSlotsShown = useMemo(
    () => (isSaturday ? pmSlots.filter(s => slotStartMinutes(s) <= SAT_LAST_START_MIN) : pmSlots),
    [isSaturday, pmSlots]
  )
  const allSlotsShown = useMemo(() => [...amSlotsShown, ...pmSlotsShown], [amSlotsShown, pmSlotsShown])

  // Upcoming store closures (vacations) to show as a notice under the calendar.
  const todayISO = toISO(today)
  const upcomingClosures = useMemo(
    () => STORE_CLOSURES.filter(c => c.to >= todayISO),
    [todayISO]
  )

  const days = useMemo(() => buildCalendarDays(calYear, calMonth), [calYear, calMonth])
  const canGoBack = calYear > today.getFullYear() || calMonth > today.getMonth()

  const prevMonth = () => {
    if (!canGoBack) return
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  const selectDate = useCallback(async (date: Date) => {
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    setForm(f => ({ ...f, date: iso, time: '' }))
    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/bookings/availability?date=${iso}`)
      const data = await res.json()
      setBookedSlots(data.booked || [])
    } catch {
      setBookedSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  const isBooked = (slot: string) => bookedSlots.includes(slot)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.status === 409) {
        setError('This time slot was just taken. Please choose another time.')
        setStep('datetime')
        if (form.date) {
          const r = await fetch(`/api/bookings/availability?date=${form.date}`)
          const d = await r.json()
          setBookedSlots(d.booked || [])
        }
        return
      }
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setForm({ service: '', date: '', time: '', name: '', email: '', phone: '', notes: '', smsConsent: false })
    setBookedSlots([])
    setStep('service')
    setError('')
  }

  if (step === 'done') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 rounded-full border border-amber-400/50 flex items-center justify-center mb-8">
          <svg className="w-7 h-7 text-amber-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-12.5" /></svg>
        </div>
        <p className="text-amber-300/70 text-xs tracking-[0.3em] uppercase mb-3">Booking Confirmed</p>
        <h2 className="text-3xl font-light text-white tracking-widest mb-4">Thank you, {form.name.split(' ')[0]}</h2>
        <p className="text-white/50 max-w-md leading-relaxed text-sm mb-2">
          Your <span className="text-white/80">{SERVICES.find(s => s.id === form.service)?.label}</span> appointment is confirmed for <span className="text-white/80">{formatSelectedDate(form.date)}</span> at <span className="text-white/80">{form.time}</span>.
        </p>
        <p className="text-white/30 text-xs mb-10">The Mayller team has been notified.</p>
        <button onClick={reset} className="text-xs tracking-[0.25em] uppercase text-white/40 hover:text-white/70 border border-white/20 hover:border-white/40 px-8 py-3 transition-all">New Booking</button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <div className="text-center mb-14">
        <p className="text-amber-300/60 text-xs tracking-[0.35em] uppercase mb-4">Mayller Atelier</p>
        <h2 className="text-4xl font-light text-white tracking-widest mb-3">Book Your Appointment</h2>
        <p className="text-white/40 text-sm">By appointment only - we welcome you with complete dedication</p>
      </div>

      <div className="flex items-center justify-center gap-3 mb-14">
        {(['service', 'datetime', 'info'] as Step[]).map((s, i) => {
          const labels = ['Service', 'Date & Time', 'Details']
          const stepOrder: Step[] = ['service', 'datetime', 'info']
          const current = stepOrder.indexOf(step)
          const isDone = current > i
          const isActive = current === i
          return (
            <div key={s} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all', isDone ? 'bg-amber-400 text-black' : isActive ? 'border border-amber-400 text-amber-300' : 'border border-white/20 text-white/30')}>
                  {isDone ? (<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-12.5" /></svg>) : <span>{i + 1}</span>}
                </div>
                <span className={cn('text-xs tracking-wider', isActive ? 'text-white/70' : isDone ? 'text-amber-300/70' : 'text-white/20')}>{labels[i]}</span>
              </div>
              {i < 2 && <div className={cn('w-12 h-px', isDone ? 'bg-amber-400/50' : 'bg-white/10')} />}
            </div>
          )
        })}
      </div>

      {step === 'service' && (
        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-white/40 text-center mb-8">Choose your appointment type</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {SERVICES.map((svc) => (
              <button key={svc.id} onClick={() => { setForm(f => ({ ...f, service: svc.id })); setStep('datetime') }} className={cn('relative p-8 border text-left transition-all duration-300 group', form.service === svc.id ? 'border-amber-400/70 bg-amber-400/5' : 'border-white/15 hover:border-white/40 bg-white/[0.02] hover:bg-white/[0.04]')}>
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full border border-amber-400/30 group-hover:border-amber-400/60 flex items-center justify-center transition-all">
                  <div className={cn('w-2 h-2 rounded-full transition-all', form.service === svc.id ? 'bg-amber-400' : 'bg-transparent')} />
                </div>
                <p className="text-xs tracking-[0.2em] text-amber-300/50 uppercase mb-3">{svc.duration}</p>
                <h3 className="text-lg font-light text-white tracking-wide mb-2">{svc.label}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{svc.sublabel}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'datetime' && (
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-6">Choose a date</p>
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} disabled={!canGoBack} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20 transition-colors">←</button>
              <span className="text-white text-sm tracking-widest uppercase">{MONTHS_EN[calMonth]} {calYear}</span>
              <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors">→</button>
            </div>
            <div className="grid grid-cols-7 mb-2">
              {DAYS_EN.map((d) => (<div key={d} className={cn('text-center text-xs tracking-wider py-1', d === 'Su' ? 'text-white/15' : 'text-white/30')}>{d}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((date, i) => {
                if (!date) return <div key={i} />
                const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                const available = isDateAvailable(date)
                const selected = form.date === iso
                return (
                  <button key={i} disabled={!available} onClick={() => selectDate(date)} className={cn('aspect-square flex items-center justify-center text-sm transition-all duration-200', selected ? 'bg-amber-400 text-black font-medium' : available ? 'text-white/80 hover:bg-white/10' : 'text-white/15 cursor-not-allowed')}>{date.getDate()}</button>
                )
              })}
            </div>
            <p className="text-white/20 text-xs mt-4">Open Monday-Saturday · Saturday until 2:00 PM</p>
            {upcomingClosures.map((c) => (
              <p key={c.from} className="text-amber-300/50 text-xs mt-1">
                Closed for {c.reason.toLowerCase()}: {formatSelectedDate(c.from)} to {formatSelectedDate(c.to)}
              </p>
            ))}
          </div>

          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-2">{form.date ? `Available times - ${formatSelectedDate(form.date)}` : 'Select a date first'}</p>
            {form.service && (<p className="text-xs text-amber-300/40 mb-6 tracking-wider">{SERVICES.find(s => s.id === form.service)?.label} - {SERVICE_DURATION[form.service] ?? 30} min appointment{isSaturday ? ' · Saturday until 2:00 PM' : ''}</p>)}
            {form.date ? (
              loadingSlots ? (
                <div className="h-48 flex items-center justify-center">
                  <svg className="w-6 h-6 animate-spin text-amber-400/50" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                </div>
              ) : (
                <>
                  <p className="text-xs text-white/30 tracking-wider mb-3">MORNING</p>
                  <div className="grid gap-2 mb-6 grid-cols-3">
                    {amSlotsShown.map((t) => {
                      const booked = isBooked(t)
                      return (
                        <button key={t} onClick={() => !booked && setForm(f => ({ ...f, time: t }))} disabled={booked} className={cn('py-3 text-sm tracking-wider border transition-all', booked ? 'border-white/5 text-white/15 cursor-not-allowed line-through' : form.time === t ? 'border-amber-400 bg-amber-400/10 text-amber-300' : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white')}>{t}</button>
                      )
                    })}
                  </div>
                  {pmSlotsShown.length > 0 && (
                    <>
                      <p className="text-xs text-white/30 tracking-wider mb-3">AFTERNOON</p>
                      <div className="grid gap-2 grid-cols-4">
                        {pmSlotsShown.map((t) => {
                          const booked = isBooked(t)
                          return (
                            <button key={t} onClick={() => !booked && setForm(f => ({ ...f, time: t }))} disabled={booked} className={cn('py-3 text-sm tracking-wider border transition-all', booked ? 'border-white/5 text-white/15 cursor-not-allowed line-through' : form.time === t ? 'border-amber-400 bg-amber-400/10 text-amber-300' : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white')}>{t}</button>
                          )
                        })}
                      </div>
                    </>
                  )}
                  {bookedSlots.length >= allSlotsShown.length && allSlotsShown.length > 0 && (<p className="mt-4 text-amber-300/60 text-xs tracking-wider">All slots are booked for this day. Please select another date.</p>)}
                </>
              )
            ) : (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border border-white/10 mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                  </div>
                  <p className="text-white/20 text-xs tracking-wider">Select a date</p>
                </div>
              </div>
            )}

            {form.date && form.time && (
              <div className="mt-8 border border-amber-400/30 bg-amber-400/5 p-4">
                <p className="text-xs text-amber-300/60 tracking-widest uppercase mb-2">Summary</p>
                <p className="text-white/80 text-sm">{SERVICES.find(s => s.id === form.service)?.label}</p>
                <p className="text-white/50 text-sm">{formatSelectedDate(form.date)} - {form.time}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'info' && (
        <div className="max-w-lg mx-auto">
          <p className="text-xs tracking-[0.25em] uppercase text-white/40 text-center mb-8">Your contact details</p>
          <div className="border border-white/10 p-4 mb-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-white/30 text-xs tracking-wider uppercase mb-1">Service</p>
              <p className="text-white/70 text-sm">{SERVICES.find(s => s.id === form.service)?.label}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs tracking-wider uppercase mb-1">Date</p>
              <p className="text-white/70 text-sm">{formatSelectedDate(form.date)}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs tracking-wider uppercase mb-1">Time</p>
              <p className="text-white/70 text-sm">{form.time}</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { key: 'name', label: 'Full Name *', type: 'text', placeholder: 'e.g. Emma Johnson' },
              { key: 'email', label: 'Email *', type: 'email', placeholder: 'e.g. emma@email.com' },
              { key: 'phone', label: 'Phone *', type: 'tel', placeholder: 'e.g. +1 555 000 0000' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs tracking-[0.2em] text-white/40 uppercase mb-2">{label}</label>
                <input type={type} value={form[key as keyof BookingForm] as string} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full bg-transparent border border-white/15 focus:border-amber-400/60 outline-none px-4 py-3 text-white/80 text-sm placeholder:text-white/20 transition-colors" />
              </div>
            ))}
            <div>
              <label className="block text-xs tracking-[0.2em] text-white/40 uppercase mb-2">Notes (optional)</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Preferred style, dress size, questions for the stylist..." className="w-full bg-transparent border border-white/15 focus:border-amber-400/60 outline-none px-4 py-3 text-white/80 text-sm placeholder:text-white/20 transition-colors resize-none" />
            </div>
            <label className="flex items-start gap-3 mt-2 cursor-pointer">
              <input type="checkbox" checked={form.smsConsent} onChange={(e) => setForm(f => ({ ...f, smsConsent: e.target.checked }))} className="mt-1 accent-amber-400" />
              <span className="text-xs text-white/50 leading-relaxed">
                I agree to receive SMS text messages from Mayller Bridal about my appointment (confirmations, reschedules, cancellations). Message and data rates may apply. Reply STOP to opt out. See our{' '}
                <a href="/privacy" className="text-amber-300/70 underline">Privacy Policy</a> and{' '}
                <a href="/terms" className="text-amber-300/70 underline">Terms</a>.
              </span>
            </label>
            <p className="text-[11px] text-white/30 leading-relaxed">
              Optional - SMS consent is not required to book. If unchecked, you will receive your confirmation by email only.
            </p>
          </div>
          {error && (<div className="mt-4 border border-red-400/30 bg-red-400/5 px-4 py-3 text-red-300 text-sm">{error}</div>)}
        </div>
      )}

      {(step === 'datetime' || step === 'info') && (
        <div className="flex items-center justify-between mt-12 max-w-5xl mx-auto">
          <button onClick={() => setStep(step === 'info' ? 'datetime' : 'service')} className="text-xs tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors">← Back</button>
          {step === 'datetime' && (
            <button onClick={() => setStep('info')} disabled={!form.date || !form.time} className={cn('px-10 py-3 text-xs tracking-[0.25em] uppercase transition-all', form.date && form.time ? 'bg-white text-black hover:bg-white/90' : 'border border-white/15 text-white/20 cursor-not-allowed')}>Continue →</button>
          )}
          {step === 'info' && (
            <button onClick={handleSubmit} disabled={loading || !form.name || !form.email || !form.phone} className={cn('px-10 py-3 text-xs tracking-[0.25em] uppercase transition-all flex items-center gap-3', form.name && form.email && form.phone ? 'bg-amber-400 text-black hover:bg-amber-300' : 'border border-white/15 text-white/20 cursor-not-allowed')}>
              {loading && (<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>)}
              {loading ? 'Submitting...' : 'Confirm Booking'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
