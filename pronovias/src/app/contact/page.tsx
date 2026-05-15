'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatedNavFramer } from '@/components/ui/navigation-menu'

const HOURS = [
  { day: 'Monday – Friday', time: '10:00 AM – 6:00 PM' },
  { day: 'Saturday', time: '10:00 AM – 2:00 PM' },
  { day: 'Sunday', time: 'Closed' },
]

const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('4054 W Penn Ave Sinking Spring PA 19608')

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatedNavFramer />

      <section className="pt-40 pb-16 px-8 md:px-20 border-b border-white/10">
        <p className="text-amber-300/50 text-xs tracking-[0.5em] uppercase mb-4">Get in Touch</p>
        <h1 className="text-[clamp(3rem,7vw,6rem)] font-light tracking-[0.08em] leading-none">CONTACT</h1>
        <p className="mt-6 text-white/40 text-sm max-w-xl leading-relaxed">
          We&apos;d love to hear from you. Whether you&apos;re planning a wedding, exploring custom design, or simply curious about our atelier — write to us, call us, or stop by our boutique in Sinking Spring.
        </p>
      </section>

      <section className="py-20 px-8 md:px-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20">

          <div>
            <h2 className="text-xl font-light tracking-[0.2em] uppercase mb-8">Send a Message</h2>
            {status === 'sent' ? (
              <div className="border border-amber-400/30 bg-amber-400/5 p-8">
                <p className="text-amber-300 text-sm tracking-wider mb-2">Thank you — your message is on its way.</p>
                <p className="text-white/40 text-xs">We typically reply within one business day.</p>
                <button onClick={() => { setForm({ name: '', email: '', subject: '', message: '' }); setStatus('idle') }} className="mt-6 text-xs tracking-widest uppercase text-white/30 hover:text-white transition-colors">
                  Send another →
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                {[
                  { key: 'name', label: 'Full Name *', type: 'text', placeholder: 'e.g. Emma Johnson' },
                  { key: 'email', label: 'Email Address *', type: 'email', placeholder: 'e.g. emma@email.com' },
                  { key: 'subject', label: 'Subject *', type: 'text', placeholder: 'e.g. Wedding dress consultation' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs tracking-[0.2em] uppercase text-white/30 mb-2">{label}</label>
                    <input type={type} required value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full bg-transparent border border-white/10 focus:border-amber-400/50 outline-none px-4 py-3 text-white/80 text-sm placeholder:text-white/15 transition-colors" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs tracking-[0.2em] uppercase text-white/30 mb-2">Message *</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us a little about your wedding, the look you have in mind, or any questions for our team..." className="w-full bg-transparent border border-white/10 focus:border-amber-400/50 outline-none px-4 py-3 text-white/80 text-sm placeholder:text-white/15 transition-colors resize-none" />
                </div>
                {status === 'error' && (
                  <p className="text-red-400 text-xs tracking-wider">Something went wrong. Please try again or call us directly.</p>
                )}
                <button type="submit" disabled={status === 'sending'} className="w-full py-4 bg-white text-black text-xs font-bold tracking-[0.3em] uppercase hover:bg-amber-300 transition-colors disabled:opacity-50">
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-12">
            <div>
              <h3 className="text-xs tracking-[0.3em] uppercase text-white/30 mb-5">Visit Our Boutique</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Mayller Bridal Italian Style<br />
                4054 W Penn Ave<br />
                Sinking Spring, PA 19608<br />
                United States
              </p>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-xs tracking-widest uppercase text-amber-300/60 hover:text-amber-300 transition-colors">Get Directions →</a>
            </div>

            <div>
              <h3 className="text-xs tracking-[0.3em] uppercase text-white/30 mb-5">Contact</h3>
              <div className="space-y-3 text-sm text-white/60">
                <p>
                  <span className="text-white/25 text-xs tracking-wider mr-3 inline-block w-12">Phone</span>
                  <a href="tel:+14846386555" className="hover:text-amber-300 transition-colors">(484) 638-6555</a>
                </p>
                <p>
                  <span className="text-white/25 text-xs tracking-wider mr-3 inline-block w-12">Email</span>
                  <a href="mailto:mayllerbridalitalianstyle@gmail.com" className="hover:text-amber-300 transition-colors">mayllerbridalitalianstyle@gmail.com</a>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs tracking-[0.3em] uppercase text-white/30 mb-5">Boutique Hours</h3>
              <div className="space-y-3">
                {HOURS.map(h => (
                  <div key={h.day} className="flex justify-between text-sm">
                    <span className="text-white/40">{h.day}</span>
                    <span className="text-white/70">{h.time}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-white/30 leading-relaxed">
                Bridal consultations and fittings are by appointment. Walk-ins are welcome during regular hours for accessories and inquiries.
              </p>
            </div>

            <div>
              <h3 className="text-xs tracking-[0.3em] uppercase text-white/30 mb-5">Follow Us</h3>
              <div className="flex gap-5 text-sm">
                <a href="https://www.instagram.com/mayller_bridal_italianstyle/" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-amber-300 transition-colors">Instagram</a>
                <a href="https://www.facebook.com/p/Mayller-Bridal-Italian-Style-100091294175941/" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-amber-300 transition-colors">Facebook</a>
                <a href="https://www.tiktok.com/@maylleritalianstyle" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-amber-300 transition-colors">TikTok</a>
                <a href="https://www.youtube.com/channel/UCrmwEBnV2avhQkGDu_NoAsw" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-amber-300 transition-colors">YouTube</a>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8">
              <h3 className="text-xs tracking-[0.3em] uppercase text-white/30 mb-5">Book an Appointment</h3>
              <p className="text-white/40 text-sm leading-relaxed mb-5">
                For bridal consultations, custom design, and alterations, book your private appointment online — it only takes a minute.
              </p>
              <Link href="/#appointment" className="inline-block px-8 py-3 border border-amber-400/40 text-amber-300/80 text-xs tracking-widest uppercase hover:bg-amber-400/10 transition-colors">Book Now →</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 px-8 md:px-20 flex justify-between items-center">
        <Link href="/" className="text-xs font-light tracking-[0.3em] text-white/30 hover:text-white transition-colors uppercase">Mayller</Link>
        <p className="text-white/15 text-xs tracking-widest">Sinking Spring, PA · Italian Craftsmanship</p>
        <Link href="/#appointment" className="text-xs tracking-widest uppercase text-amber-300/50 hover:text-amber-300 transition-colors">Book →</Link>
      </footer>
    </div>
  )
}
