import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader, MobileActionBar } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { ContactForm } from '@/components/contact/contact-form'

export const metadata: Metadata = {
  title: 'Visit Our Boutique — Sinking Spring, PA',
  description:
    'Mayller Bridal Italian Style: 4054 W Penn Ave, Sinking Spring PA 19608. Call (484) 638-6555, message us on WhatsApp or book your bridal appointment online.',
  alternates: { canonical: 'https://mayllerbridal.com/contact' },
}

const HOURS = [
  { day: 'Monday – Friday', time: '10:00 AM – 6:00 PM' },
  { day: 'Saturday', time: '10:00 AM – 6:00 PM (appointments start by 2 PM)' },
  { day: 'Sunday', time: 'Closed' },
]

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('Mayller Bridal Italian Style 4054 W Penn Ave Sinking Spring PA 19608')

const MAPS_EMBED =
  'https://www.google.com/maps?q=' +
  encodeURIComponent('4054 W Penn Ave, Sinking Spring, PA 19608') +
  '&output=embed'

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-ivory pt-20">
        <section className="mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-12 lg:pt-24">
          <p className="eyebrow">Visit the Boutique</p>
          <h1 className="font-display mt-4 text-[clamp(2.4rem,5vw,4rem)] font-medium leading-tight text-nero">
            Contact &amp; Visit
          </h1>

          <div className="mt-14 grid gap-14 lg:grid-cols-2">
            {/* Info column */}
            <div>
              <h2 className="text-[11px] uppercase tracking-[0.3em] text-champagne-dark">Boutique</h2>
              <address className="mt-4 text-lg font-light not-italic leading-relaxed text-nero">
                <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="hover:text-champagne-dark">
                  4054 W Penn Ave
                  <br />
                  Sinking Spring, PA 19608
                </a>
              </address>

              <h2 className="mt-10 text-[11px] uppercase tracking-[0.3em] text-champagne-dark">Talk to us</h2>
              <ul className="mt-4 space-y-3 text-lg font-light text-nero">
                <li>
                  <a href="tel:+14846386555" className="hover:text-champagne-dark">
                    ☎ (484) 638-6555 — tap to call
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/14846386555?text=Hi%20Mayller%20Bridal!%20I%27d%20like%20to%20book%20an%20appointment."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-champagne-dark"
                  >
                    WhatsApp — chat with us
                  </a>
                </li>
                <li className="text-base text-taupe">
                  Our phone is answered 24/7 — after hours, Sofia, our virtual concierge,
                  can book, move or cancel appointments for you.
                </li>
              </ul>

              <h2 className="mt-10 text-[11px] uppercase tracking-[0.3em] text-champagne-dark">Hours</h2>
              <table className="mt-4 w-full max-w-md text-left text-base font-light text-nero">
                <tbody>
                  {HOURS.map((h) => (
                    <tr key={h.day} className="border-b border-line">
                      <td className="py-3 pr-6">{h.day}</td>
                      <td className="py-3 text-taupe">{h.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/#appointment"
                  className="bg-nero px-8 py-4 text-[11px] uppercase tracking-[0.24em] text-ivory transition-colors hover:bg-champagne-dark"
                >
                  Book Appointment
                </Link>
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-champagne px-8 py-4 text-[11px] uppercase tracking-[0.24em] text-nero transition-colors hover:bg-champagne/10"
                >
                  Get Directions
                </a>
              </div>
            </div>

            {/* Map + form column */}
            <div>
              <div className="aspect-[4/3] w-full overflow-hidden border border-line bg-ivory-deep">
                <iframe
                  src={MAPS_EMBED}
                  title="Mayller Bridal Italian Style on Google Maps"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0"
                />
              </div>
              <div className="mt-10">
                <h2 className="text-[11px] uppercase tracking-[0.3em] text-champagne-dark">Write to us</h2>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <MobileActionBar />
    </>
  )
}
