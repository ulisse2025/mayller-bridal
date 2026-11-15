/**
 * Channel attribution for online bookings.
 *
 * UTMs and the landing referrer are kept in sessionStorage and later attached
 * to the booking conversion event and the website calendar description.
 * Name, email, phone, and notes are never read here.
 */

export const ATTRIBUTION_STORAGE_KEY = 'mayller-attribution'

export type Attribution = {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  referrer: string
}

export type BookingEventParams = {
  service_type: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  referrer: string
}

const EMPTY_ATTRIBUTION: Attribution = {
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  referrer: '',
}

const TAG_MAX = 80
const REFERRER_MAX = 200

const SERVICE_TYPES: Record<string, string> = {
  alteration: 'alteration',
  wedding: 'wedding_dress',
  tuxedo_fitting: 'tuxedo',
}

type AnalyticsWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  fbq?: (...args: unknown[]) => void
}

export function ga4MeasurementId(): string | null {
  const id = (process.env.NEXT_PUBLIC_GA4_ID || '').trim()
  return /^G-[A-Za-z0-9]+$/.test(id) ? id : null
}

export function metaPixelId(): string | null {
  const id = (process.env.NEXT_PUBLIC_META_PIXEL_ID || '').trim()
  return /^\d{5,20}$/.test(id) ? id : null
}

/** Keep a campaign label on one line and inside the calendar "a/b/c" slot. */
export function sanitizeTag(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[^A-Za-z0-9 ._+~-]/g, '')
    .trim()
    .slice(0, TAG_MAX)
}

/** Origin + path only, so query strings cannot carry emails or tokens. */
export function sanitizeReferrer(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    const path = url.pathname === '/' ? '' : url.pathname
    return `${url.origin}${path}`.slice(0, REFERRER_MAX)
  } catch {
    return ''
  }
}

function sameSite(a: string, b: string): boolean {
  const left = a.toLowerCase().replace(/^www\./, '')
  const right = b.toLowerCase().replace(/^www\./, '')
  return left !== '' && left === right
}

export function externalReferrer(referrer: string, pageHost: string): string {
  const clean = sanitizeReferrer(referrer)
  if (!clean) return ''
  try {
    if (sameSite(new URL(clean).hostname, pageHost)) return ''
  } catch {
    return ''
  }
  return clean
}

export function attributionFromUnknown(input: unknown): Attribution {
  const obj = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  return {
    utm_source: sanitizeTag(obj.utm_source),
    utm_medium: sanitizeTag(obj.utm_medium),
    utm_campaign: sanitizeTag(obj.utm_campaign),
    referrer: sanitizeReferrer(obj.referrer),
  }
}

export function attributionFromLanding(input: {
  search: string
  referrer: string
  pageHost: string
  existing: Attribution | null
}): Attribution {
  const params = new URLSearchParams(input.search)
  const incoming: Attribution = {
    utm_source: sanitizeTag(params.get('utm_source')),
    utm_medium: sanitizeTag(params.get('utm_medium')),
    utm_campaign: sanitizeTag(params.get('utm_campaign')),
    referrer: externalReferrer(input.referrer, input.pageHost),
  }
  const existing = input.existing
  const hasUtm = Boolean(incoming.utm_source || incoming.utm_medium || incoming.utm_campaign)
  if (!existing) return incoming
  if (hasUtm) {
    return {
      utm_source: incoming.utm_source,
      utm_medium: incoming.utm_medium,
      utm_campaign: incoming.utm_campaign,
      referrer: incoming.referrer || existing.referrer,
    }
  }
  return {
    utm_source: existing.utm_source,
    utm_medium: existing.utm_medium,
    utm_campaign: existing.utm_campaign,
    referrer: existing.referrer || incoming.referrer,
  }
}

export function toServiceType(serviceId: string): string {
  return SERVICE_TYPES[serviceId] ?? 'unknown'
}

export function bookingEventParams(serviceId: string, attribution: Attribution): BookingEventParams {
  return {
    service_type: toServiceType(serviceId),
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    referrer: attribution.referrer,
  }
}

/** Extra calendar line for website bookings. Blank when the visit had no UTMs. */
export function formatChannelSourceLine(attribution: Attribution | null | undefined): string | null {
  if (!attribution) return null
  if (!attribution.utm_source && !attribution.utm_medium && !attribution.utm_campaign) return null
  const part = (value: string) => value || '-'
  return `Source: ${part(attribution.utm_source)}/${part(attribution.utm_medium)}/${part(attribution.utm_campaign)}`
}

export function formatReferrerLine(attribution: Attribution | null | undefined): string | null {
  if (!attribution?.referrer) return null
  return `Referrer: ${attribution.referrer}`
}

export function captureAttribution(): void {
  if (typeof window === 'undefined') return
  let existing: Attribution | null = null
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)
    if (raw) existing = attributionFromUnknown(JSON.parse(raw))
  } catch {
    existing = null
  }
  const next = attributionFromLanding({
    search: window.location.search,
    referrer: document.referrer,
    pageHost: window.location.hostname,
    existing,
  })
  try {
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage can be blocked. The booking still completes; channel may be blank.
  }
}

export function readAttribution(): Attribution {
  if (typeof window === 'undefined') return { ...EMPTY_ATTRIBUTION }
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)
    if (!raw) return { ...EMPTY_ATTRIBUTION }
    return attributionFromUnknown(JSON.parse(raw))
  } catch {
    return { ...EMPTY_ATTRIBUTION }
  }
}

function analyticsWindow(): AnalyticsWindow | null {
  if (typeof window === 'undefined') return null
  return window as AnalyticsWindow
}

function whenReady(ready: () => boolean, send: () => void): void {
  const attempt = (left: number) => {
    try {
      if (ready()) {
        send()
        return
      }
    } catch {
      return
    }
    if (left <= 0) return
    window.setTimeout(() => attempt(left - 1), 250)
  }
  attempt(20)
}

/**
 * Fire after /api/book returns success. No-ops when the matching public ID
 * is unset, and never includes customer details.
 */
export function trackBookingCompleted(serviceId: string): void {
  const w = analyticsWindow()
  if (!w) return
  const params = bookingEventParams(serviceId, readAttribution())
  const gaId = ga4MeasurementId()
  const pixelId = metaPixelId()

  if (gaId) {
    whenReady(
      () => typeof w.gtag === 'function',
      () => {
        w.gtag?.('event', 'booking_completed', params)
      },
    )
  }

  if (pixelId) {
    whenReady(
      () => typeof w.fbq === 'function',
      () => {
        w.fbq?.('track', 'Schedule', params)
      },
    )
  }
}
