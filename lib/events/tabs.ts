/** Shared between EventShell ("use client") and the event page (a Server
 * Component) — plain data exported from a "use client" file crosses the
 * server/client boundary as an opaque reference, not the real array
 * (confirmed live 2026-10-08: `EVENT_TAB_KEYS.includes` wasn't a function
 * when called from page.tsx), so this lives in its own plain module
 * instead. */
export const EVENT_TAB_KEYS = [
  "details",
  "news",
  "live",
  "program",
  "speakers",
  "gallery",
  "organizer",
  "qa",
  "tickets",
] as const;

export type EventTabKey = (typeof EVENT_TAB_KEYS)[number];

/** Slide order for the fixed-frame shell (2026-10-09 spec: "Detalhes,
 * Bilhetes, Perguntas, Organizador, Galeria, Programa, Ao Vivo..."). The
 * reference's own list left out "Novidades" entirely (same gap as an
 * earlier reference this project worked from) — kept here, appended last,
 * since it's a real working section and dropping it silently would be a
 * regression, not a deliberate removal like "Biblioteca" was. */
export const EVENT_TAB_DISPLAY_ORDER: EventTabKey[] = [
  "details",
  "tickets",
  "qa",
  "organizer",
  "gallery",
  "program",
  "speakers",
  "live",
  "news",
];
