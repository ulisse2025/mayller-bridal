'use client'

import { useEffect } from 'react'
import { captureAttribution } from '@/lib/attribution'

/** Remember campaign parameters for this browser session. Renders nothing. */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution()
  }, [])
  return null
}
