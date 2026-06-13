'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Filter = 'all' | 'a-line' | 'mermaid' | 'ballgown' | 'short'

type Gown = {
  id: string
  url: string
  name: string
  designer: string
  silhouette: Exclude<Filter, 'all'>
}

/**
 * Catalogo curato — foto reali in /public/images.
 * Tutti gli abiti sono produzione Mayller (etichetta "Mayller Atelier").
 * Per aggiungere/correggere un abito basta modificare questa lista
 * (nome e silhouette sono editoriali).
 * Le foto caricate dal pannello /admin (sezione "collection") vengono
 * AGGIUNTE in coda automaticamente.
 */
const GOWNS: Gown[] = [
  { id: 'g01', url: '/images/gallery-01.webp', name: 'Aurora', designer: 'Mayller Atelier', silhouette: 'a-line' },
  { id: 'g02', url: '/images/gallery-02.webp', name: 'Serena', designer: 'Mayller Atelier', silhouette: 'mermaid' },
  { id: 'g03', url: '/images/gallery-03.webp', name: 'Lucia', designer: 'Mayller Atelier', silhouette: 'a-line' },
  { id: 'g04', url: '/images/gallery-04.webp', name: 'Bianca', designer: 'Mayller Atelier', silhouette: 'ballgown' },
  { id: 'g05', url: '/images/gallery-05.webp', name: 'Chiara', designer: 'Mayller Atelier', silhouette: 'mermaid' },
  { id: 'g06', url: '/images/gallery-06.webp', name: 'Vittoria', designer: 'Mayller Atelier', silhouette: 'a-line' },
  { id: 'g07', url: '/images/gallery-07.webp', name: 'Elena', designer: 'Mayller Atelier', silhouette: 'a-line' },
  { id: 'g08', url: '/images/gallery-08.webp', name: 'Sofia', designer: 'Mayller Atelier', silhouette: 'mermaid' },
  { id: 'g09', url: '/images/gallery-09.webp', name: 'Giulia', designer: 'Mayller Atelier', silhouette: 'ballgown' },
  { id: 'g10', url: '/images/gallery-10.webp', name: 'Alba', designer: 'Mayller Atelier', silhouette: 'short' },
  { id: 'g11', url: '/images/gallery-11.webp', name: 'Regina', designer: 'Mayller Atelier', silhouette: 'ballgown' },
  { id: 'g12', url: '/images/gallery-12.webp', name: 'Stella', designer: 'Mayller Atelier', silhouette: 'a-line' },
]

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All Gowns' },
  { value: 'a-line', label: 'A-Line' },
  { value: 'mermaid', label: 'Mermaid' },
  { value: 'ballgown', label: 'Ballgown' },
  { value: 'short', label: 'Short & Civil' },
]

export function CollectionGallery() {
  const [silhouette, setSilhouette] = useState<Filter>('all')
  const [extra, setExtra] = useState<Gown[]>([])
  const [lightbox, setLightbox] = useState<Gown | null>(null)

  /* Foto aggiunte dal pannello /admin (facoltative) */
  useEffect(() => {
    fetch('/api/admin/photos?section=collection')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.photos?.length) {
          setExtra(
            d.photos.map((p: { id: string; url: string; caption?: string }) => ({
              id: `admin-${p.id}`,
              url: p.url,
              name: p.caption || 'New Arrival',
              designer: 'Mayller Atelier',
              silhouette: 'a-line' as const,
            })),
          )
        }
      })
      .catch(() => {})
  }, [])

  const gowns = useMemo(() => {
    return [...GOWNS, ...extra].filter(
      (g) => silhouette === 'all' || g.silhouette === silhouette,
    )
  }, [silhouette, extra])

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-12">
      {/* Filters */}
      <div className="mt-10 flex flex-wrap items-center gap-3" role="group" aria-label="Filter gowns">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setSilhouette(f.value)}
            className={`px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] transition-colors ${
              silhouette === f.value
                ? 'bg-nero text-ivory'
                : 'border border-line bg-white text-taupe hover:border-champagne'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
        {gowns.map((g) => (
          <article key={g.id} className="group">
            <button
              type="button"
              onClick={() => setLightbox(g)}
              className="relative block aspect-[3/4] w-full overflow-hidden bg-ivory-deep"
              aria-label={`View ${g.name} by ${g.designer}`}
            >
              <Image
                src={g.url}
                alt={`${g.name} — ${g.silhouette} wedding dress designed and made by Mayller, Pennsylvania`}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                quality={75}
                loading="lazy"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
            </button>
            <div className="flex items-baseline justify-between pt-4">
              <div>
                <h3 className="font-display text-xl italic text-nero">{g.name}</h3>
                <p className="mt-1 text-[9px] uppercase tracking-[0.24em] text-taupe">{g.designer}</p>
              </div>
              <Link
                href={`/#appointment`}
                className="text-[9px] uppercase tracking-[0.2em] text-champagne-dark underline-offset-4 hover:underline"
              >
                Book to try
              </Link>
            </div>
          </article>
        ))}
      </div>

      {gowns.length === 0 && (
        <p className="mt-16 text-center text-sm text-taupe">No gowns match this filter — try another combination.</p>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-nero/90 p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${lightbox.name} by ${lightbox.designer}`}
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-h-[85vh] w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={lightbox.url}
                alt={`${lightbox.name} wedding dress by ${lightbox.designer}`}
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                quality={85}
                className="object-contain"
              />
            </div>
            <div className="mt-4 flex items-center justify-between bg-ivory px-6 py-4">
              <div>
                <p className="font-display text-2xl italic text-nero">{lightbox.name}</p>
                <p className="text-[10px] uppercase tracking-[0.24em] text-taupe">{lightbox.designer}</p>
              </div>
              <Link
                href="/#appointment"
                className="bg-nero px-6 py-3 text-[10px] uppercase tracking-[0.22em] text-ivory hover:bg-champagne-dark"
              >
                Book to try this gown
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close"
              className="absolute -top-12 right-0 text-3xl text-ivory"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
