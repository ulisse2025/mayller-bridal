'use client'

/**
 * WhatsAppButton
 *
 * Floating bubble bottom-right that opens a WhatsApp chat with Mayller Bridal.
 * Pre-fills a short appointment-request message.
 *
 * Same intent as the WordPress QLWAPP plugin used on the legacy site
 * (mayllerbridalitalianstyle.com) but implemented natively in React so it
 * works on this Next.js / Vercel stack without external dependencies.
 *
 * Behaviour:
 *  - Visible on every page (imported once in app/layout.tsx).
 *  - Tooltip 'How can I help you?' shown on desktop hover and on mobile after
 *    a short delay so the user notices the affordance.
 *  - Click opens wa.me/<phone>?text=<prefilled> in a new tab.
 *
 * Phone: +1 (484) 638-6555 (Mayller Pennsylvania - same as legacy site).
 */

import { useEffect, useState } from 'react'

const WHATSAPP_PHONE = '14846386555'
const PREFILL_MESSAGE = "Hi Mayller, I'd like to schedule an appointment"

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false)
  const [hovered, setHovered] = useState(false)

  // On mobile (no hover), reveal the tooltip after 2s once, then keep it.
  useEffect(() => {
    const isTouch =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none)').matches
    if (!isTouch) return
    const timer = setTimeout(() => setShowTooltip(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  const visible = hovered || showTooltip

  const href =
    'https://wa.me/' +
    WHATSAPP_PHONE +
    '?text=' +
    encodeURIComponent(PREFILL_MESSAGE)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Mayller Bridal on WhatsApp"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
      }}
    >
      {/* Tooltip label */}
      <span
        style={{
          background: 'rgba(255,255,255,0.96)',
          color: '#1a1a1a',
          fontFamily:
            'var(--font-geist-sans), -apple-system, system-ui, sans-serif',
          fontSize: '13px',
          fontWeight: 400,
          letterSpacing: '0.01em',
          padding: '8px 14px',
          borderRadius: '999px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.10)',
          whiteSpace: 'nowrap',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(8px)',
          transition: 'opacity 200ms ease, transform 200ms ease',
          pointerEvents: 'none',
        }}
      >
        How can I help you?
      </span>

      {/* Green WhatsApp bubble */}
      <span
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(37, 211, 102, 0.45)',
          transition: 'transform 180ms ease, box-shadow 180ms ease',
          transform: hovered ? 'scale(1.06)' : 'scale(1)',
        }}
      >
        {/* Official WhatsApp glyph */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          width="30"
          height="30"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="#ffffff"
            d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39-.077 0-.226-.061-.34-.117-.847-.404-1.679-.93-2.402-1.6-.196-.183-.55-.479-.55-.756 0-.336.857-1.043.857-1.387 0-.184-.085-.32-.135-.476a.793.793 0 0 0-.103-.221c-.097-.181-.275-.62-.394-.83-.227-.397-.467-.94-.708-1.328-.097-.155-.193-.305-.323-.428a1.084 1.084 0 0 0-.764-.296c-.273 0-.554.115-.812.291-.342.231-.587.554-.795.917-.27.469-.476 1.014-.476 1.555 0 .525.135 1.037.34 1.519.097.235.214.464.339.683.18.318.388.62.594.92.484.694 1.057 1.357 1.668 1.961 1.293 1.281 2.86 2.213 4.553 2.846.27.103.598.215.91.215.4 0 .82-.103 1.157-.318.404-.258.703-.65.81-1.142.045-.205.054-.405-.027-.598-.082-.184-.282-.293-.467-.402-.292-.16-1.18-.583-1.42-.667-.071-.025-.149-.038-.224-.038zM16 .003C7.165.003.002 7.166.002 16c0 2.788.717 5.408 1.978 7.69L.003 31.997l8.49-1.943A15.91 15.91 0 0 0 16 31.997C24.835 31.997 31.998 24.834 31.998 16S24.835.003 16 .003zm0 29.124a13.07 13.07 0 0 1-6.687-1.836l-.479-.286-4.957 1.135 1.143-4.823-.314-.494A13.066 13.066 0 0 1 2.927 16C2.927 8.78 8.78 2.928 16 2.928S29.073 8.781 29.073 16 23.221 29.127 16 29.127z"
          />
        </svg>
      </span>
    </a>
  )
}
