'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AnimatedNavFramer } from '@/components/ui/navigation-menu'

type Photo = { id: string; url: string; caption: string }

const DEFAULTS: Photo[] = [
  { id: 'd1', url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80', caption: 'Precision Stitching' },
  { id: 'd2', url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80', caption: 'The Perfect Fit' },
  { id: 'd3', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80', caption: 'Detail Work' },
  { id: 'd4', url: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=crop&w=800&q=80', caption: 'Finishing Touch' },
]

const STEPS = [
  { n: '01', title: 'Consultation', desc: 'Discuss your vision and alteration needs with our specialist seamstress.' },
  { n: '02', title: 'Measurements', desc: 'Precise body measurements to guarantee a flawless, tailored fit.' },
  { n: '03', title: 'Alterations', desc: 'Expert hands work with exceptional precision on every seam and stitch.' },
  { n: '04', title: 'Final Fitting', desc: 'Try on your perfected gown. Fine adjustments until absolutely right.' },
]

export default function AlterationPage() {
  const [photos, setPhotos] = useState<Photo[]>(DEFAULTS)
  const [isAdmin, setIsAdmin] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [adminPw, setAdminPw] = useState('')

  useEffect(() => {
    const pw = sessionStorage.getItem('mayller-admin-pw')
    if (pw) { setIsAdmin(true); setAdminPw(pw) }
    fetch('/api/admin/photos?section=alteration')
      .then(r => r.json()).then(d => { if (d.photos?.length) setPhotos(d.photos) }).catch(() => {})
  }, [])

  const upload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file); fd.append('section', 'alteration')
    fd.append('caption', file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    const res = await fetch('/api/admin/upload', { method: 'POST', headers: { 'x-admin-password': adminPw }, body: fd })
    const data = await res.json()
    if (data.photo) setPhotos(p => [...p, data.photo])
    setUploading(false); e.target.value = ''
  }, [adminPw])

  const remove = useCallback(async (id: string) => {
    await fetch(`/api/admin/photos?section=alteration&id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': adminPw } })
    setPhotos(p => p.filter(x => x.id !== id))
  }, [adminPw])

  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatedNavFramer />

      {/* Hero */}
      <section className="h-screen relative flex items-center justify-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=90"
          alt="Alteration" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
        <div className="relative z-10 text-center px-4">
          <p className="text-amber-300/50 text-xs tracking-[0.5em] uppercase mb-6">Mayller · Service</p>
          <h1 className="text-[clamp(3.5rem,9vw,8rem)] font-light tracking-[0.1em] leading-none mb-8">ALTERATION</h1>
          <p className="text-white/40 text-sm tracking-[0.2em] max-w-md mx-auto leading-relaxed mb-10">
            The art of the perfect fit.<br />Every stitch, every seam — tailored precisely to you.
          </p>
          <Link href="/#appointment"
            className="inline-block px-12 py-4 bg-amber-400 text-black text-xs font-bold tracking-widest uppercase hover:bg-amber-300 transition-colors">
            Book Alteration Appointment
          </Link>
        </div>
      </section>

      {/* Process */}
      <section className="py-28 px-8 md:px-20 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-300/50 text-xs tracking-[0.4em] uppercase mb-3">The Process</p>
            <h2 className="text-3xl font-light tracking-[0.2em]">Four Steps to Perfection</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < 3 && <div className="hidden md:block absolute top-6 left-full w-full h-px bg-white/10 -translate-x-1/2" />}
                <div className="w-12 h-12 rounded-full border border-amber-400/30 flex items-center justify-center mb-5">
                  <span className="text-amber-300/60 text-xs font-light tracking-widest">{s.n}</span>
                </div>
                <h3 className="text-sm font-medium tracking-[0.2em] uppercase mb-3">{s.title}</h3>
                <p className="text-white/35 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service card */}
      <section className="py-20 px-8 md:px-20 border-t border-white/10">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-amber-300/50 text-xs tracking-[0.4em] uppercase mb-3">Appointment Details</p>
          <h2 className="text-3xl font-light tracking-widest mb-10">Alteration Session</h2>
          <div className="border border-white/10 p-12">
            <p className="text-xs tracking-[0.3em] uppercase text-white/25 mb-2">Duration</p>
            <p className="text-6xl font-light text-amber-300 mb-1">30</p>
            <p className="text-white/30 text-sm tracking-wider mb-6">minutes</p>
            <p className="text-white/40 text-sm leading-relaxed mb-10">
              One-to-one session with our master seamstress.<br />
              Full consultation, measurements & planning included.
            </p>
            <Link href="/#appointment"
              className="block w-full py-4 bg-white text-black text-xs font-bold tracking-[0.3em] uppercase hover:bg-amber-300 transition-colors">
              Book Now
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 px-8 md:px-20 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-amber-300/40 text-xs tracking-[0.3em] uppercase mb-2">Portfolio</p>
              <h2 className="text-2xl font-light tracking-widest">Our Work</h2>
            </div>
            {isAdmin && (
              <label className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 border border-amber-400/40 text-amber-300/80 text-xs tracking-widest uppercase hover:bg-amber-400/10 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                {uploading ? 'Uploading...' : 'Add Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={upload} />
              </label>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {photos.map(photo => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden">
                <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100">
                  <p className="text-white text-xs tracking-wider">{photo.caption}</p>
                  {isAdmin && <button onClick={() => remove(photo.id)} className="mt-1 text-red-400/80 text-xs hover:text-red-300 text-left">Remove</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 px-8 md:px-20 flex justify-between items-center">
        <Link href="/" className="text-xs font-light tracking-[0.3em] text-white/30 hover:text-white transition-colors uppercase">Mayller</Link>
        <p className="text-white/15 text-xs tracking-widest">Alteration Service · 30 min</p>
        <Link href="/#appointment" className="text-xs tracking-widest uppercase text-amber-300/50 hover:text-amber-300 transition-colors">Book →</Link>
      </footer>
    </div>
  )
}
