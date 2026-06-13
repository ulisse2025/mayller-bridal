import Image from 'next/image'
import Link from 'next/link'
import { BookingCalendar } from '@/components/ui/booking-calendar'

/* ------------------------------------------------------------------ */
/* Brand bar — the Mayller promise                                     */
/* ------------------------------------------------------------------ */

const BRANDS = ['Designed by Mayller', 'Crafted in Italy', 'Tailored in Pennsylvania']

export function BrandBar() {
  return (
    <section aria-label="The Mayller promise" className="border-b border-line bg-ivory">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-6 py-12 sm:flex-row lg:py-14">
        {BRANDS.map((brand) => (
          <span
            key={brand}
            className="font-display text-xl tracking-[0.18em] text-taupe uppercase"
          >
            {brand}
          </span>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Why brides choose Mayller                                           */
/* ------------------------------------------------------------------ */

const PILLARS = [
  {
    title: 'Italian Style',
    text: 'Authentic couture heritage, from Italy to Pennsylvania.',
  },
  {
    title: 'Personalized Service',
    text: 'Private, one-on-one appointments. One bride at a time.',
  },
  {
    title: 'Expert Alterations',
    text: 'Master tailors in-house. Every gown fitted to perfection.',
  },
  {
    title: 'Our Own Collection',
    text: 'Every gown is a Mayller original — designed by us and crafted in Italy. You won’t find it anywhere else.',
  },
  {
    title: 'Luxury Experience',
    text: 'An intimate boutique designed around your moment.',
  },
]

export function WhyMayller() {
  return (
    <section className="bg-ivory-deep">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12 lg:py-32">
        <p className="eyebrow text-center">The Mayller Difference</p>
        <h2 className="font-display mt-4 text-center text-[clamp(2rem,4vw,3.25rem)] font-medium text-nero">
          Why Brides Choose Mayller
        </h2>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((p, i) => (
            <div key={p.title} className="border border-line bg-white px-6 py-10 text-center">
              <span className="font-display text-lg text-champagne-dark">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="font-display mt-3 text-xl font-semibold text-nero">{p.title}</h3>
              <p className="mt-3 text-sm font-light leading-relaxed text-taupe">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Gallery preview — Vogue-style editorial grid                        */
/* ------------------------------------------------------------------ */

const GALLERY = [
  { src: '/images/gallery-06.webp', alt: 'A-line lace wedding dress by Mayller Bridal, Pennsylvania', big: true },
  { src: '/images/gallery-02.webp', alt: 'Strapless mermaid wedding dress, Italian design by Mayller' },
  { src: '/images/gallery-04.webp', alt: 'Romantic ballgown wedding dress with long train' },
  { src: '/images/gallery-08.webp', alt: 'Off-the-shoulder wedding dress at Pennsylvania bridal show' },
  { src: '/images/gallery-11.webp', alt: 'Princess ballgown wedding dress, Mayller Bridal collection' },
]

export function GalleryPreview() {
  return (
    <section className="bg-ivory">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12 lg:py-32">
        <p className="eyebrow">The Collection</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-display max-w-xl text-[clamp(2rem,4vw,3.25rem)] font-medium leading-tight text-nero">
            Gowns with an Italian soul
          </h2>
          <Link
            href="/collection"
            className="border-b border-champagne pb-1 text-[11px] uppercase tracking-[0.24em] text-nero transition-colors hover:text-champagne-dark"
          >
            View the Collection →
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-2 lg:gap-6">
          {GALLERY.map((img, i) => (
            <Link
              key={img.src}
              href="/collection"
              className={`group relative block overflow-hidden bg-ivory-deep ${
                img.big ? 'col-span-2 row-span-2 aspect-[3/4] md:aspect-auto' : 'aspect-[3/4]'
              }`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes={img.big ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                quality={75}
                loading={i === 0 ? undefined : 'lazy'}
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

/**
 * SOSTITUIRE i placeholder con recensioni Google reali esportate dal
 * pannello Google Business Profile (le recensioni non sono leggibili
 * pubblicamente via web). Mantenere nome + iniziale e testo ESATTO.
 */
const REVIEWS = [
  {
    quote:
      'She picked out a dress that she thought would look nice on me and from the moment I put it on, I fell in love. Her attention to detail is amazing and my dress was perfectly made. I would highly recommend her to any bride.',
    name: 'Rosa S.',
    source: 'Google',
  },
  {
    quote:
      'Mayller listened to every request, made custom changes to my dress with such care, and made sure it fit like a dream. You can truly feel the quality of the materials, all directly from Italy.',
    name: 'Dominique D.',
    source: 'Google',
  },
  {
    quote: 'Good prices and really fast.',
    name: 'Neighbor in Wyomissing',
    source: 'Nextdoor',
  },
]

export function Reviews() {
  return (
    <section className="bg-ivory-deep">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12 lg:py-32">
        <p className="eyebrow text-center">Real Brides</p>
        <h2 className="font-display mt-4 text-center text-[clamp(2rem,4vw,3.25rem)] font-medium text-nero">
          Loved by our brides
        </h2>
        <div className="snap-row mt-14 pb-4 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible">
          {REVIEWS.map((r, i) => (
            <figure
              key={`review-${i}`}
              className="w-[85vw] max-w-sm border border-line bg-white px-8 py-10 text-center md:w-auto md:max-w-none"
            >
              <div className="text-lg tracking-[0.3em] text-champagne" aria-label="5 out of 5 stars">
                ★★★★★
              </div>
              <blockquote className="font-display mt-5 text-xl italic leading-relaxed text-nero">
                “{r.quote}”
              </blockquote>
              <figcaption className="mt-5 text-[10px] uppercase tracking-[0.22em] text-taupe">
                {r.name} · {r.source}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-10 text-center">
          <a
            href="https://www.google.com/maps/search/?api=1&query=Mayller+Bridal+Italian+Style+Sinking+Spring+PA"
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-champagne pb-1 text-[11px] uppercase tracking-[0.24em] text-nero hover:text-champagne-dark"
          >
            Read all reviews on Google →
          </a>
        </p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Press band                                                          */
/* ------------------------------------------------------------------ */

export function PressBand() {
  return (
    <section className="border-y border-line bg-ivory">
      <div className="mx-auto max-w-4xl px-6 py-14 text-center">
        <p className="eyebrow">As seen in</p>
        <p className="font-display mt-3 text-2xl font-medium text-nero">
          Berks County Living — Wedding Issue
        </p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Booking section — wraps the EXISTING BookingCalendar (untouched)    */
/* ------------------------------------------------------------------ */

export function BookingSection() {
  return (
    <section id="appointment" className="bg-nero">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12 lg:py-32">
        <div className="border border-champagne/30 px-4 py-12 sm:px-8 lg:px-16">
          <p className="eyebrow text-center text-champagne">Book Your Bridal Appointment</p>
          <h2 className="font-display mt-4 text-center text-[clamp(2rem,4vw,3.25rem)] font-medium text-ivory">
            Your gown is waiting for you
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-center text-sm font-light leading-relaxed text-ivory/70">
            Private consultation in our Sinking Spring boutique · Monday – Saturday ·
            Booking takes less than 30 seconds.
          </p>
          <div className="mt-12">
            <BookingCalendar />
          </div>
        </div>
      </div>
    </section>
  )
}
