import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import WhatsAppButton from "@/components/WhatsAppButton"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://mayllerbridal.com"),
  title: {
    default: "MAYLLER — Luxury Wedding Dresses & Formal Guest Wear",
    template: "%s · MAYLLER",
  },
  description:
    "Discover our designer bridal gowns & event guest dresses, crafted with the highest quality of fabrics and specially designed to capture your refined taste.",
  applicationName: "MAYLLER",
  appleWebApp: {
    capable: true,
    title: "MAYLLER",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: true,
    address: false,
    email: false,
  },
  openGraph: {
    title: "MAYLLER — Luxury Wedding Dresses & Formal Guest Wear",
    description:
      "Italian-trained bridal couture in Sinking Spring, PA. Custom wedding dresses, master alterations, and one-on-one fittings — by appointment.",
    url: "https://mayllerbridal.com",
    siteName: "MAYLLER",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MAYLLER — Luxury Wedding Dresses",
    description:
      "Italian-trained bridal couture in Sinking Spring, PA. Custom wedding dresses & alterations by appointment.",
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <head>
        {/* Preconnect to Unsplash for faster hero image load on mobile */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="antialiased">
        {children}
        <WhatsAppButton />
      </body>
    </html>
  )
}
