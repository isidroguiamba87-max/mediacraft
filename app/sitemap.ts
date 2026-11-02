import type { MetadataRoute } from "next";
import { routing } from "@/config/i18n";
import { siteConfig } from "@/config/site.config";

const staticPaths = ["", "/eventos", "/sobre", "/contacto"];

export default function sitemap(): MetadataRoute.Sitemap {
  return staticPaths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${siteConfig.url}/${locale}${path}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${siteConfig.url}/${l}${path}`]),
        ),
      },
    })),
  );
}
