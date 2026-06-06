import type { MetadataRoute } from "next"

const BASE = "https://mayllerbridal.com"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    { url: `${BASE}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/collection`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/alteration`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/about`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/events`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ]
}
