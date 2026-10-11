'use client'

import { useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

/**
 * Form contatti — usa l'endpoint esistente POST /api/contact
 * con lo stesso payload della versione precedente:
 * { name, email, subject, message }
 */
export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<Status>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // L'API richiede subject: se il campo facoltativo e' vuoto mandiamo un default
        body: JSON.stringify({ ...form, subject: form.subject.trim() || 'General inquiry' }),
      })
      setStatus(res.ok ? 'sent' : 'error')
      if (res.ok) setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  const inputCls =
    'w-full border border-line bg-white px-4 py-3.5 text-sm font-light text-nero placeholder:text-taupe/70 focus:border-champagne focus:outline-none'

  if (status === 'sent') {
    return (
      <div className="mt-4 border border-champagne/50 bg-white px-8 py-12 text-center">
        <p className="font-display text-2xl italic text-nero">Thank you!</p>
        <p className="mt-3 text-sm font-light text-taupe">
          We received your message and will reply within one business day.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          placeholder="Your name *"
          autoComplete="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputCls}
        />
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          placeholder="Email *"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputCls}
        />
      </div>
      <input
        id="contact-subject"
        name="subject"
        type="text"
        placeholder="Subject"
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
        className={inputCls}
      />
      <textarea
        id="contact-message"
        name="message"
        required
        placeholder="Your message *"
        rows={5}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className={inputCls}
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="bg-nero px-8 py-4 text-[11px] uppercase tracking-[0.24em] text-ivory transition-colors hover:bg-champagne-dark disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send Message'}
      </button>
      {status === 'error' && (
        <p className="text-sm text-red-600">
          Something went wrong — please try again or call us at (484) 638-6555.
        </p>
      )}
    </form>
  )
}
