'use client'

import Image from 'next/image'
import { Spotlight } from "@/components/ui/spotlight"
import { Card } from "@/components/ui/card"

export function SplineSceneBasic() {
  return (
    <Card className="w-full h-screen min-h-[600px] bg-black relative overflow-hidden rounded-none border-0">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

      <div className="flex h-full">
        {/* Left — editorial text */}
        <div className="flex-1 px-6 py-12 sm:p-12 md:p-20 relative z-10 flex flex-col justify-center">
          <p className="text-white/40 uppercase tracking-[0.3em] text-[10px] sm:text-xs mb-4 sm:mb-6">
            New 2027 Collection
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-white leading-tight mb-2 sm:mb-3">
            MAYLLER
          </h1>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 leading-tight mb-4 sm:mb-6">
            PRIVÉE
          </h2>
          <p className="text-white/50 uppercase tracking-[0.2em] text-xs sm:text-sm mb-3">
            LŪCENTIA
          </p>
          <p className="text-white/40 text-sm mb-8 sm:mb-10 max-w-xs leading-relaxed">
            An ode to light. Designer bridal gowns crafted with the highest quality fabrics, designed to capture your refined taste.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <a
              href="#appointment"
              className="px-8 py-4 sm:py-3 bg-white text-black text-xs font-semibold tracking-widest uppercase hover:bg-white/90 transition-colors text-center min-h-[44px] flex items-center justify-center"
            >
              Book Now
            </a>
            <a
              href="#collections"
              className="px-8 py-4 sm:py-3 border border-white/30 text-white text-xs font-semibold tracking-widest uppercase hover:border-white/60 transition-colors text-center min-h-[44px] flex items-center justify-center"
            >
              Discover
            </a>
          </div>
        </div>

        {/* Right — bridal model photo (desktop/tablet) */}
        <div className="flex-1 relative hidden md:block">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <Image
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85"
            alt="MAYLLER bridal model in wedding gown"
            fill
            priority
            sizes="(max-width: 768px) 0px, 50vw"
            className="object-cover object-top"
          />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />
        </div>
      </div>

      {/* Mobile — full-bleed background image with overlay */}
      <div className="absolute inset-0 md:hidden -z-10">
        <Image
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=750&q=75"
          alt="MAYLLER bridal model"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>
    </Card>
  )
}
