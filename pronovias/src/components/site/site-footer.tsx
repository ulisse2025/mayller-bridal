import Link from 'next/link'

const EXPLORE = [
  { href: '/collection', label: 'Collection' },
  { href: '/alteration', label: 'Alterations' },
  { href: '/events', label: 'Events' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
]

const SERVICES = [
  'Wedding Dresses',
  'Tuxedos & Groom',
  'Master Alterations',
  'Custom Design',
  'Dress Rental',
  'Veils & Accessories',
  'Custom Embroidery',
]

export function SiteFooter() {
  return (
    <footer className="bg-nero text-[#cfc6b8]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand + NAP */}
          <div>
            <div className="flex h-14 w-14 items-center justify-center border border-champagne/40">
              <span className="font-display text-2xl text-champagne">M</span>
            </div>
            <p className="font-display mt-5 text-xl tracking-[0.14em] text-ivory">MAYLLER</p>
            <p className="text-[9px] uppercase tracking-[0.42em] text-champagne-dark">
              Italian Style
            </p>
            <address className="mt-5 text-sm not-italic leading-relaxed">
              4054 W Penn Ave
              <br />
              Sinking Spring, PA 19608
              <br />
              <a href="tel:+14846386555" className="underline-offset-4 hover:text-ivory hover:underline">
                (484) 638-6555
              </a>
            </address>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.3em] text-ivory">Explore</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {EXPLORE.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-ivory">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/#appointment" className="text-champagne transition-colors hover:text-ivory">
                  Book Appointment
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.3em] text-ivory">Services</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {SERVICES.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.3em] text-ivory">Hours</h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li>Monday – Friday · 10 AM – 6 PM</li>
              <li>Saturday · 10 AM – 6 PM</li>
              <li className="text-xs text-[#9a917f]">(Saturday appointments start by 2 PM)</li>
              <li>Sunday · Closed</li>
            </ul>
            <p className="mt-5 text-xs text-[#9a917f]">Private appointments only.</p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center">
          <div className="flex gap-6 text-[11px] uppercase tracking-[0.2em]">
            <a
              href="https://www.instagram.com/mayller_bridal_italianstyle/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ivory"
              aria-label="Mayller Bridal on Instagram"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/p/Mayller-Bridal-Italian-Style-100091294175941/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ivory"
              aria-label="Mayller Bridal on Facebook"
            >
              Facebook
            </a>
            <a
              href="https://www.tiktok.com/@maylleritalianstyle"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ivory"
              aria-label="Mayller Bridal on TikTok"
            >
              TikTok
            </a>
            <a
              href="https://www.youtube.com/channel/UCrmwEBnV2avhQkGDu_NoAsw"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ivory"
              aria-label="Mayller Bridal on YouTube"
            >
              YouTube
            </a>
            <a
              href="https://wa.me/14846386555"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ivory"
              aria-label="Chat with Mayller Bridal on WhatsApp"
            >
              WhatsApp
            </a>
          </div>
          <div className="flex gap-6 text-xs text-[#9a917f]">
            <Link href="/privacy" className="hover:text-ivory">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-ivory">
              Terms of Service
            </Link>
            <span>© {new Date().getFullYear()} Mayller Italian Style LLC</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
