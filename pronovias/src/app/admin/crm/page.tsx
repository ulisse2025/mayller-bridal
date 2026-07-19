'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

// ============================================================
// /admin/crm — CRM main page
// Shows: pipeline overview, client list, follow-up dashboard
// Auth: same sessionStorage pattern as /admin and /admin/phone
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

interface Client {
  booking_id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  wedding_date?: string | null
  stage: Stage
  follow_up_date?: string | null
  total_bookings: number
  last_visit?: string | null
}

type Tab = 'pipeline' | 'clients' | 'followups'

export default function CrmPage() {
  const [pw, setPw] = useState('')
  const [auth, setAuth] = useState(false)
  const [authError, setAuthError] = useState('')
  const [tab, setTab] = useState<Tab>('pipeline')
  const [clients, setClients] = useState<Client[]>([])
  const [followups, setFollowups] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Restore session
  useEffect(() => {
    const saved = sessionStorage.getItem(PW_KEY)
    if (saved) {
      setPw(saved)
      setAuth(true)
    }
  }, [])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (res.ok) {
        sessionStorage.setItem(PW_KEY, pw)
        setAuth(true)
      } else {
        setAuthError('Incorrect password.')
      }
    } catch {
      setAuthError('Network error. Try again.')
    }
  }

  const logout = () => {
    sessionStorage.removeItem(PW_KEY)
    setAuth(false)
    setPw('')
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const headers = { 'x-admin-password': pw }
      const [clientsRes, fuRes] = await Promise.all([
        fetch('/api/admin/crm/clients', { headers }),
        fetch('/api/admin/crm/follow-ups', { headers }),
      ])
      if (!clientsRes.ok) throw new Error('Failed to load clients')
      const clientsData = await clientsRes.json()
      setClients(clientsData.clients || [])
      if (fuRes.ok) {
        const fuData = await fuRes.json()
        setFollowups(fuData.clients || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [pw])

  useEffect(() => {
    if (auth) loadData()
  }, [auth, loadData])

  const updateStage = async (bookingId: number, stage: Stage) => {
    try {
      await fetch(`/api/admin/crm/clients/${bookingId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
        body: JSON.stringify({ stage }),
      })
      setClients(prev => prev.map(c => c.booking_id === bookingId ? { ...c, stage } : c))
    } catch (err) {
      console.error('Stage update failed:', err)
    }
  }

  // Filter clients by search
  const filtered = clients.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.customer_name.toLowerCase().includes(q) ||
           c.customer_email.toLowerCase().includes(q) ||
           c.customer_phone.includes(q)
  })

  // Group by stage for pipeline view
  const byStage = (stage: Stage) => filtered.filter(c => c.stage === stage)

  // Login gate
  if (!auth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <p className="text-white/20 text-xs tracking-[0.4em] uppercase mb-3">Mayller</p>
            <h1 className="text-2xl font-light tracking-[0.3em] text-white">CRM</h1>
          </div>
          <form onSubmit={login} className="space-y-4">
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Enter admin password"
              autoComplete="current-password"
              className="w-full bg-transparent border border-white/15 focus:border-amber-400/50 outline-none px-4 py-4 text-white text-sm placeholder:text-white/20 tracking-wider"
            />
            {authError && <p className="text-red-400 text-xs tracking-wider">{authError}</p>}
            <button type="submit"
              className="w-full py-4 bg-amber-400 text-black text-xs font-bold tracking-[0.3em] uppercase hover:bg-amber-300 transition-colors">
              Sign In
            </button>
          </form>
          <div className="mt-8 text-center">
            <Link href="/admin" className="text-white/20 text-xs tracking-widest hover:text-white/50 transition-colors">← Back to Admin</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <div className="flex items-center gap-4">
          <span className="text-xs tracking-[0.3em] font-light">MAYLLER CRM</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        </div>
        <div className="flex items-center gap-5">
          <Link href="/admin" className="text-white/30 text-xs tracking-widest hover:text-white transition-colors">Photos</Link>
          <Link href="/admin/phone" className="text-white/30 text-xs tracking-widest hover:text-white transition-colors">Phone</Link>
          <Link href="/" className="text-white/30 text-xs tracking-widest hover:text-white transition-colors">View Site</Link>
          <button onClick={logout} className="text-white/20 text-xs tracking-widest hover:text-red-400 transition-colors">Sign Out</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/10">
          {([
            { key: 'pipeline', label: 'Pipeline' },
            { key: 'clients', label: 'All Clients' },
            { key: 'followups', label: `Follow-ups${followups.length ? ` (${followups.length})` : ''}` },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-6 py-3 text-xs tracking-widest uppercase transition-colors ${tab === t.key ? 'border-b-2 border-amber-400 text-amber-300' : 'text-white/30 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        {tab !== 'followups' && (
          <div className="mb-6">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full max-w-md bg-transparent border border-white/10 focus:border-amber-400/30 outline-none px-4 py-2.5 text-white/70 text-sm placeholder:text-white/15"
            />
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="text-center py-20">
            <p className="text-white/20 text-sm tracking-wider">Loading...</p>
          </div>
        ) : tab === 'pipeline' ? (
          /* Pipeline Kanban */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {STAGES.map(s => (
              <div key={s.key} className="bg-white/[0.02] border border-white/5 rounded-lg p-3 min-h-[300px]">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  <h3 className="text-xs tracking-widest uppercase text-white/50">{s.label}</h3>
                  <span className="text-white/20 text-xs ml-auto">{byStage(s.key).length}</span>
                </div>
                <div className="space-y-2">
                  {byStage(s.key).map(c => (
                    <Link key={c.booking_id} href={`/admin/crm/${c.booking_id}`}
                      className="block bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-amber-400/20 rounded p-3 transition-all cursor-pointer group">
                      <p className="text-sm text-white/80 group-hover:text-white truncate">{c.customer_name}</p>
                      <p className="text-xs text-white/30 truncate mt-1">{c.customer_phone}</p>
                      {c.follow_up_date && new Date(c.follow_up_date) <= new Date() && (
                        <p className="text-xs text-red-400 mt-1">Follow-up due</p>
                      )}
                    </Link>
                  ))}
                  {byStage(s.key).length === 0 && (
                    <p className="text-white/10 text-xs text-center py-8">No clients</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'clients' ? (
          /* Client list */
          filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/20 text-sm tracking-wider">No clients found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-3 px-2 text-xs tracking-widest uppercase text-white/30 font-normal">Name</th>
                    <th className="py-3 px-2 text-xs tracking-widest uppercase text-white/30 font-normal">Contact</th>
                    <th className="py-3 px-2 text-xs tracking-widest uppercase text-white/30 font-normal">Stage</th>
                    <th className="py-3 px-2 text-xs tracking-widest uppercase text-white/30 font-normal">Visits</th>
                    <th className="py-3 px-2 text-xs tracking-widest uppercase text-white/30 font-normal">Follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const stageInfo = STAGES.find(s => s.key === c.stage)
                    const isOverdue = c.follow_up_date && new Date(c.follow_up_date) <= new Date()
                    return (
                      <tr key={c.booking_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-2">
                          <Link href={`/admin/crm/${c.booking_id}`} className="text-sm text-white/80 hover:text-amber-300 transition-colors">
                            {c.customer_name}
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-xs text-white/40">
                          <div>{c.customer_phone}</div>
                          <div className="text-white/25">{c.customer_email}</div>
                        </td>
                        <td className="py-3 px-2">
                          <select
                            value={c.stage}
                            onChange={e => updateStage(c.booking_id, e.target.value as Stage)}
                            className="bg-transparent border border-white/10 text-xs text-white/60 px-2 py-1 outline-none hover:border-amber-400/30 cursor-pointer"
                          >
                            {STAGES.map(s => (
                              <option key={s.key} value={s.key} className="bg-[#0a0a0a]">{s.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-2 text-xs text-white/40">{c.total_bookings}</td>
                        <td className="py-3 px-2 text-xs">
                          {c.follow_up_date ? (
                            <span className={isOverdue ? 'text-red-400' : 'text-white/40'}>
                              {new Date(c.follow_up_date).toLocaleDateString('en-US')}
                            </span>
                          ) : (
                            <span className="text-white/15">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Follow-up dashboard */
          followups.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/20 text-sm tracking-wider">No follow-ups due.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-white/30 tracking-wider mb-4">
                Clients due or overdue for follow-up today:
              </p>
              {followups.map(c => {
                const isOverdue = c.follow_up_date && new Date(c.follow_up_date) < new Date(new Date().toDateString())
                return (
                  <Link key={c.booking_id} href={`/admin/crm/${c.booking_id}`}
                    className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-amber-400/20 rounded-lg p-4 transition-all cursor-pointer group">
                    <div>
                      <p className="text-sm text-white/80 group-hover:text-white">{c.customer_name}</p>
                      <p className="text-xs text-white/30 mt-1">{c.customer_phone} {c.customer_email && `· ${c.customer_email}`}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${isOverdue ? 'text-red-400' : 'text-amber-300'}`}>
                        {isOverdue ? 'Overdue' : 'Due today'}
                      </p>
                      {c.follow_up_date && (
                        <p className="text-xs text-white/30 mt-1">
                          {new Date(c.follow_up_date).toLocaleDateString('en-US')}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
