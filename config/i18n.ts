import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

/**
 * Single source of truth for supported languages. Add a locale here (and
 * a matching messages/<locale>.json file) to add a language to the site.
 */
export const routing = defineRouting({
  locales: ["pt", "en", "fr"],
  defaultLocale: "pt",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const localeLabels: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  fr: "Français",
};

// Locale-aware wrappers around Next.js navigation primitives. Use these
// instead of next/link and next/navigation anywhere a URL needs to keep
// its /pt, /en or /fr prefix.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
