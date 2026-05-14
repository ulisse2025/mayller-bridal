import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "MAYLLER — Luxury Wedding Dresses & Formal Guest Wear",
  description:
    "Discover our designer bridal gowns & event guest dresses, crafted with the highest quality of fabrics and specially designed to capture your refined taste.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>{children}</body>
    </html>
  )
}
