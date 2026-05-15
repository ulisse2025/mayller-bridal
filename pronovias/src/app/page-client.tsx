'use client'

import dynamic from 'next/dynamic'
import { AnimatedNavFramer } from '@/components/ui/navigation-menu'
import { SplineSceneBasic } from '@/components/ui/splite'
import ScrollAdventure from '@/components/ui/animated-scroll'
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline'
import { BookingCalendar } from '@/components/ui/booking-calendar'
import { Footer } from '@/components/ui/modem-animated-footer'
import { Calendar, Sparkles, Wand2, Scissors, Phone, MapPin } from 'lucide-react'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  )
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

const ShieldShader = dynamic(
  () => import('@/components/ui/shield-shader').then((m) => ({ default: m.Component })),
  { ssr: false, loading: () => <div className="w-full h-screen bg-black" /> }
)

const MAYLLERFeatures = [
  {
    id: 1,
    title: 'Book Appointment',
    date: 'Sinking Spring, PA',
    content: 'Schedule a private consultation in our Sinking Spring boutique. Bridal fittings, custom design, and master alterations — all by appointment.',
    category: 'Service',
    icon: Calendar,
    relatedIds: [4, 6],
    status: 'completed' as const,
    energy: 98,
  },
  {
    id: 2,
    title: 'The Atelier',
    date: '4054 W Penn Ave',
    content: 'Where Italian tradition meets Pennsylvania charm. Our small boutique in Sinking Spring is a creative haven where every dress is hand-finished.',
    category: 'Brand',
    icon: Sparkles,
    relatedIds: [3, 5],
    status: 'completed' as const,
    energy: 95,
  },
  {
    id: 3,
    title: 'Custom Design',
    date: 'Made for you',
    content: 'Bring us a sketch, a Pinterest board, or just an idea. We design and build your wedding dress from scratch — fabric, silhouette, and details made for you.',
    category: 'Service',
    icon: Wand2,
    relatedIds: [1, 4],
    status: 'completed' as const,
    energy: 90,
  },
  {
    id: 4,
    title: 'Master Alterations',
    date: '30 minute fittings',
    content: 'Expert tailoring for bridal, formal wear, and tuxedos. Every fitting includes one-on-one time with our master seamstress.',
    category: 'Service',
    icon: Scissors,
    relatedIds: [2, 3],
    status: 'completed' as const,
    energy: 92,
  },
  {
    id: 5,
    title: 'Italian Tradition',
    date: 'Old World craft',
    content: 'Our designer trained in Italy, where bridal couture is a vocation passed down through generations. That craft now lives in Sinking Spring.',
    category: 'Brand',
    icon: Sparkles,
    relatedIds: [1, 2],
    status: 'completed' as const,
    energy: 88,
  },
  {
    id: 6,
    title: 'Visit Us',
    date: '(484) 638-6555',
    content: 'Stop by 4054 W Penn Ave during boutique hours, or call us. We&apos;re a small team — when you reach out, you reach us directly.',
    category: 'Contact',
    icon: MapPin,
    relatedIds: [1, 2],
    status: 'completed' as const,
    energy: 85,
  },
]

const socialLinks = [
  {
    icon: <InstagramIcon className="w-6 h-6" />,
    href: 'https://www.instagram.com/mayller_bridal_italianstyle/',
    label: 'Instagram',
  },
  {
    icon: <YoutubeIcon className="w-6 h-6" />,
    href: 'https://www.youtube.com/channel/UCrmwEBnV2avhQkGDu_NoAsw',
    label: 'YouTube',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.96a8.17 8.17 0 004.79 1.53V7.04a4.85 4.85 0 01-1.02-.35z"/>
      </svg>
    ),
    href: 'https://www.tiktok.com/@maylleritalianstyle',
    label: 'TikTok',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 4.99 3.657 9.128 8.438 9.879v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.892h-2.33v6.987C18.343 21.128 22 16.991 22 12c0-6.627-5.373-12-12-12"/>
      </svg>
    ),
    href: 'https://www.facebook.com/p/Mayller-Bridal-Italian-Style-100091294175941/',
    label: 'Facebook',
  },
]

const footerNavLinks = [
  { label: 'Bridal Collection', href: '/collection' },
  { label: 'Custom Design', href: '/collection' },
  { label: 'Alterations', href: '/alteration' },
  { label: 'Events', href: '/events' },
  { label: 'Book Appointment', href: '#appointment' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Visit the Boutique', href: 'https://www.google.com/maps/search/?api=1&query=4054+W+Penn+Ave+Sinking+Spring+PA' },
]

export default function MAYLLERPageClient() {
  return (
    <main className="bg-white">
      {/* 1. Navigation — sticky floating pill */}
      <AnimatedNavFramer />

      {/* 2. Hero — full-screen 3D interactive */}
      <section id="hero">
        <SplineSceneBasic />
      </section>

      {/* 3. Announcement bar */}
      <div className="bg-black text-white text-center py-3 px-4">
        <p className="text-xs tracking-[0.3em] uppercase">
          Now welcoming brides for the 2026 wedding season —{' '}
          <a href="#appointment" className="underline underline-offset-2 hover:text-white/70 transition-colors">
            Book your appointment
          </a>
        </p>
      </div>

      {/* 4. Product collections — split-screen scroll */}
      <ScrollAdventure />

      {/* 5. Services / features — radial orbital */}
      <section id="services" className="relative">
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-12 z-10 pointer-events-none">
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase">Our Atelier</p>
          <h2 className="text-white/80 text-2xl font-light tracking-widest mt-2">A boutique built around you</h2>
        </div>
        <RadialOrbitalTimeline timelineData={MAYLLERFeatures} />
      </section>

      {/* 6. Atelier — WebGL shader backdrop */}
      <section id="atelier" className="relative">
        <ShieldShader />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 text-center">
          <p className="text-white/40 uppercase tracking-[0.4em] text-xs mb-6">Italian Heart · Pennsylvania Home</p>
          <h2 className="text-5xl md:text-7xl font-light text-white tracking-widest mb-6">
            THE ATELIER
          </h2>
          <p className="text-white/60 text-lg max-w-2xl leading-relaxed mb-10">
            Old World tailoring brought to Sinking Spring. Our small atelier is where Italian
            craftsmanship meets the personal attention every bride deserves.
          </p>
          
            href="/about"
            className="text-xs text-white/70 tracking-[0.3em] uppercase border border-white/30 px-8 py-3 hover:border-white hover:text-white transition-all duration-300"
          >
            Discover Our Story
          </a>
        </div>
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      </section>

      {/* 7. Booking Calendar */}
      <section id="appointment" className="bg-black border-t border-white/10">
        <BookingCalendar />
      </section>

      {/* 9. Footer */}
      <Footer
        brandName="MAYLLER"
        brandDescription="Italian-trained bridal couture in Sinking Spring, PA. Custom wedding dresses, master alterations, and one-on-one fittings — all by appointment."
        socialLinks={socialLinks}
        navLinks={footerNavLinks}
      />
    </main>
  )
}
