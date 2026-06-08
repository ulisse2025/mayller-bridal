// ============================================================
// MAYLLER PHONE — route segment metadata (PWA + theming)
// pronovias/src/app/admin/phone/layout.tsx
//
// This metadata applies ONLY to /admin/phone (not the public
// site), so the scoped manifest + apple-web-app config don't
// affect mayllerbridal.com's identity.
// ============================================================

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Mayller Phone',
  manifest: '/manifest.phone.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Mayller Phone',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
  // Internal tool: keep it out of search engines.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function PhoneLayout({ children }: { children: React.ReactNode }) {
  return children;
}
