'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// ============================================================
// /admin/crm/[id] — Client profile page
// Shows: contact info, stage, appointment history, notes, orders
// ============================================================

const PW_KEY = 'mayller-admin-pw'

type Stage = 'lead' | 'consultation_booked' | 'dress_selected' | 'alterations' | 'final_fitting' | 'completed'

const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: 'lead', label: 'Lead', color: 'bg-slate-500' },
  { key: 'consultation_booked', label: 'Consultation Booked', color: 'bg-blue-500' },
  { key: 'dress_selected', label: 'Dress Selected', color: 'bg-purple-500' },
  { key: 'alterations', label: 'Alterations', color: 'bg-amber-500' },
  { key: 'final_fitting', label: 'Final Fitting', color: 'bg-orange-500' },
  { key: 'completed', label: 'Completed', color: 'bg-green-500' },
]

interface Appointment {
  id: number
  slot_date: string
  slot_time: string
  service: string
  notes?: string | null
  source: string
  created_at: string
  customer_name: string
  customer_email: string
  customer_phone: string
}

interface Note {
  id: number
  booking_id: number
  body: string
  created_at: string
  updated_at: string
}

interface Order {
  id: number
  booking_id: number
  item_name: string
  price: number
  deposit_paid: number
  balance_due: number
  is_alteration: boolean
  due_date?: string | null
  status: string
  created_at: string
}

export default function ClientProfilePage() {
  const params = useParams()
  const bookingId = parseInt(params.id as string, 10)

  const [pw, setPw] = useState('')
  const [auth, setAuth] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stage, setStage] = useState<Stage>('lead')
  const [followUpDate, setFollowUpDate] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  // New note form
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // New order form
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderForm, setOrderForm] = useState({
    item_name: '',
    price: '',
    deposit_paid: '',
    balance_due: '',
    is_alteration: false,
    due_date: '',
    status: 'pending',
  })
  const [savingOrder, setSavingOrder] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem(PW_KEY)
    if (saved) {
      setPw(saved)
      setAuth(true)
    }
  }, [])

  const headers = useCallback(() => ({
    'x-admin-password': pw,
    'Content-Type': 'application/json',
  }), [pw])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/crm/clients/${bookingId}`, { headers: { 'x-admin-password': pw } })
      if (!res.ok) throw new Error('Failed to load client')
      const data = await res.json()
      setAppointments(data.appointments || [])
      setStage(data.stage?.stage || 'lead')
      setFollowUpDate(data.stage?.follow_up_date ? data.stage.follow_up_date.split('T')[0] : '')
      setNotes(data.notes || [])
      setOrders(data.orders || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [bookingId, pw])

  useEffect(() => {
    if (auth) loadData()
  }, [auth, loadData])

  const updateStage = async (newStage: Stage) => {
    setStage(newStage)
    try {
      await fetch(`/api/admin/crm/clients/${bookingId}/stage`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ stage: newStage, follow_up_date: followUpDate || null }),
      })
    } catch (err) {
      console.error('Stage update failed:', err)
    }
  }

  const updateFollowUp = async (date: string) => {
    setFollowUpDate(date)
    try {
      await fetch(`/api/admin/crm/clients/${bookingId}/stage`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ stage, follow_up_date: date || null }),
      })
    } catch (err) {
      console.error('Follow-up update failed:', err)
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    setSavingNote(true)
    try {
      const res = await fetch(`/api/admin/crm/clients/${bookingId}/notes`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ body: newNote.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setNotes(prev => [data.note, ...prev])
        setNewNote('')
      }
    } catch (err) {
      console.error('Add note failed:', err)
    } finally {
      setSavingNote(false)
    }
  }

  const deleteNote = async (noteId: number) => {
    try {
      await fetch(`/api/admin/crm/clients/${bookingId}/notes?note_id=${noteId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': pw },
      })
      setNotes(prev => prev.filter(n => n.id !== noteId))
    } catch (err) {
      console.error('Delete note failed:', err)
    }
  }

  const addOrder = async () => {
    if (!orderForm.item_name.trim()) return
    setSavingOrder(true)
    try {
      const res = await fetch(`/api/admin/crm/clients/${bookingId}/orders`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          item_name: orderForm.item_name.trim(),
          price: parseFloat(orderForm.price) || 0,
          deposit_paid: parseFloat(orderForm.deposit_paid) || 0,
          balance_due: parseFloat(orderForm.balance_due) || 0,
          is_alteration: orderForm.is_alteration,
          due_date: orderForm.due_date || null,
          status: orderForm.status,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(prev => [data.order, ...prev])
        setOrderForm({
          item_name: '', price: '', deposit_paid: '', balance_due: '',
          is_alteration: false, due_date: '', status: 'pending',
        })
        setShowOrderForm(false)
      }
    } catch (err) {
      console.error('Add order failed:', err)
    } finally {
      setSavingOrder(false)
    }
  }

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`/api/admin/crm/clients/${bookingId}/orders`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ order_id: orderId, status }),
      })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    } catch (err) {
      console.error('Order status update failed:', err)
    }
  }

  const deleteOrder = async (orderId: number) => {
    if (!confirm('Delete this order?')) return
    try {
      await fetch(`/api/admin/crm/clients/${bookingId}/orders?order_id=${orderId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': pw },
      })
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } catch (err) {
      console.error('Delete order failed:', err)
    }
  }

  // Login gate
  if (!auth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <p className="text-white/20 text-xs tracking-[0.4em] uppercase mb-3">Mayller</p>
            <h1 className="text-2xl font-light tracking-[0.3em] text-white">CRM</h1>
          </div>
          <form onSubmit={e => { e.preventDefault(); sessionStorage.setItem(PW_KEY, pw); setAuth(true) }} className="space-y-4">
            <input
              type="password" value={pw} onChange={e => setPw(e.target.value)}
              placeholder="Enter admin password" autoComplete="current-password"
              className="w-full bg-transparent border border-white/15 focus:border-amber-400/50 outline-none px-4 py-4 text-white text-sm placeholder:text-white/20 tracking-wider"
            />
            <button type="submit" className="w-full py-4 bg-amber-400 text-black text-xs font-bold tracking-[0.3em] uppercase hover:bg-amber-300 transition-colors">
              Sign In
            </button>
          </form>
          <div className="mt-8 text-center">
            <Link href="/admin/crm" className="text-white/20 text-xs tracking-widest hover:text-white/50 transition-colors">← Back to CRM</Link>
          </div>
        </div>
      </div>
    )
  }

  const stageInfo = STAGES.find(s => s.key === stage)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const fmtMoney = (n: number) => `$${Number(n).toFixed(2)}`

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <div className="flex items-center gap-4">
          <Link href="/admin/crm" className="text-white/30 text-xs tracking-widest hover:text-white transition-colors">← Back</Link>
          <span className="text-xs tracking-[0.3em] font-light">CLIENT PROFILE</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/admin" className="text-white/30 text-xs tracking-widest hover:text-white transition-colors">Photos</Link>
          <Link href="/admin/phone" className="text-white/30 text-xs tracking-widest hover:text-white transition-colors">Phone</Link>
          <Link href="/" className="text-white/30 text-xs tracking-widest hover:text-white transition-colors">View Site</Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-white/20 text-sm tracking-wider">Loading...</p>
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : (
          <>
            {/* Client header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-light tracking-wider mb-1">
                    {appointments[0]?.customer_name || 'Unknown Client'}
                  </h1>
                  {appointments[0] && (
                    <div className="text-sm text-white/40 space-y-0.5">
                      <p>{appointments[0].customer_phone}</p>
                      {appointments[0].customer_email && <p>{appointments[0].customer_email}</p>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${stageInfo?.color || 'bg-slate-500'}`} />
                  <span className="text-xs tracking-widest uppercase text-white/50">{stageInfo?.label}</span>
                </div>
              </div>

              {/* Stage selector + follow-up date */}
              <div className="flex flex-wrap items-center gap-4 bg-white/[0.02] border border-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs tracking-widest uppercase text-white/30">Stage:</label>
                  <select
                    value={stage}
                    onChange={e => updateStage(e.target.value as Stage)}
                    className="bg-transparent border border-white/10 text-sm text-white/70 px-3 py-1.5 outline-none hover:border-amber-400/30 cursor-pointer"
                  >
                    {STAGES.map(s => (
                      <option key={s.key} value={s.key} className="bg-[#0a0a0a]">{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs tracking-widest uppercase text-white/30">Follow-up:</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={e => updateFollowUp(e.target.value)}
                    className="bg-transparent border border-white/10 text-sm text-white/70 px-3 py-1.5 outline-none hover:border-amber-400/30 cursor-pointer [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {/* Appointment history */}
            <section className="mb-8">
              <h2 className="text-sm tracking-widest uppercase text-white/50 mb-3">Appointment History</h2>
              {appointments.length === 0 ? (
                <p className="text-white/20 text-sm">No appointments found.</p>
              ) : (
                <div className="space-y-2">
                  {appointments.map(a => (
                    <div key={a.id} className="flex items-start gap-4 bg-white/[0.02] border border-white/5 rounded-lg p-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs text-amber-300/70">{new Date(a.slot_date).toLocaleDateString('en-US', { month: 'short' })}</p>
                        <p className="text-lg text-white/70">{new Date(a.slot_date).getDate()}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white/80">{a.service}</p>
                        <p className="text-xs text-white/30 mt-1">{a.slot_time} · {a.source}</p>
                        {a.notes && <p className="text-xs text-white/40 mt-1 italic">"{a.notes}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Orders & Alterations */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm tracking-widest uppercase text-white/50">Orders & Alterations</h2>
                <button
                  onClick={() => setShowOrderForm(!showOrderForm)}
                  className="text-xs tracking-wider text-amber-300 hover:text-amber-200 transition-colors"
                >
                  {showOrderForm ? 'Cancel' : '+ Add Order'}
                </button>
              </div>

              {showOrderForm && (
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 mb-3 space-y-3">
                  <input
                    type="text" placeholder="Item name (e.g. Wedding Dress, Alteration)"
                    value={orderForm.item_name}
                    onChange={e => setOrderForm({ ...orderForm, item_name: e.target.value })}
                    className="w-full bg-transparent border border-white/10 text-sm text-white/70 px-3 py-2 outline-none focus:border-amber-400/30 placeholder:text-white/15"
                  />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <input type="number" placeholder="Price" value={orderForm.price}
                      onChange={e => setOrderForm({ ...orderForm, price: e.target.value })}
                      className="bg-transparent border border-white/10 text-sm text-white/70 px-3 py-2 outline-none focus:border-amber-400/30 placeholder:text-white/15" />
                    <input type="number" placeholder="Deposit Paid" value={orderForm.deposit_paid}
                      onChange={e => setOrderForm({ ...orderForm, deposit_paid: e.target.value })}
                      className="bg-transparent border border-white/10 text-sm text-white/70 px-3 py-2 outline-none focus:border-amber-400/30 placeholder:text-white/15" />
                    <input type="number" placeholder="Balance Due" value={orderForm.balance_due}
                      onChange={e => setOrderForm({ ...orderForm, balance_due: e.target.value })}
                      className="bg-transparent border border-white/10 text-sm text-white/70 px-3 py-2 outline-none focus:border-amber-400/30 placeholder:text-white/15" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={orderForm.is_alteration}
                        onChange={e => setOrderForm({ ...orderForm, is_alteration: e.target.checked })}
                        className="accent-amber-400" />
                      <span className="text-xs text-white/50">Is alteration</span>
                    </label>
                    <input type="date" value={orderForm.due_date}
                      onChange={e => setOrderForm({ ...orderForm, due_date: e.target.value })}
                      className="bg-transparent border border-white/10 text-sm text-white/70 px-3 py-1.5 outline-none focus:border-amber-400/30 [color-scheme:dark]" />
                    <select value={orderForm.status}
                      onChange={e => setOrderForm({ ...orderForm, status: e.target.value })}
                      className="bg-transparent border border-white/10 text-sm text-white/70 px-3 py-1.5 outline-none cursor-pointer">
                      <option value="pending" className="bg-[#0a0a0a]">Pending</option>
                      <option value="in_progress" className="bg-[#0a0a0a]">In Progress</option>
                      <option value="completed" className="bg-[#0a0a0a]">Completed</option>
                      <option value="cancelled" className="bg-[#0a0a0a]">Cancelled</option>
                    </select>
                    <button onClick={addOrder} disabled={savingOrder}
                      className="px-4 py-1.5 bg-amber-400 text-black text-xs font-bold tracking-wider uppercase hover:bg-amber-300 transition-colors disabled:opacity-50">
                      {savingOrder ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              {orders.length === 0 ? (
                <p className="text-white/20 text-sm">No orders or alterations yet.</p>
              ) : (
                <div className="space-y-2">
                  {orders.map(o => (
                    <div key={o.id} className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm text-white/80">
                            {o.item_name}
                            {o.is_alteration && <span className="ml-2 text-xs text-amber-300/50">(Alteration)</span>}
                          </p>
                          <div className="flex gap-4 mt-1 text-xs text-white/40">
                            <span>Price: {fmtMoney(o.price)}</span>
                            <span>Deposit: {fmtMoney(o.deposit_paid)}</span>
                            <span className={o.balance_due > 0 ? 'text-amber-300' : ''}>Balance: {fmtMoney(o.balance_due)}</span>
                            {o.due_date && <span>Due: {fmtDate(o.due_date)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={o.status}
                            onChange={e => updateOrderStatus(o.id, e.target.value)}
                            className="bg-transparent border border-white/10 text-xs text-white/60 px-2 py-1 outline-none cursor-pointer hover:border-amber-400/30"
                          >
                            <option value="pending" className="bg-[#0a0a0a]">Pending</option>
                            <option value="in_progress" className="bg-[#0a0a0a]">In Progress</option>
                            <option value="completed" className="bg-[#0a0a0a]">Completed</option>
                            <option value="cancelled" className="bg-[#0a0a0a]">Cancelled</option>
                          </select>
                          <button onClick={() => deleteOrder(o.id)}
                            className="text-xs text-red-400/50 hover:text-red-400 transition-colors">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Notes */}
            <section className="mb-8">
              <h2 className="text-sm tracking-widest uppercase text-white/50 mb-3">Notes</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text" placeholder="Add a note..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !savingNote) addNote() }}
                  className="flex-1 bg-transparent border border-white/10 text-sm text-white/70 px-3 py-2 outline-none focus:border-amber-400/30 placeholder:text-white/15"
                />
                <button onClick={addNote} disabled={savingNote || !newNote.trim()}
                  className="px-4 py-2 bg-amber-400 text-black text-xs font-bold tracking-wider uppercase hover:bg-amber-300 transition-colors disabled:opacity-50">
                  {savingNote ? '...' : 'Add'}
                </button>
              </div>
              {notes.length === 0 ? (
                <p className="text-white/20 text-sm">No notes yet.</p>
              ) : (
                <div className="space-y-2">
                  {notes.map(n => (
                    <div key={n.id} className="group bg-white/[0.02] border border-white/5 rounded-lg p-3">
                      <p className="text-sm text-white/70">{n.body}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-white/20">{fmtDate(n.created_at)}</p>
                        <button onClick={() => deleteNote(n.id)}
                          className="text-xs text-red-400/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
