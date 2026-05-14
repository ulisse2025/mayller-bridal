'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AnimatedNavFramer } from '@/components/ui/navigation-menu'

type Photo = { id: string; url: string; caption: string }

const DEFAULTS: Photo[] = [
  { id: 'd1', url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80', caption: 'Bridal Showcase 2025' },
  { id: 'd2', url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80', caption: 'Barcelona Atelier Opening' },
  { id: 'd3', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80', caption: 'Collection Preview Night' },
  { id: 'd4', url: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?auto=format&fit=crop&w=800&q=80', caption: 'Private Trunk Show' },
  { id: 'd5', url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=800&q=80', caption: 'Bride & Style Forum' },
  { id: 'd6', url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80', caption: 'Mayller Gala 2024' },
]

export default function EventsPage() {
  const [photos, setPhotos] = useState<Photo[]>(DEFAULTS)
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [adminPw, setAdminPw] = useState('')

  useEffect(() => {
    const pw = sessionStorage.getItem('mayller-admin-pw')
    if (pw) { setIsAdmin(true); setAdminPw(pw) }
    fetch('/api/admin/photos?section=events')
      .then(r => r.json()).then(d => { if (d.photos?.length) setPhotos(d.photos) }).catch(() => {})
  }, [])

  const upload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file); fd.append('section', 'events')
    fd.append('caption', file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    const res = await fetch('/api/admin/upload', { method: 'POST', headers: { 'x-admin-password': adminPw }, body: fd })
    const data = await res.json()
    if (data.photo) setPhotos(p => [...p, data.photo])
    setUploading(false); e.target.value = ''
  }, [adminPw])

  const remove = useCallback(async (id: string) => {
    await fetch(`/api/admin/photos?section=events&id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': adminPw } })
    setPhotos(p => p.filter(x => x.id !== id))
  }, [adminPw])

  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatedNavFramer />

      {/* Hero */}
      <section className="h-[70vh] relative flex items-end pb-20 px-8 md:px-20 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=90"
          alt="Events" className="absolute inset-0 w-full h-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="relative z-10">
          <p className="text-amber-300/50 text-xs tracking-[0.5em] uppercase mb-4">Mayller · Experiences</p>
          <h1 className="text-[clamp(3rem,9vw,8rem)] font-light tracking-[0.08em] leading-none">EVENTS</h1>
          <p className="mt-5 text-white/40 text-sm tracking-[0.25em] uppercase max-w-sm">
            Exclusive bridal experiences — showcases, trunk shows & private soirées.
          </p>
        </div>
      </section>

      {/* Newsletter strip */}
      <div className="bg-amber-400 py-5 px-8 md:px-20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-black text-xs font-semibold tracking-widest uppercase">Stay informed — be the first to know about upcoming Mayller events</p>
        <Link href="/contact" className="text-xs font-bold tracking-widest uppercase text-black border border-black px-6 py-2 hover:bg-black hover:text-amber-400 transition-colors whitespace-nowrap">
          Contact Us
        </Link>
      </div>

      {/* Gallery */}
      <section className="py-20 px-4 md:px-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12 px-4">
            <div>
              <p className="text-amber-300/40 text-xs tracking-[0.4em] uppercase mb-2">{photos.length} events</p>
              <h2 className="text-3xl font-light tracking-[0.2em]">Gallery</h2>
            </div>
            {isAdmin && (
              <label className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 border border-amber-400/40 text-amber-300/80 text-xs tracking-widest uppercase hover:bg-amber-400/10 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                {uploading ? 'Uploading...' : 'Add Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={upload} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {photos.map((photo, i) => (
              <div key={photo.id}
                className={`group relative overflow-hidden cursor-pointer ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                style={{ aspectRatio: i === 0 ? '16/9' : '4/3' }}
                onClick={() => setLightbox(photo)}>
                <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-white text-sm font-light tracking-wider">{photo.caption}</p>
                    {isAdmin && <button onClick={e => { e.stopPropagation(); remove(photo.id) }} className="mt-1 text-red-400/80 text-xs hover:text-red-300">Remove</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/96 z-[100] flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-6 right-8 text-white/40 hover:text-white text-xs tracking-widest uppercase">Close ✕</button>
          <img src={lightbox.url} alt={lightbox.caption} className="max-h-[88vh] max-w-[88vw] object-contain" />
          <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-widest">{lightbox.caption}</p>
        </div>
      )}

      <footer className="border-t border-white/10 py-8 px-8 md:px-20 flex justify-between items-center">
        <Link href="/" className="text-xs font-light tracking-[0.3em] text-white/30 hover:text-white transition-colors uppercase">Mayller</Link>
        <p className="text-white/15 text-xs tracking-widest">Events & Experiences</p>
        <Link href="/contact" className="text-xs tracking-widest uppercase text-amber-300/50 hover:text-amber-300 transition-colors">Contact →</Link>
      </footer>
    </div>
  )
}
