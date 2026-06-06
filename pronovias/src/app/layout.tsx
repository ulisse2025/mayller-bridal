import type { Metadata, Viewport } from "next"
import { Cormorant_Garamond, Jost } from "next/font/google"
import "./globals.css"
import WhatsAppButton from "@/components/WhatsAppButton"

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
})

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://mayllerbridal.com"),
  title: {
    default: "MAYLLER — Italian Bridal Boutique in Pennsylvania",
    template: "%s · MAYLLER",
  },
  description:
    "Luxury Italian wedding dresses, master alterations and custom bridal design in Sinking Spring, Pennsylvania. Michela Ferriero, Capri Sposa, Vela. Book your private appointment.",
  applicationName: "MAYLLER",
  appleWebApp: {
    capable: true,
    title: "MAYLLER",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: true,
    address: false,
    email: false,
  },
  openGraph: {
    title: "MAYLLER — Italian Bridal Boutique in Pennsylvania",
    description:
      "Luxury Italian bridal experience in Sinking Spring, PA. Designer wedding dresses, master alterations and one-on-one fittings — by appointment.",
    url: "https://mayllerbridal.com",
    siteName: "MAYLLER Bridal Italian Style",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mayller Bridal Italian Style — luxury wedding dresses in Pennsylvania",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MAYLLER — Italian Bridal Boutique in Pennsylvania",
    description:
      "Luxury Italian wedding dresses & master alterations in Sinking Spring, PA. By appointment.",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#faf8f4",
}

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  "@id": "https://mayllerbridal.com/#boutique",
  name: "Mayller Bridal Italian Style",
  alternateName: "MAYLLER",
  description:
    "Luxury Italian bridal boutique in Sinking Spring, Pennsylvania. Designer wedding dresses, tuxedos, master alterations, custom design and accessories.",
  url: "https://mayllerbridal.com",
  telephone: "+14846386555",
  image: "https://mayllerbridal.com/og-image.jpg",
  priceRange: "$$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "4054 W Penn Ave",
    addressLocality: "Sinking Spring",
    addressRegion: "PA",
    postalCode: "19608",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 40.3267,
    longitude: -76.0496,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "18:00",
    },
  ],
  sameAs: [
    "https://www.instagram.com/mayllerbridal",
    "https://www.facebook.com/mayllerbridal",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        {children}
        <WhatsAppButton />
      </body>
    </html>
  )
}
