'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

const pages = [
  {
    leftBgImage: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=900&auto=format&fit=crop&q=80',
    rightBgImage: null,
    leftContent: null,
    rightContent: {
      heading: 'WEDDING DRESSES',
      description: 'Glow on your special day. 200+ designs across every silhouette.',
      cta: 'Discover the Collection',
    },
  },
  {
    leftBgImage: null,
    rightBgImage: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=900&auto=format&fit=crop&q=80',
    leftContent: {
      heading: 'OCCASION DRESSES',
      description: 'Celebrating in absolute style. From black-tie to summer soirée.',
      cta: 'Shop Occasion',
    },
    rightContent: null,
  },
  {
    leftBgImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80',
    rightBgImage: null,
    leftContent: null,
    rightContent: {
      heading: 'WEDDING GUEST',
      description: 'Bridesmaids, mother of the bride, sisters of the groom. Dressed for every role.',
      cta: 'View Guest Dresses',
    },
  },
  {
    leftBgImage: null,
    rightBgImage: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=900&auto=format&fit=crop&q=80',
    leftContent: {
      heading: 'ACCESSORIES',
      description: 'Veils, headpieces, capes, and overskirts. Complete your bridal look.',
      cta: 'Shop Accessories',
    },
    rightContent: null,
  },
  {
    leftBgImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80',
    rightBgImage: null,
    leftContent: null,
    rightContent: {
      heading: 'THE ATELIER',
      description: 'Craftsmanship and design intertwine in our Barcelona workshop.',
      cta: 'Discover the Atelier',
    },
  },
]

export default function ScrollAdventure() {
  const [currentPage, setCurrentPage] = useState(1)
  const numOfPages = pages.length
  const animTime = 1000
  const scrolling = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInViewRef = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewRef.current = entry.intersectionRatio >= 0.75
      },
      { threshold: 0.75 }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const navigateUp = useCallback(() => {
    if (currentPage > 1) setCurrentPage((p) => p - 1)
  }, [currentPage])

  const navigateDown = useCallback(() => {
    if (currentPage < numOfPages) setCurrentPage((p) => p + 1)
  }, [currentPage, numOfPages])

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!isInViewRef.current) return
      if (scrolling.current) return
      scrolling.current = true
      e.deltaY > 0 ? navigateDown() : navigateUp()
      setTimeout(() => (scrolling.current = false), animTime)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInViewRef.current) return
      if (scrolling.current) return
      if (e.key === 'ArrowUp') {
        scrolling.current = true
        navigateUp()
        setTimeout(() => (scrolling.current = false), animTime)
      } else if (e.key === 'ArrowDown') {
        scrolling.current = true
        navigateDown()
        setTimeout(() => (scrolling.current = false), animTime)
      }
    }

    window.addEventListener('wheel', handleWheel)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentPage, navigateUp, navigateDown])

  return (
    <div ref={containerRef} className="relative overflow-hidden h-screen bg-black select-none" id="collections">
      {pages.map((page, i) => {
        const idx = i + 1
        const isActive = currentPage === idx
        const upOff = 'translateY(-100%)'
        const downOff = 'translateY(100%)'
        const leftTrans = isActive ? 'translateY(0)' : downOff
        const rightTrans = isActive ? 'translateY(0)' : upOff

        return (
          <div key={idx} className="absolute inset-0">
            {/* Left Half */}
            <div
              className="absolute top-0 left-0 w-1/2 h-full transition-transform duration-[1000ms]"
              style={{ transform: leftTrans }}
            >
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: page.leftBgImage ? `url(${page.leftBgImage})` : undefined,
                  backgroundColor: page.leftBgImage ? undefined : '#0a0a0a',
                }}
              >
                <div className="flex flex-col items-center justify-center h-full text-white p-12 bg-black/30">
                  {page.leftContent && (
                    <>
                      <p className="text-xs tracking-[0.3em] text-white/50 mb-4 uppercase">MAYLLER</p>
                      <h2 className="text-3xl font-light tracking-widest mb-4 text-center">
                        {page.leftContent.heading}
                      </h2>
                      <p className="text-sm text-center text-white/70 max-w-xs leading-relaxed mb-8">
                        {page.leftContent.description}
                      </p>
                      <a
                        href="#"
                        className="text-xs tracking-widest uppercase border-b border-white/50 pb-1 hover:border-white transition-colors"
                      >
                        {page.leftContent.cta}
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Half */}
            <div
              className="absolute top-0 left-1/2 w-1/2 h-full transition-transform duration-[1000ms]"
              style={{ transform: rightTrans }}
            >
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: page.rightBgImage ? `url(${page.rightBgImage})` : undefined,
                  backgroundColor: page.rightBgImage ? undefined : '#111',
                }}
              >
                <div className="flex flex-col items-center justify-center h-full text-white p-12 bg-black/30">
                  {page.rightContent && (
                    <>
                      <p className="text-xs tracking-[0.3em] text-white/50 mb-4 uppercase">MAYLLER</p>
                      <h2 className="text-3xl font-light tracking-widest mb-4 text-center">
                        {page.rightContent.heading}
                      </h2>
                      <p className="text-sm text-center text-white/70 max-w-xs leading-relaxed mb-8">
                        {page.rightContent.description}
                      </p>
                      <a
                        href="#"
                        className="text-xs tracking-widest uppercase border-b border-white/50 pb-1 hover:border-white transition-colors"
                      >
                        {page.rightContent.cta}
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Navigation dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              currentPage === i + 1 ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Prev/Next arrows */}
      <button
        onClick={navigateUp}
        disabled={currentPage === 1}
        className="absolute left-1/2 -translate-x-1/2 top-6 z-10 text-white/40 hover:text-white disabled:opacity-0 transition-all text-xs tracking-widest uppercase"
      >
        ↑
      </button>
      <button
        onClick={navigateDown}
        disabled={currentPage === numOfPages}
        className="absolute left-1/2 -translate-x-1/2 bottom-20 z-10 text-white/40 hover:text-white disabled:opacity-0 transition-all text-xs tracking-widest uppercase"
      >
        ↓
      </button>
    </div>
  )
}
