'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

type Photo = { id: string; url: string; caption?: string }

/** Foto reali del Folino Show già in /public/images (fallback). */
const DEFAULTS: Photo[] = [
  { id: 'e1', url: '/images/gallery-01.webp', caption: 'Opening look' },
  { id: 'e2', url: '/images/gallery-04.webp', caption: 'Romantic ballgown' },
  { id: 'e3', url: '/images/gallery-08.webp', caption: 'Off-the-shoulder lace' },
  { id: 'e4', url: '/images/tuxedo-01-runway.webp', caption: 'The groom, tailored' },
  { id: 'e5', url: '/images/gallery-11.webp', caption: 'Princess moment' },
  { id: 'e6', url: '/images/gallery-12.webp', caption: 'Finale' },
]

/**
 * Galleria eventi: mostra le foto caricate dal pannello /admin
 * (sezione "events") se presenti, altrimenti le foto reali di default.
 */
export function EventsGallery() {
  const [photos, setPhotos] = useState<Photo[]>(DEFAULTS)

  useEffect(() => {
    fetch('/api/admin/photos?section=events')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.photos?.length) setPhotos(d.photos)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
      {photos.map((p) => (
        <figure key={p.id} className="group">
          <div className="relative aspect-[3/4] overflow-hidden bg-white">
            <Image
              src={p.url}
              alt={p.caption ? `${p.caption} — Mayller Bridal event` : 'Mayller Bridal event photo'}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              quality={75}
              loading="lazy"
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          {p.caption && (
            <figcaption className="pt-3 text-[10px] uppercase tracking-[0.22em] text-taupe">
              {p.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}
