import Image from 'next/image'
import Link from 'next/link'

const SLIDES = [
  {
    src: '/images/hero-01-bride-doors.webp',
    alt: 'Bride in a lace mermaid wedding dress at Mayller Bridal boutique, Sinking Spring PA',
  },
  {
    src: '/images/hero-02-runway.webp',
    alt: 'Italian designer wedding dress on the runway at a Pennsylvania bridal show',
  },
  {
    src: '/images/hero-03-lace-robe.webp',
    alt: 'Luxury Italian bridal lace at Mayller Bridal Italian Style',
  },
]

/**
 * Fullscreen emotional hero — Ken Burns crossfade in pure CSS (zero JS).
 * First slide is `priority` for LCP.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[88svh] items-center justify-center overflow-hidden bg-nero text-center">
      {SLIDES.map((slide, i) => (
        <div key={slide.src} className="kb-slide">
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="100vw"
            quality={75}
            priority={i === 0}
            className="object-cover object-top"
          />
        </div>
      ))}

      {/* Scrim for text legibility */}
      <div className="absolute inset-0 bg-linear-to-b from-nero/45 via-nero/30 to-nero/60" aria-hidden />

      <div className="relative z-10 max-w-3xl px-6 py-32">
        <p className="eyebrow text-champagne">Sinking Spring · Pennsylvania</p>
        <h1 className="font-display mt-5 text-[clamp(2.6rem,7vw,5.5rem)] font-medium leading-[1.05] text-ivory">
          Luxury Italian
          <br />
          Bridal Experience
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base font-light leading-relaxed text-ivory/85">
          Discover the elegance of authentic Italian bridal fashion in Pennsylvania.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/#appointment"
            className="w-full bg-ivory px-9 py-4 text-[11px] uppercase tracking-[0.24em] text-nero transition-colors hover:bg-champagne hover:text-nero sm:w-auto"
          >
            Book Your Appointment
          </Link>
          <a
            href="tel:+14846386555"
            className="w-full border border-ivory/60 px-9 py-4 text-[11px] uppercase tracking-[0.24em] text-ivory transition-colors hover:border-champagne hover:text-champagne sm:w-auto"
          >
            Call Now
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-ivory/60">
        Scroll
      </div>
    </section>
  )
}
