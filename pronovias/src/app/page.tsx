import type { Metadata } from 'next'
import { SiteHeader, MobileActionBar } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { Hero } from '@/components/home/hero'
import {
  BrandBar,
  WhyMayller,
  GalleryPreview,
  Reviews,
  PressBand,
  BookingSection,
} from '@/components/home/home-sections'

export const metadata: Metadata = {
  title: 'MAYLLER — Italian Bridal Boutique in Pennsylvania',
  description:
    'Luxury Italian wedding dresses, master alterations and custom bridal design in Sinking Spring, PA. Designers Michela Ferriero, Capri Sposa, Vela. Book your private appointment online.',
  alternates: { canonical: 'https://mayllerbridal.com' },
}

export default function HomePage() {
  return (
    <>
      <SiteHeader variant="overlay" />
      <main>
        <Hero />
        <BrandBar />
        <WhyMayller />
        <GalleryPreview />
        <Reviews />
        <PressBand />
        <BookingSection />
      </main>
      <SiteFooter />
      <MobileActionBar />
    </>
  )
}
