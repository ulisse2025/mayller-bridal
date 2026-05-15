import Link from 'next/link'
import { AnimatedNavFramer } from '@/components/ui/navigation-menu'

const VALUES = [
  {
    title: 'Italian Craftsmanship',
    desc: 'Decades of training in Italy shape every gown we create. We believe a wedding dress should be made the old way: by hand, with patience, and with reverence for every stitch.',
  },
  {
    title: 'Personal Attention',
    desc: 'You are not a number on a calendar. Every bride who walks through our door is welcomed personally, listened to carefully, and dressed with care from first sketch to final fitting.',
  },
  {
    title: 'Made for You',
    desc: 'Off-the-rack will never feel like couture. We measure, drape, and fit each gown to your body — so when you say yes to the dress, the dress was made to say yes to you.',
  },
]

const STATS = [
  { value: 'Italy', label: 'Where We Trained' },
  { value: '1:1', label: 'Personal Consultations' },
  { value: 'Custom', label: 'Made-to-Measure' },
  { value: 'PA', label: 'Made in Sinking Spring' },
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
            ITALIAN HEART<br /><span className="text-amber-300/80">PA HOME</span>
          </h1>
          <p className="text-white/50 leading-relaxed text-base max-w-md">
            Mayller Bridal Italian Style brings Old World tailoring to the heart of Pennsylvania.
            A small atelier where every bride is treated like family, and every dress is made the way it should be — by hand.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-28 px-8 md:px-20 border-t border-white/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div>
            <p className="text-amber-300/50 text-xs tracking-[0.4em] uppercase mb-5">The Beginning</p>
            <h2 className="text-4xl font-light tracking-wide mb-8 leading-snug">From Italy<br />to Sinking Spring</h2>
            <p className="text-white/50 leading-relaxed mb-6">
              Our founder learned the art of bridal couture in Italy, where wedding dressmaking
              isn&apos;t a job — it&apos;s a vocation passed down through generations. After years of training
              with master tailors in the Italian fashion tradition, she brought that craft to Pennsylvania,
              opening Mayller Bridal Italian Style on West Penn Avenue.
            </p>
            <p className="text-white/40 leading-relaxed">
              Today our boutique is small by design. We don&apos;t want to be everywhere — we want to be
              everything to the brides who choose us. One bride at a time, one fitting at a time,
              one perfectly placed seam at a time.
            </p>
          </div>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80"
              alt="The Mayller Atelier" className="w-full aspect-[3/4] object-cover" />
            <div className="absolute -bottom-6 -left-6 bg-amber-400 px-8 py-6">
              <p className="text-black text-xs font-bold tracking-widest uppercase">Mayller Atelier</p>
              <p className="text-black/60 text-xs tracking-wider">Sinking Spring, PA</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 px-8 md:px-20 border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-[clamp(2rem,4vw,3rem)] font-light text-amber-300 leading-none mb-3">{s.value}</p>
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

      {/* What we do */}
      <section className="py-28 px-8 md:px-20 border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-300/50 text-xs tracking-[0.4em] uppercase mb-3">Our Atelier</p>
            <h2 className="text-4xl font-light tracking-[0.15em]">What We Do</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-10 text-white/50 leading-relaxed">
            <div>
              <h3 className="text-amber-300/70 text-sm tracking-[0.2em] uppercase mb-4">Bridal &amp; Custom Design</h3>
              <p>
                A curated collection of wedding gowns crafted in Italy and the United States, plus
                made-to-measure designs created from the ground up to your vision. Whether you arrive
                with a Pinterest board or a single image in your mind, we draft a dress that&apos;s entirely yours.
              </p>
            </div>
            <div>
              <h3 className="text-amber-300/70 text-sm tracking-[0.2em] uppercase mb-4">Master Alterations</h3>
              <p>
                Bringing a dress you love? We perform expert alterations on bridal gowns, formal wear,
                and tuxedos with the same precision we use for our own designs. Every fitting includes
                a personal consultation with our master seamstress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 md:px-20 border-t border-white/10 text-center">
        <p className="text-amber-300/50 text-xs tracking-[0.4em] uppercase mb-4">Visit the Atelier</p>
        <h2 className="text-4xl font-light tracking-widest mb-8">Begin Your Journey</h2>
        <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed mb-10">
          Book a private appointment in our Sinking Spring boutique. Tell us about your wedding,
          your story, and let us create something extraordinary, just for you.
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
        <p className="text-white/15 text-xs tracking-widest">Sinking Spring, PA · Italian Craftsmanship</p>
        <Link href="/contact" className="text-xs tracking-widest uppercase text-amber-300/50 hover:text-amber-300 transition-colors">Contact →</Link>
      </footer>
    </div>
  )
}
