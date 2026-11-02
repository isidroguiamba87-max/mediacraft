/**
 * Brand, contact and navigation configuration. Change the values here to
 * update the footer/contact info or the main nav — no need to touch any
 * component.
 */
export const siteConfig = {
  name: "MediaCraft",
  legalName: "MediaCraft Mozambique",
  url: "https://mediacraft.co.mz",
  contact: {
    email: "info@mediacraft.co.mz",
    address: "Av. da Marginal, Maputo, Moçambique",
    social: {
      linkedin: "https://www.linkedin.com/company/mediacraftmz",
      instagram: "https://www.instagram.com/mediacraftmz",
      facebook: "https://www.facebook.com/MediaCraftMz",
    },
  },
  developer: {
    name: "SmartBP Tech",
    url: "https://www.smartbp.tech/",
  },
} as const;

/** Main navigation, in order. `key` maps to messages/*.json -> nav.<key>. */
export const mainNav = [
  { key: "home", href: "/" },
  { key: "events", href: "/eventos" },
  { key: "news", href: "/novidades" },
  { key: "about", href: "/sobre" },
  { key: "contact", href: "/contacto" },
] as const;

/**
 * Pulse (the events platform) connection settings. Public event listing/
 * detail goes through `GET /embed/:domain/events...` (confirmed live
 * 2026-09-18, after sitting 404 for days — it's deployed to staging,
 * NOT yet confirmed on production), scoped server-side by `domain` — no
 * client-side organizer filtering needed.
 */
export const pulseConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1",
  /** Domain MediaCraft's events are scoped under via the embed routes. */
  domain: process.env.NEXT_PUBLIC_MEDIACRAFT_DOMAIN ?? "mediacraft.co.mz",
} as const;
