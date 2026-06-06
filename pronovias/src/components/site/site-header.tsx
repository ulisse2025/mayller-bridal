'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/collection', label: 'Collection' },
  { href: '/alteration', label: 'Alterations' },
  { href: '/events', label: 'Events' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

const PHONE_DISPLAY = '(484) 638-6555'
const PHONE_TEL = 'tel:+14846386555'
const WHATSAPP = 'https://wa.me/14846386555?text=Hi%20Mayller%20Bridal!%20I%27d%20like%20to%20book%20an%20appointment.'

/**
 * Sticky site header.
 * variant "overlay": transparent over a dark hero, turns ivory on scroll (homepage).
 * variant "solid": always ivory (inner pages).
 */
export function SiteHeader({ variant = 'solid' }: { variant?: 'overlay' | 'solid' }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [open])

  const solid = variant === 'solid' || scrolled || open
  const ink = solid ? 'text-nero' : 'text-ivory'

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          solid ? 'bg-ivory/95 backdrop-blur border-b border-line' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-12">
          <Link href="/" className={`leading-none ${ink}`} aria-label="Mayller Bridal — home">
            <span className="font-display text-2xl tracking-[0.14em]">MAYLLER</span>
            <span className="mt-1 block text-[9px] font-normal uppercase tracking-[0.42em] text-champagne-dark">
              Italian Style
            </span>
          </Link>

          <nav className={`hidden items-center gap-8 lg:flex ${ink}`} aria-label="Main">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[11px] uppercase tracking-[0.22em] transition-opacity hover:opacity-60 ${
                  pathname === item.href ? 'text-champagne-dark' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <a
              href={PHONE_TEL}
              className={`hidden text-[11px] tracking-[0.14em] xl:block ${ink} hover:opacity-60`}
            >
              {PHONE_DISPLAY}
            </a>
            <Link
              href="/#appointment"
              className="hidden bg-nero px-6 py-3 text-[11px] uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-champagne-dark md:inline-block"
            >
              Book Appointment
            </Link>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
              className={`flex h-11 w-11 flex-col items-center justify-center gap-1.5 lg:hidden ${ink}`}
            >
              <span
                className={`h-px w-6 bg-current transition-transform ${open ? 'translate-y-[3.5px] rotate-45' : ''}`}
              />
              <span
                className={`h-px w-6 bg-current transition-transform ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 flex flex-col bg-ivory px-8 pt-28 pb-10 lg:hidden">
          <nav className="flex flex-col gap-2" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="font-display border-b border-line py-4 text-3xl text-nero"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            <Link
              href="/#appointment"
              onClick={() => setOpen(false)}
              className="bg-nero px-6 py-4 text-center text-xs uppercase tracking-[0.22em] text-ivory"
            >
              Book Your Appointment
            </Link>
            <a
              href={PHONE_TEL}
              className="border border-champagne px-6 py-4 text-center text-xs uppercase tracking-[0.22em] text-nero"
            >
              Call {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Fixed bottom action bar — mobile only.
 * Hidden automatically while the #appointment section is on screen.
 */
export function MobileActionBar() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const target = document.getElementById('appointment')
    if (!target || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => setHidden(entries[0]?.isIntersecting ?? false),
      { threshold: 0.15 },
    )
    io.observe(target)
    return () => io.disconnect()
  }, [])

  if (hidden) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_1.4fr_1fr] border-t border-line bg-ivory md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <a
        href={PHONE_TEL}
        className="flex items-center justify-center py-4 text-[10px] uppercase tracking-[0.2em] text-nero"
      >
        Call
      </a>
      <Link
        href="/#appointment"
        className="flex items-center justify-center bg-nero py-4 text-[10px] uppercase tracking-[0.24em] text-ivory"
      >
        Book Appointment
      </Link>
      <a
        href={WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center py-4 text-[10px] uppercase tracking-[0.2em] text-nero"
      >
        WhatsApp
      </a>
    </div>
  )
}
