import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SiteHeader, MobileActionBar } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'

export const metadata: Metadata = {
  title: 'Bridal Alterations in Pennsylvania',
  description:
    'Master bridal alterations by Italian-trained tailors in Sinking Spring, PA. Hemming, bustles, resizing, restyling — for wedding dresses, tuxedos and formal wear.',
  alternates: { canonical: 'https://mayllerbridal.com/alteration' },
}

const SERVICES = [
  { title: 'Hemming & Length', text: 'Perfect length over your wedding shoes, preserving lace edges and horsehair trim.' },
  { title: 'Bustles', text: 'French, American or ballroom bustle — your train, ready for the dance floor.' },
  { title: 'Resizing', text: 'Taking in or letting out bodices, cups, boning and zippers with couture technique.' },
  { title: 'Restyling', text: 'Neckline changes, sleeves added or removed, modernizing an heirloom gown.' },
  { title: 'Tuxedos & Suits', text: 'Groom and groomsmen tailoring: jackets, trousers, shirts — fitted in house.' },
  { title: 'Custom Embroidery', text: 'Initials, dates and personal details embroidered by hand or DTF.' },
]

const STEPS = [
  { n: '1', title: 'Fitting', text: 'A 30-minute appointment with our tailor. We pin, measure and plan every adjustment.' },
  { n: '2', title: 'Tailoring', text: 'Your garment is worked by hand in our atelier with Italian technique.' },
  { n: '3', title: 'Final try-on', text: 'You come back, you try it on, it fits like couture. That simple.' },
]

export default function AlterationPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-ivory pt-20">
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-20 pt-16 lg:grid-cols-2 lg:px-12 lg:pt-24">
          <div>
            <p className="eyebrow">Master Tailoring</p>
            <h1 className="font-display mt-4 text-[clamp(2.4rem,5vw,4rem)] font-medium leading-tight text-nero">
              Bridal Alterations &amp; Tailoring
            </h1>
            <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-taupe">
              The most beautiful gown in the world still has to fit <em>you</em>. Our
              Italian-trained tailors alter wedding dresses, tuxedos and formal wear in
              house — hemming, bustles, resizing and full restyling, sewn by hand.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/#appointment"
                className="bg-nero px-8 py-4 text-[11px] uppercase tracking-[0.24em] text-ivory transition-colors hover:bg-champagne-dark"
              >
                Book an Alteration
              </Link>
              <a
                href="tel:+14846386555"
                className="border border-champagne px-8 py-4 text-[11px] uppercase tracking-[0.24em] text-nero transition-colors hover:bg-champagne/10"
              >
                Call Now
              </a>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden bg-ivory-deep">
            <Image
              src="/images/detail-01-atelier.webp"
              alt="Italian tailor working by hand on a wedding dress at Mayller Bridal atelier, Pennsylvania"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={78}
              priority
              className="object-cover"
            />
          </div>
        </section>

        {/* Services */}
        <section className="bg-ivory-deep">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
            <h2 className="font-display text-center text-[clamp(1.8rem,3.5vw,2.75rem)] font-medium text-nero">
              What we do
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((s) => (
                <div key={s.title} className="border border-line bg-white px-7 py-9">
                  <h3 className="font-display text-xl font-semibold text-nero">{s.title}</h3>
                  <p className="mt-3 text-sm font-light leading-relaxed text-taupe">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
          <h2 className="font-display text-center text-[clamp(1.8rem,3.5vw,2.75rem)] font-medium text-nero">
            How it works
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="border border-line bg-white px-7 py-10 text-center">
                <span className="font-display text-4xl text-champagne">{s.n}</span>
                <h3 className="font-display mt-4 text-xl font-semibold text-nero">{s.title}</h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-taupe">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Atelier photos */}
        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-12">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
            <div className="relative aspect-square overflow-hidden bg-ivory-deep">
              <Image
                src="/images/detail-02-atelier.webp"
                alt="Hand-sewing details on an Italian wedding gown"
                fill sizes="(max-width: 768px) 50vw, 33vw" quality={75} loading="lazy" className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden bg-ivory-deep">
              <Image
                src="/images/tuxedo-02-fitting.webp"
                alt="Tuxedo fitting and measurement at Mayller Bridal, Sinking Spring PA"
                fill sizes="(max-width: 768px) 50vw, 33vw" quality={75} loading="lazy" className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden bg-ivory-deep max-md:hidden">
              <Image
                src="/images/tuxedo-01-runway.webp"
                alt="Groom tuxedo tailored by Mayller Bridal on the runway"
                fill sizes="33vw" quality={75} loading="lazy" className="object-cover object-top"
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-nero py-20 text-center">
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.75rem)] font-medium text-ivory">
            Bring us your gown
          </h2>
          <p className="mx-auto mt-4 max-w-md px-6 text-sm font-light text-ivory/70">
            Bought your dress elsewhere? Welcome anyway. Alteration appointments take 30
            minutes and book in seconds.
          </p>
          <Link
            href="/#appointment"
            className="mt-8 inline-block bg-ivory px-9 py-4 text-[11px] uppercase tracking-[0.24em] text-nero transition-colors hover:bg-champagne"
          >
            Book an Alteration
          </Link>
        </section>
      </main>
      <SiteFooter />
      <MobileActionBar />
    </>
  )
}
