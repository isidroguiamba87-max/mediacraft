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
    /** Office details shown on /contacto (client design 2026-11-11). */
    office: "Rua dos Pescadores nº 21, Triunfo, Maputo - Moçambique",
    phones: ["+258 84 000 431", "87 000 234"],
    /** Google Maps search for the /contacto map embed. Google can't geocode
     * the exact street address, so this is the neighbourhood for now —
     * replace with "lat,lng" (e.g. "-25.9300,32.6200") once the client sends
     * the office's pin to drop a marker exactly on it. */
    mapQuery: "Bairro Triunfo, Maputo, Moçambique",
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
  // One-page site (2026-11-11): every link is an anchor on the home page.
  // `section` = the element id the scroll-spy watches / the link targets.
  { key: "home", href: "/", section: "inicio" },
  { key: "about", href: "/#sobre-nos", section: "sobre-nos" },
  { key: "gallery", href: "/#galeria", section: "galeria" },
  // Novidades is its own page (not a home section) — back in the nav at
  // the user's request (2026-11-12). `section: null` = no scroll-spy.
  { key: "news", href: "/novidades", section: null },
  { key: "contact", href: "/#contacto", section: "contacto" },
] as const;

/** Which nav link lights up while each home-page section is in view
 * (sections not listed — e.g. #impacto, #eventos — keep "home" lit). */
export const sectionNav: Record<string, (typeof mainNav)[number]["key"]> = {
  inicio: "home",
  impacto: "home",
  "o-que-fazemos": "home",
  eventos: "home",
  "sobre-nos": "about",
  equipa: "about",
  galeria: "gallery",
  contacto: "contact",
};

/** Footer "Navegação" column — per its own design (Início · Eventos ·
 * Sobre Nós · Contacto), also anchors on the one page. */
export const footerNav = [
  { key: "home", href: "/" },
  { key: "events", href: "/#eventos" },
  { key: "about", href: "/#sobre-nos" },
  { key: "contact", href: "/#contacto" },
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
