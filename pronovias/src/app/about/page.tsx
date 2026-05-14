import Link from 'next/link'
import { AnimatedNavFramer } from '@/components/ui/navigation-menu'

const VALUES = [
  { title: 'Craftsmanship', desc: 'Each gown is a testament to decades of artisanal tradition. Every seam, every bead, every layer of tulle is placed with intention and mastery.' },
  { title: 'Elegance', desc: 'Refined simplicity meets breathtaking detail. We believe true elegance lies in the perfect balance between restraint and splendor.' },
  { title: 'Innovation', desc: 'While rooted in tradition, we push boundaries. New fabrics, silhouettes and techniques keep Mayller at the vanguard of bridal fashion.' },
]

const STATS = [
  { value: '60+', label: 'Years of Excellence' },
  { value: '3,000+', label: 'Authorised Boutiques' },
  { value: '100+', label: 'Countries Worldwide' },
  { value: '200+', label: 'Designs per Collection' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatedNavFramer />

      {/* Hero */}
      <section className="h-screen relative flex items-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1600&q=90"
          alt="About Mayller" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="relative z-10 px-8 md:px-20 max-w-2xl">
          <p className="text-amber-300/50 text-xs tracking-[0.5em] uppercase mb-6">Our Story</p>
          <h1 className="text-[clamp(3rem,7vw,6rem)] font-light tracking-[0.1em] leading-[1.05] mb-8">
            SINCE<br /><span className="text-amber-300/80">1964</span>
          </h1>
          <p className="text-white/50 leading-relaxed text-base max-w-md">
            Born in Barcelona. Built on a singular belief: that every bride deserves a gown as unique and extraordinary as the moment she wears it.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-28 px-8 md:px-20 border-t border-white/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div>
            <p className="text-amber-300/50 text-xs tracking-[0.4em] uppercase mb-5">The Beginning</p>
            <h2 className="text-4xl font-light tracking-wide mb-8 leading-snug">A Vision Born<br />in Barcelona</h2>
            <p className="text-white/50 leading-relaxed mb-6">
              In 1964, a small atelier opened its doors in the heart of Barcelona. What began as a single workroom — where a master draper and two seamstresses crafted gowns for the women of the city — grew, over the following decades, into one of the world&apos;s most revered bridal houses.
            </p>
            <p className="text-white/40 leading-relaxed">
              Today, Mayller operates across more than 100 countries, with over 3,000 authorised boutiques carrying our collections. Yet the same founding principle endures: a gown must be a work of art, and every bride its muse.
            </p>
          </div>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80"
              alt="Atelier" className="w-full aspect-[3/4] object-cover" />
            <div className="absolute -bottom-6 -left-6 bg-amber-400 px-8 py-6">
              <p className="text-black text-xs font-bold tracking-widest uppercase">Barcelona Atelier</p>
              <p className="text-black/60 text-xs tracking-wider">Est. 1964</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 px-8 md:px-20 border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-[clamp(2.5rem,5vw,4rem)] font-light text-amber-300 leading-none mb-3">{s.value}</p>
              <p className="text-white/30 text-xs tracking-[0.25em] uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-28 px-8 md:px-20 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-300/50 text-xs tracking-[0.4em] uppercase mb-3">What We Stand For</p>
            <h2 className="text-4xl font-light tracking-[0.15em]">Our Values</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {VALUES.map((v, i) => (
              <div key={v.title} className="border-t border-white/10 pt-8">
                <p className="text-amber-300/40 text-xs tracking-widest mb-4">0{i + 1}</p>
                <h3 className="text-xl font-light tracking-[0.2em] uppercase mb-4">{v.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 md:px-20 border-t border-white/10 text-center">
        <p className="text-amber-300/50 text-xs tracking-[0.4em] uppercase mb-4">Experience Mayller</p>
        <h2 className="text-4xl font-light tracking-widest mb-8">Begin Your Journey</h2>
        <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed mb-10">
          Visit one of our authorised boutiques worldwide or book a private appointment at our Barcelona Atelier.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/#appointment" className="px-10 py-4 bg-white text-black text-xs font-bold tracking-widest uppercase hover:bg-amber-300 transition-colors">
            Book Appointment
          </Link>
          <Link href="/contact" className="px-10 py-4 border border-white/20 text-white text-xs font-semibold tracking-widest uppercase hover:border-white/60 transition-colors">
            Contact Us
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 px-8 md:px-20 flex justify-between items-center">
        <Link href="/" className="text-xs font-light tracking-[0.3em] text-white/30 hover:text-white transition-colors uppercase">Mayller</Link>
        <p className="text-white/15 text-xs tracking-widest">Barcelona · Since 1964</p>
        <Link href="/contact" className="text-xs tracking-widest uppercase text-amber-300/50 hover:text-amber-300 transition-colors">Contact →</Link>
      </footer>
    </div>
  )
}
