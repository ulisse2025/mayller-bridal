'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

type Section = 'collection' | 'alteration' | 'events'
type Photo = { id: string; url: string; caption: string; uploadedAt: string }

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'collection', label: 'Collection 2026' },
  { key: 'alteration', label: 'Alteration' },
  { key: 'events', label: 'Events' },
]

export default function AdminPage() {
  const [pw, setPw] = useState('')
  const [auth, setAuth] = useState(false)
  const [authError, setAuthError] = useState('')
  const [tab, setTab] = useState<Section>('collection')
  const [photos, setPhotos] = useState<Record<Section, Photo[]>>({ collection: [], alteration: [], events: [] })
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('mayller-admin-pw')
    if (saved) { setAuth(true); setPw(saved); loadPhotos(saved) }
  }, [])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (res.ok) {
      sessionStorage.setItem('mayller-admin-pw', pw)
      setAuth(true)
      loadPhotos(pw)
    } else {
      setAuthError('Incorrect password.')
    }
  }

  const loadPhotos = useCallback(async (password: string) => {
    const sections: Section[] = ['collection', 'alteration', 'events']
    const results = await Promise.all(sections.map(s =>
      fetch(`/api/admin/photos?section=${s}`).then(r => r.json())
    ))
    setPhotos({ collection: results[0].photos || [], alteration: results[1].photos || [], events: results[2].photos || [] })
  }, [])

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('section', tab)
    fd.append('caption', caption || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    const res = await fetch('/api/admin/upload', { method: 'POST', headers: { 'x-admin-password': pw }, body: fd })
    const data = await res.json()
    if (data.photo) setPhotos(p => ({ ...p, [tab]: [...p[tab], data.photo] }))
    setUploading(false); setCaption(''); e.target.value = ''
  }

  const remove = async (id: string) => {
    await fetch(`/api/admin/photos?section=${tab}&id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': pw } })
    setPhotos(p => ({ ...p, [tab]: p[tab].filter(x => x.id !== id) }))
  }

  const logout = () => { sessionStorage.removeItem('mayller-admin-pw'); setAuth(false); setPw('') }

  if (!auth) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-white/20 text-xs tracking-[0.4em] uppercase mb-3">Mayller</p>
          <h1 className="text-2xl font-light tracking-[0.3em] text-white">ADMIN</h1>
        </div>
        <form onSubmit={login} className="space-y-4">
          <input
            type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="Enter admin password"
            className="w-full bg-transparent border border-white/15 focus:border-amber-400/50 outline-none px-4 py-4 text-white text-sm placeholder:text-white/20 tracking-wider"
          />
          {authError && <p className="text-red-400 text-xs tracking-wider">{authError}</p>}
          <button type="submit"
            className="w-full py-4 bg-amber-400 text-black text-xs font-bold tracking-[0.3em] uppercase hover:bg-amber-300 transition-colors">
            Sign In
          </button>
        </form>
        <div className="mt-8 text-center">
          <Link href="/" className="text-white/20 text-xs tracking-widest hover:text-white/50 transition-colors">← Back to Site</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs tracking-[0.3em] font-light">MAYLLER ADMIN</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        </div>
        <div className="flex items-center gap-5">
          <Link href="/admin/crm" className="text-white/30 text-xs tracking-widest hover:text-white transition-colors">CRM</Link>
          <Link href="/admin/phone" className="text-white/30 text-xs tracking-widest hover:text-white transition-colors">Phone</Link>
          <Link href="/" className="text-white/30 text-xs tracking-widest hover:text-white transition-colors">View Site</Link>
          <button onClick={logout} className="text-white/20 text-xs tracking-widest hover:text-red-400 transition-colors">Sign Out</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-widest mb-1">Photo Management</h1>
          <p className="text-white/30 text-xs tracking-wider">Upload, manage and remove photos for each section of the site.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-white/10">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setTab(s.key)}
              className={`px-6 py-3 text-xs tracking-widest uppercase transition-colors ${tab === s.key ? 'border-b-2 border-amber-400 text-amber-300' : 'text-white/30 hover:text-white'}`}>
              {s.label} <span className="ml-2 text-white/20">({photos[s.key].length})</span>
            </button>
          ))}
        </div>

        {/* Upload area */}
        <div className="border border-dashed border-white/15 hover:border-amber-400/30 transition-colors p-8 mb-8 text-center">
          <svg className="w-8 h-8 text-white/15 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
          </svg>
          <p className="text-white/30 text-xs tracking-wider mb-4">Upload a photo to <span className="text-amber-300/70">{SECTIONS.find(s => s.key === tab)?.label}</span></p>
          <input
            type="text" value={caption} onChange={e => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="w-full max-w-xs bg-transparent border border-white/10 focus:border-amber-400/30 outline-none px-4 py-2 text-white/60 text-xs placeholder:text-white/15 mb-4 mx-auto block"
          />
          <label className={`inline-flex items-center gap-2 cursor-pointer px-8 py-3 bg-amber-400 text-black text-xs font-bold tracking-widest uppercase hover:bg-amber-300 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Uploading...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>Choose File</>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={upload} disabled={uploading} />
          </label>
        </div>

        {/* Photos grid */}
        {photos[tab].length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/20 text-sm tracking-wider">No photos yet. Upload the first one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {photos[tab].map(photo => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden bg-white/5">
                <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <p className="text-white text-xs text-center px-2 tracking-wide leading-tight">{photo.caption}</p>
                  <button onClick={() => remove(photo.id)}
                    className="mt-1 px-4 py-1.5 bg-red-500/80 hover:bg-red-500 text-white text-xs tracking-wider transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
