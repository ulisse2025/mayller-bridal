import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SiteHeader, MobileActionBar } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'

export const metadata: Metadata = {
  title: 'Our Italian Story',
  description:
    'The story of Mayller Bridal Italian Style: gowns designed by Mayller and crafted in Italy, three decades of tailoring, and a boutique in Sinking Spring, Pennsylvania built around one bride at a time.',
  alternates: { canonical: 'https://mayllerbridal.com/about' },
}

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-ivory pt-20">
        {/* Story hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-2 lg:px-12 lg:pt-24">
          <div>
            <p className="eyebrow">Our Story</p>
            <h1 className="font-display mt-4 text-[clamp(2.4rem,5vw,4rem)] font-medium leading-tight text-nero">
              From Italy,
              <br />
              with love and thread
            </h1>
            <div className="mt-7 max-w-xl space-y-5 text-base font-light leading-relaxed text-taupe">
              <p>
                Mayller was born in Italy — in the workshops where dressmaking is not a
                job but an inheritance, passed from hand to hand like a family recipe.
                We grew up surrounded by lace, chalk lines and the quiet pride of garments
                made to measure.
              </p>
              <p>
                When we brought that tradition to Pennsylvania, we made one promise: never
                to become a warehouse of dresses. Mayller is a boutique in the true Italian
                sense — intimate, personal, unhurried. One bride, one appointment, one
                perfect gown.
              </p>
              <p>
                Today, in our Sinking Spring atelier, we dress brides from Reading,
                Lancaster, Allentown, Philadelphia and beyond — with gowns of our own
                design, crafted in Italy and then tailored to perfection here, by hand.
              </p>
            </div>
          </div>
          <div className="relative aspect-[3/4] overflow-hidden bg-ivory-deep">
            <Image
              src="/images/hero-03-lace-robe.webp"
              alt="Italian bridal lace at Mayller Bridal Italian Style boutique"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={78}
              priority
              className="object-cover"
            />
          </div>
        </section>

        {/* Numbers */}
        <section className="bg-ivory-deep">
          <div className="mx-auto grid max-w-5xl gap-6 px-6 py-16 sm:grid-cols-3 lg:px-12">
            {[
              { n: '30+', label: 'years of Italian tailoring' },
              { n: '100%', label: 'alterations made in house' },
              { n: '1', label: 'bride at a time, always' },
            ].map((s) => (
              <div key={s.label} className="border border-line bg-white px-6 py-10 text-center">
                <p className="font-display text-5xl font-medium text-champagne-dark">{s.n}</p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-taupe">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quote */}
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <blockquote className="font-display text-[clamp(1.6rem,3.5vw,2.5rem)] italic leading-snug text-nero">
            “Every gown deserves Italian hands.”
          </blockquote>
          <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-champagne-dark">
            The Mayller Family
          </p>
        </section>

        {/* CTA */}
        <section className="bg-nero py-20 text-center">
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.75rem)] font-medium text-ivory">
            Come meet us
          </h2>
          <p className="mx-auto mt-4 max-w-md px-6 text-sm font-light text-ivory/70">
            The espresso is real, the welcome is warm, and the gowns speak for themselves.
          </p>
          <Link
            href="/#appointment"
            className="mt-8 inline-block bg-ivory px-9 py-4 text-[11px] uppercase tracking-[0.24em] text-nero transition-colors hover:bg-champagne"
          >
            Book Your Visit
          </Link>
        </section>
      </main>
      <SiteFooter />
      <MobileActionBar />
    </>
  )
}
