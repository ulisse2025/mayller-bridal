import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SiteHeader, MobileActionBar } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { EventsGallery } from '@/components/events/events-gallery'

export const metadata: Metadata = {
  title: 'Trunk Shows & Bridal Events',
  description:
    'Trunk shows, runway shows and private bridal events at Mayller Bridal Italian Style, Sinking Spring PA. See the gowns live and book your private appointment.',
  alternates: { canonical: 'https://mayllerbridal.com/events' },
}

export default function EventsPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-ivory pt-20">
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-20 pt-16 lg:grid-cols-2 lg:px-12 lg:pt-24">
          <div>
            <p className="eyebrow">The Atelier, Live</p>
            <h1 className="font-display mt-4 text-[clamp(2.4rem,5vw,4rem)] font-medium leading-tight text-nero">
              Trunk Shows &amp; Events
            </h1>
            <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-taupe">
              A few times a year, our gowns leave the boutique: runway shows, trunk shows
              and private evenings where you can see the new Italian collections live —
              and meet the hands that tailor them.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/#appointment"
                className="bg-nero px-8 py-4 text-[11px] uppercase tracking-[0.24em] text-ivory transition-colors hover:bg-champagne-dark"
              >
                Book a Private Showing
              </Link>
              <a
                href="https://www.instagram.com/mayller_bridal_italianstyle/"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-champagne px-8 py-4 text-[11px] uppercase tracking-[0.24em] text-nero transition-colors hover:bg-champagne/10"
              >
                Follow for Dates
              </a>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden bg-ivory-deep">
            <Image
              src="/images/hero-02-runway.webp"
              alt="Mayller Bridal runway show at the Folino Estate bridal event, Pennsylvania"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={78}
              priority
              className="object-cover object-top"
            />
          </div>
        </section>

        {/* Latest event recap */}
        <section className="bg-ivory-deep">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
            <p className="eyebrow text-center">Latest Event</p>
            <h2 className="font-display mt-4 text-center text-[clamp(1.8rem,3.5vw,2.75rem)] font-medium text-nero">
              Folino Bridal Show — 2026
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm font-light leading-relaxed text-taupe">
              Our Italian collections on the runway at Folino Estate: Michela Ferriero,
              Capri Sposa and Vela, worn live in front of hundreds of Pennsylvania brides.
            </p>
            <EventsGallery />
          </div>
        </section>

        {/* CTA */}
        <section className="bg-nero py-20 text-center">
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.75rem)] font-medium text-ivory">
            Can&apos;t wait for the next show?
          </h2>
          <p className="mx-auto mt-4 max-w-md px-6 text-sm font-light text-ivory/70">
            The boutique is a private runway every day. Book your appointment and see the
            collection one-on-one.
          </p>
          <Link
            href="/#appointment"
            className="mt-8 inline-block bg-ivory px-9 py-4 text-[11px] uppercase tracking-[0.24em] text-nero transition-colors hover:bg-champagne"
          >
            Book Your Appointment
          </Link>
        </section>
      </main>
      <SiteFooter />
      <MobileActionBar />
    </>
  )
}
