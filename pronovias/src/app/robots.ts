import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/sms-reply", "/api/"],
      },
    ],
    sitemap: "https://mayllerbridal.com/sitemap.xml",
  }
}
