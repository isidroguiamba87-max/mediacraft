import type { Metadata } from "next";
import { routing, type Locale } from "@/config/i18n";
import { siteConfig } from "@/config/site.config";

/** `og:locale` wants underscore region tags, not next-intl's bare `pt`/`en`/`fr`. */
const OG_LOCALE: Record<Locale, string> = {
  pt: "pt_MZ",
  en: "en_US",
  fr: "fr_FR",
};

/**
 * Canonical + complete hreflang (incl. `x-default`) for one route across
 * every locale — the single source of truth every page's generateMetadata
 * calls into, instead of each page hand-rolling `alternates` (which is how
 * the site ended up with every page advertising the homepage as its own
 * translation: app/[locale]/layout.tsx used to set one `alternates` for
 * every page under it, always pointing at `/${locale}` with no path).
 *
 * `path` excludes the locale prefix and has no trailing slash — `""` for
 * the home page, `"/eventos"`, `"/eventos/123"`, etc.
 */
export function buildAlternates(locale: Locale, path: string): Metadata["alternates"] {
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${siteConfig.url}/${l}${path}`]),
  );
  return {
    canonical: `${siteConfig.url}/${locale}${path}`,
    languages: { ...languages, "x-default": `${siteConfig.url}/${routing.defaultLocale}${path}` },
  };
}

/**
 * Full per-page metadata in one call: canonical + hreflang (buildAlternates)
 * plus Open Graph + Twitter Card, all built from the same title/description
 * every page already computes for its plain `<title>`/meta description.
 * This is what every page's `generateMetadata` should return (spread in any
 * page-specific extras, like an event's dynamic cover image, afterwards).
 */
export function buildMetadata({
  locale,
  path,
  title,
  description,
  image,
}: {
  locale: Locale;
  path: string;
  title?: string;
  description?: string;
  /** Absolute URL — defaults to the per-locale dynamic OG image (see
   * app/[locale]/opengraph-image.tsx) when omitted. */
  image?: string;
}): Metadata {
  const url = `${siteConfig.url}/${locale}${path}`;
  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      type: "website",
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/**
 * `noindex` everywhere outside the real production domain — Vercel preview
 * deployments and any branch deploy get a `Content-Security-Policy`-grade
 * default of "don't index this", so they never compete with
 * mediacraft.co.mz in search results (A3/B1: keep preview URLs out of the
 * index). `VERCEL_ENV` is only ever `"production"` on the domain this
 * actually ships to; anything else (including plain `next build` without
 * Vercel) stays safely un-indexed.
 */
export function defaultRobots(): Metadata["robots"] {
  if (process.env.VERCEL_ENV === "production") return undefined;
  return { index: false, follow: false };
}
