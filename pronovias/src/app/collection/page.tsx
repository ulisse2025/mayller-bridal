import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader, MobileActionBar } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { CollectionGallery } from '@/components/collection/collection-gallery'

export const metadata: Metadata = {
  title: 'Wedding Dresses in Pennsylvania',
  description:
    'Wedding dresses designed in Italy and handcrafted by Mayller in our Pennsylvania atelier. Try them on at Mayller Bridal, the Italian bridal boutique near Reading, PA. Book your appointment.',
  alternates: { canonical: 'https://mayllerbridal.com/collection' },
}

export default function CollectionPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-ivory pt-20">
        <section className="mx-auto max-w-7xl px-6 pb-4 pt-16 lg:px-12 lg:pt-24">
          <p className="eyebrow">2026 Collection</p>
          <h1 className="font-display mt-4 text-[clamp(2.4rem,5vw,4rem)] font-medium leading-tight text-nero">
            Wedding Dresses
          </h1>
          <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-taupe">
            Every gown is a Mayller original — designed in Italy and handcrafted by our
            master tailors in our Pennsylvania atelier. Each one is presented in a
            private appointment, one bride at a time.
          </p>
        </section>

        <CollectionGallery />

        <section className="bg-nero py-20 text-center">
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.75rem)] font-medium text-ivory">
            Found the one?
          </h2>
          <p className="mx-auto mt-4 max-w-md px-6 text-sm font-light text-ivory/70">
            Book a private appointment and try it on in our boutique. No price tags online —
            every gown deserves to be seen in person.
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
