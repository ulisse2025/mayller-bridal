'use client'

import dynamic from 'next/dynamic'
import { AnimatedNavFramer } from '@/components/ui/navigation-menu'
import { SplineSceneBasic } from '@/components/ui/splite'
import ScrollAdventure from '@/components/ui/animated-scroll'
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline'
import { BookingCalendar } from '@/components/ui/booking-calendar'
import { Footer } from '@/components/ui/modem-animated-footer'
import { Calendar, Sparkles, Wand2, Scissors, Video, MapPin } from 'lucide-react'

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
    date: 'Worldwide',
    content: 'Visit one of our 3,000+ authorised boutiques worldwide. A personal Wedding Stylist will guide you through our collections.',
    category: 'Service',
    icon: Calendar,
    relatedIds: [4, 6],
    status: 'completed' as const,
    energy: 98,
  },
  {
    id: 2,
    title: 'The Atelier',
    date: 'Barcelona',
    content: 'Craftsmanship and design intertwine in our Barcelona workshop. A unique creative haven where dreams become exquisite pieces of art.',
    category: 'Brand',
    icon: Sparkles,
    relatedIds: [3, 5],
    status: 'completed' as const,
    energy: 95,
  },
  {
    id: 3,
    title: 'Style Quiz',
    date: '2 minutes',
    content: 'Not sure which silhouette is yours? Discover your bridal style in just 2 minutes with our personalised quiz.',
    category: 'Digital',
    icon: Wand2,
    relatedIds: [1, 4],
    status: 'completed' as const,
    energy: 85,
  },
  {
    id: 4,
    title: 'Custom Dress',
    date: 'Made for you',
    content: 'Personalise your wedding dress with our customisation service. Fabrics, embellishments, silhouettes — made exactly as you envision.',
    category: 'Service',
    icon: Scissors,
    relatedIds: [2, 3],
    status: 'in-progress' as const,
    energy: 90,
  },
  {
    id: 5,
    title: 'Virtual Trunk Show',
    date: 'Online',
    content: 'Experience our latest collections from the comfort of your home. Browse and schedule live virtual appointments with our stylists.',
    category: 'Digital',
    icon: Video,
    relatedIds: [1, 6],
    status: 'in-progress' as const,
    energy: 75,
  },
  {
    id: 6,
    title: 'Find a Boutique',
    date: '3,000+ stores',
    content: 'MAYLLER boutiques and authorised retailers across more than 100 countries. Find your nearest store for a full bridal experience.',
    category: 'Retail',
    icon: MapPin,
    relatedIds: [1, 2],
    status: 'completed' as const,
    energy: 88,
  },
]

const socialLinks = [
  {
    icon: <InstagramIcon className="w-6 h-6" />,
    href: 'https://www.instagram.com/MAYLLER/',
    label: 'Instagram',
  },
  {
    icon: <YoutubeIcon className="w-6 h-6" />,
    href: 'https://www.youtube.com/user/MAYLLERTV',
    label: 'YouTube',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.96a8.17 8.17 0 004.79 1.53V7.04a4.85 4.85 0 01-1.02-.35z"/>
      </svg>
    ),
    href: 'https://www.tiktok.com/@MAYLLERofficial/',
    label: 'TikTok',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12"/>
      </svg>
    ),
    href: 'https://www.pinterest.com/MAYLLER/boards/',
    label: 'Pinterest',
  },
]

const footerNavLinks = [
  { label: 'Wedding Dresses', href: '#collections' },
  { label: 'Occasion Dresses', href: '#collections' },
  { label: 'Accessories', href: '#collections' },
  { label: 'Book Appointment', href: '#appointment' },
  { label: 'Find a Boutique', href: '#' },
  { label: 'About Us', href: '#' },
  { label: 'Careers', href: '#' },
  { label: 'Contact', href: '#' },
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
          Discover your bridal style in just 2 minutes —{' '}
          <a href="#" className="underline underline-offset-2 hover:text-white/70 transition-colors">
            Take the quiz
          </a>
        </p>
      </div>

      {/* 4. Product collections — split-screen scroll */}
      <ScrollAdventure />

      {/* 5. Services / features — radial orbital */}
      <section id="services" className="relative">
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-12 z-10 pointer-events-none">
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase">Our Services</p>
          <h2 className="text-white/80 text-2xl font-light tracking-widest mt-2">Everything you need</h2>
        </div>
        <RadialOrbitalTimeline timelineData={MAYLLERFeatures} />
      </section>

      {/* 6. Atelier — WebGL shader backdrop */}
      <section id="atelier" className="relative">
        <ShieldShader />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 text-center">
          <p className="text-white/40 uppercase tracking-[0.4em] text-xs mb-6">Barcelona · Since 1964</p>
          <h2 className="text-5xl md:text-7xl font-light text-white tracking-widest mb-6">
            THE ATELIER
          </h2>
          <p className="text-white/60 text-lg max-w-2xl leading-relaxed mb-10">
            The Art of Craftsmanship — A journey inside the creative heart of MAYLLER.
            Our Barcelona workshop, where every thread tells a story.
          </p>
          <a
            href="#"
            className="text-xs text-white/70 tracking-[0.3em] uppercase border border-white/30 px-8 py-3 hover:border-white hover:text-white transition-all duration-300"
          >
            Discover More
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
        brandDescription="Luxury Wedding Dresses & Formal Guest Wear. Crafted in Barcelona since 1964. Over 3,000 authorised boutiques worldwide."
        socialLinks={socialLinks}
        navLinks={footerNavLinks}
      />
    </main>
  )
}
