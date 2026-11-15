import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  attributionFromLanding,
  attributionFromUnknown,
  bookingEventParams,
  formatChannelSourceLine,
  formatReferrerLine,
  ga4MeasurementId,
  metaPixelId,
  sanitizeReferrer,
  sanitizeTag,
  toServiceType,
} from './attribution.ts'
import { phoneFromDescription } from './description-phone.ts'

describe('attribution', () => {
  it('keeps the first channel in the session until a new landing has UTMs', () => {
    const first = attributionFromLanding({
      search: '?utm_source=instagram&utm_medium=paid&utm_campaign=spring',
      referrer: 'https://instagram.com/mayller',
      pageHost: 'mayllerbridal.com',
      existing: null,
    })
    assert.equal(first.utm_source, 'instagram')
    assert.equal(first.utm_medium, 'paid')
    assert.equal(first.utm_campaign, 'spring')
    assert.equal(first.referrer, 'https://instagram.com/mayller')

    const internal = attributionFromLanding({
      search: '',
      referrer: 'https://mayllerbridal.com/collection',
      pageHost: 'www.mayllerbridal.com',
      existing: first,
    })
    assert.deepEqual(internal, first)

    const nextCampaign = attributionFromLanding({
      search: '?utm_source=google&utm_medium=cpc&utm_campaign=gowns',
      referrer: 'https://www.google.com/search?q=bridal',
      pageHost: 'mayllerbridal.com',
      existing: first,
    })
    assert.equal(nextCampaign.utm_source, 'google')
    assert.equal(nextCampaign.utm_medium, 'cpc')
    assert.equal(nextCampaign.utm_campaign, 'gowns')
    assert.equal(nextCampaign.referrer, 'https://www.google.com/search')
  })

  it('drops query strings, same-site referrers, and characters that could break the calendar line', () => {
    assert.equal(
      sanitizeReferrer('https://news.example.com/bridal?email=a@b.com#x'),
      'https://news.example.com/bridal',
    )
    assert.equal(sanitizeReferrer('javascript:alert(1)'), '')
    assert.equal(sanitizeTag('spring/sale\n<script>'), 'springsalescript')
    const parsed = attributionFromUnknown({
      utm_source: 'ig',
      utm_medium: 'paid',
      utm_campaign: 'a/b',
      referrer: 'https://example.com/path?token=secret',
      name: 'Emma',
      email: 'emma@email.com',
      phone: '4845550100',
      notes: 'secret',
    })
    assert.deepEqual(parsed, {
      utm_source: 'ig',
      utm_medium: 'paid',
      utm_campaign: 'ab',
      referrer: 'https://example.com/path',
    })
  })

  it('maps form services and sends only channel fields on the conversion', () => {
    assert.equal(toServiceType('wedding'), 'wedding_dress')
    assert.equal(toServiceType('alteration'), 'alteration')
    assert.equal(toServiceType('tuxedo_fitting'), 'tuxedo')
    assert.equal(toServiceType('other'), 'unknown')
    const params = bookingEventParams('wedding', {
      utm_source: 'instagram',
      utm_medium: 'paid',
      utm_campaign: 'spring',
      referrer: 'https://instagram.com/mayller',
    })
    assert.deepEqual(Object.keys(params).sort(), [
      'referrer',
      'service_type',
      'utm_campaign',
      'utm_medium',
      'utm_source',
    ])
    assert.equal(params.service_type, 'wedding_dress')
    assert.equal(
      formatChannelSourceLine({
        utm_source: 'instagram',
        utm_medium: '',
        utm_campaign: 'spring',
        referrer: '',
      }),
      'Source: instagram/-/spring',
    )
    assert.equal(formatChannelSourceLine({ utm_source: '', utm_medium: '', utm_campaign: '', referrer: '' }), null)
    assert.equal(
      formatReferrerLine({
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        referrer: 'https://instagram.com/mayller',
      }),
      'Referrer: https://instagram.com/mayller',
    )
  })
})

describe('measurement ids', () => {
  it('loads only well-formed public IDs', () => {
    const prevGa = process.env.NEXT_PUBLIC_GA4_ID
    const prevPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID
    process.env.NEXT_PUBLIC_GA4_ID = 'G-AB12'
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '1234567890'
    assert.equal(ga4MeasurementId(), 'G-AB12')
    assert.equal(metaPixelId(), '1234567890')
    process.env.NEXT_PUBLIC_GA4_ID = 'UA-12345'
    process.env.NEXT_PUBLIC_META_PIXEL_ID = 'not-a-pixel'
    assert.equal(ga4MeasurementId(), null)
    assert.equal(metaPixelId(), null)
    process.env.NEXT_PUBLIC_GA4_ID = ''
    process.env.NEXT_PUBLIC_META_PIXEL_ID = ''
    assert.equal(ga4MeasurementId(), null)
    assert.equal(metaPixelId(), null)
    if (prevGa === undefined) delete process.env.NEXT_PUBLIC_GA4_ID
    else process.env.NEXT_PUBLIC_GA4_ID = prevGa
    if (prevPixel === undefined) delete process.env.NEXT_PUBLIC_META_PIXEL_ID
    else process.env.NEXT_PUBLIC_META_PIXEL_ID = prevPixel
  })
})

describe('phoneFromDescription', () => {
  it('reads a real phone and ignores the Sofia channel label', () => {
    assert.equal(phoneFromDescription('Phone: (484) 760-0475'), '(484) 760-0475')
    assert.equal(phoneFromDescription('Mobile: +1 484-638-6555'), '+1 484-638-6555')
    assert.equal(phoneFromDescription('Source: phone (Sofia)'), '')
    assert.equal(
      phoneFromDescription('Phone: (484) 760-0475\nSource: phone (Sofia)'),
      '(484) 760-0475',
    )
  })
})
