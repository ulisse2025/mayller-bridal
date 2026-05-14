'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AnimatedNavFramer } from '@/components/ui/navigation-menu'

type Photo = { id: string; url: string; caption: string }

const DEFAULTS: Photo[] = [
  { id: 'd1', url: 'https://images.unsplash.com/photo-1594552072238-b8a33785b6cd?auto=format&fit=crop&w=800&q=80', caption: 'Lūcentia Gown' },
  { id: 'd2', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', caption: 'Atelier Exclusive' },
  { id: 'd3', url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80', caption: 'Privée Collection' },
  { id: 'd4', url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80', caption: 'Signature Line' },
  { id: 'd5', url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80', caption: 'Barcelona Edit' },
  { id: 'd6', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80', caption: 'Bespoke Creation' },
  { id: 'd7', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80', caption: 'Couture Edit' },
  { id: 'd8', url: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=crop&w=800&q=80', caption: 'The Bridal Look' },
]

export default function CollectionPage() {
  const [photos, setPhotos] = useState<Photo[]>(DEFAULTS)
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [adminPw, setAdminPw] = useState('')

  useEffect(() => {
    const pw = sessionStorage.getItem('mayller-admin-pw')
    if (pw) setIsAdmin(true), setAdminPw(pw)
    fetch('/api/admin/photos?section=collection')
      .then(r => r.json())
      .then(d => { if (d.photos?.length) setPhotos(d.photos) })
      .catch(() => {})
  }, [])

  const upload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('section', 'collection')
    fd.append('caption', file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    const res = await fetch('/api/admin/upload', { method: 'POST', headers: { 'x-admin-password': adminPw }, body: fd })
    const data = await res.json()
    if (data.photo) setPhotos(p => [...p, data.photo])
    setUploading(false)
    e.target.value = ''
  }, [adminPw])

  const remove = useCallback(async (id: string) => {
    await fetch(`/api/admin/photos?section=collection&id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': adminPw } })
    setPhotos(p => p.filter(x => x.id !== id))
  }, [adminPw])

  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatedNavFramer />

      {/* Hero */}
      <section className="relative h-screen flex items-end pb-24 px-8 md:px-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1594552072238-b8a33785b6cd?auto=format&fit=crop&w=1600&q=90" alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
        </div>
        <div className="relative z-10">
          <p className="text-amber-300/60 text-xs tracking-[0.5em] uppercase mb-5">Mayller · Bridal 2026</p>
          <h1 className="text-[clamp(3.5rem,11vw,10rem)] font-light leading-[0.9] tracking-[0.05em]">
            COLLECTION<br /><span className="text-amber-300/80">2026</span>
          </h1>
          <p className="mt-8 text-white/40 text-sm tracking-[0.3em] uppercase max-w-sm leading-relaxed">
            Lūcentia — An Ode to Light.<br />Where craftsmanship meets the extraordinary.
          </p>
          <div className="mt-10 flex gap-5 items-center flex-wrap">
            <Link href="/#appointment" className="px-8 py-3 bg-white text-black text-xs font-semibold tracking-widest uppercase hover:bg-amber-300 transition-colors">
              Book Appointment
            </Link>
            <button onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-xs tracking-[0.3em] uppercase text-white/40 hover:text-white transition-colors">
              View Collection ↓
            </button>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="px-4 md:px-12 py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-amber-300/40 text-xs tracking-[0.4em] uppercase mb-2">{photos.length} designs</p>
              <h2 className="text-3xl font-light tracking-[0.2em]">The Collection</h2>
            </div>
            {isAdmin && (
              <label className={`cursor-pointer flex items-center gap-2 px-6 py-2.5 border border-amber-400/40 text-amber-300/80 text-xs tracking-widest uppercase hover:bg-amber-400/10 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                {uploading ? 'Uploading...' : 'Add Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={upload} />
              </label>
            )}
          </div>

          <div className="columns-2 md:columns-3 lg:columns-4 gap-2 space-y-2">
            {photos.map(photo => (
              <div key={photo.id} className="break-inside-avoid group relative overflow-hidden cursor-pointer" onClick={() => setLightbox(photo)}>
                <img src={photo.url} alt={photo.caption} className="w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100">
                  <p className="text-white text-xs tracking-wider font-light">{photo.caption}</p>
                  {isAdmin && (
                    <button onClick={e => { e.stopPropagation(); remove(photo.id) }}
                      className="mt-2 text-red-400/80 text-xs tracking-wider hover:text-red-300 text-left">
                      Remove ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/96 z-[100] flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setLightbox(null)}>
          <button className="absolute top-6 right-8 text-white/40 hover:text-white text-xs tracking-widest uppercase z-10">Close ✕</button>
          <img src={lightbox.url} alt={lightbox.caption} className="max-h-[88vh] max-w-[88vw] object-contain" />
          <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-[0.3em] uppercase">{lightbox.caption}</p>
        </div>
      )}

      <footer className="border-t border-white/10 py-8 px-8 md:px-20 flex justify-between items-center">
        <Link href="/" className="text-xs font-light tracking-[0.3em] text-white/30 hover:text-white transition-colors uppercase">Mayller</Link>
        <p className="text-white/15 text-xs tracking-widest">Collection 2026</p>
        <Link href="/#appointment" className="text-xs tracking-widest uppercase text-amber-300/50 hover:text-amber-300 transition-colors">Book →</Link>
      </footer>
    </div>
  )
}
