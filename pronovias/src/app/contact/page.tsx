'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatedNavFramer } from '@/components/ui/navigation-menu'

const HOURS = [
  { day: 'Monday – Friday', time: '10:00 AM – 6:00 PM' },
  { day: 'Saturday', time: '10:00 AM – 5:00 PM' },
  { day: 'Sunday', time: 'By appointment only' },
]

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

      {/* Header */}
      <section className="pt-40 pb-16 px-8 md:px-20 border-b border-white/10">
        <p className="text-amber-300/50 text-xs tracking-[0.5em] uppercase mb-4">Get in Touch</p>
        <h1 className="text-[clamp(3rem,7vw,6rem)] font-light tracking-[0.08em] leading-none">CONTACT</h1>
      </section>

      {/* Main */}
      <section className="py-20 px-8 md:px-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20">

          {/* Form */}
          <div>
            <h2 className="text-xl font-light tracking-[0.2em] uppercase mb-8">Send a Message</h2>
            {status === 'sent' ? (
              <div className="border border-amber-400/30 bg-amber-400/5 p-8">
                <p className="text-amber-300 text-sm tracking-wider mb-2">Message received.</p>
                <p className="text-white/40 text-xs">We&apos;ll get back to you within 24 hours.</p>
                <button onClick={() => { setForm({ name: '', email: '', subject: '', message: '' }); setStatus('idle') }}
                  className="mt-6 text-xs tracking-widest uppercase text-white/30 hover:text-white transition-colors">
                  Send another →
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                {[
                  { key: 'name', label: 'Full Name *', type: 'text', placeholder: 'Emma Johnson' },
                  { key: 'email', label: 'Email Address *', type: 'email', placeholder: 'emma@email.com' },
                  { key: 'subject', label: 'Subject *', type: 'text', placeholder: 'e.g. Appointment inquiry' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs tracking-[0.2em] uppercase text-white/30 mb-2">{label}</label>
                    <input
                      type={type}
                      required
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-transparent border border-white/10 focus:border-amber-400/50 outline-none px-4 py-3 text-white/80 text-sm placeholder:text-white/15 transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs tracking-[0.2em] uppercase text-white/30 mb-2">Message *</label>
                  <textarea
                    required rows={5}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="How can we help you?"
                    className="w-full bg-transparent border border-white/10 focus:border-amber-400/50 outline-none px-4 py-3 text-white/80 text-sm placeholder:text-white/15 transition-colors resize-none"
                  />
                </div>
                {status === 'error' && (
                  <p className="text-red-400 text-xs tracking-wider">Something went wrong. Please try again.</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full py-4 bg-white text-black text-xs font-bold tracking-[0.3em] uppercase hover:bg-amber-300 transition-colors disabled:opacity-50"
                >
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="space-y-12">
            <div>
              <h3 className="text-xs tracking-[0.3em] uppercase text-white/30 mb-5">Atelier Address</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Mayller Bridal Atelier<br />
                Passeig de Gràcia, 92<br />
                08008 Barcelona, Spain
              </p>
            </div>

            <div>
              <h3 className="text-xs tracking-[0.3em] uppercase text-white/30 mb-5">Contact</h3>
              <div className="space-y-2 text-sm text-white/60">
                <p><span className="text-white/25 text-xs tracking-wider mr-3">Email</span>
                  <a href="mailto:mayllerbridalitalianstyle@gmail.com" className="hover:text-amber-300 transition-colors">
                    mayllerbridalitalianstyle@gmail.com
                  </a>
                </p>
                <p><span className="text-white/25 text-xs tracking-wider mr-3">Phone</span>
                  <a href="tel:+39000000000" className="hover:text-amber-300 transition-colors">+39 000 000 0000</a>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs tracking-[0.3em] uppercase text-white/30 mb-5">Opening Hours</h3>
              <div className="space-y-3">
                {HOURS.map(h => (
                  <div key={h.day} className="flex justify-between text-sm">
                    <span className="text-white/40">{h.day}</span>
                    <span className="text-white/70">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-8">
              <h3 className="text-xs tracking-[0.3em] uppercase text-white/30 mb-5">Book an Appointment</h3>
              <p className="text-white/40 text-sm leading-relaxed mb-5">
                For bridal consultations and fittings, book directly through our online calendar.
              </p>
              <Link href="/#appointment"
                className="inline-block px-8 py-3 border border-amber-400/40 text-amber-300/80 text-xs tracking-widest uppercase hover:bg-amber-400/10 transition-colors">
                Book Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 px-8 md:px-20 flex justify-between items-center">
        <Link href="/" className="text-xs font-light tracking-[0.3em] text-white/30 hover:text-white transition-colors uppercase">Mayller</Link>
        <p className="text-white/15 text-xs tracking-widest">Barcelona · Since 1964</p>
        <Link href="/#appointment" className="text-xs tracking-widest uppercase text-amber-300/50 hover:text-amber-300 transition-colors">Book →</Link>
      </footer>
    </div>
  )
}
