// ============================================================
// MAYLLER PHONE — service worker registration (client)
// pronovias/src/components/admin/phone/RegisterSW.tsx
//
// Registers /sw-phone.js with a scope restricted to /admin/phone
// so the worker can NEVER interfere with the live marketing site.
// Failure is non-fatal (the dashboard still works online).
// ============================================================

'use client';

import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw-phone.js', { scope: '/admin/phone' })
      .catch(() => {
        /* offline cache simply won't be available; not fatal */
      });
  }, []);

  return null;
}
