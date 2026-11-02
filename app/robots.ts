import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Defense in depth alongside the `robots: { index: false }` metadata
      // already set on these routes (app/admin/layout.tsx) — keeps
      // crawlers from spending budget on them in the first place.
      disallow: ["/admin", "/api", "/responder"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
