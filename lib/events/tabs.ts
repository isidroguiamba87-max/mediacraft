/** Shared between EventShell ("use client") and the event page (a Server
 * Component) — plain data exported from a "use client" file crosses the
 * server/client boundary as an opaque reference, not the real array
 * (confirmed live 2026-10-08: `EVENT_TAB_KEYS.includes` wasn't a function
 * when called from page.tsx), so this lives in its own plain module
 * instead. */
export const EVENT_TAB_KEYS = [
  "details",
  "live",
  "program",
  "speakers",
  "gallery",
  "organizer",
  "tickets",
] as const;

export type EventTabKey = (typeof EVENT_TAB_KEYS)[number];

/** Slide order for the event page (2026-10-09 spec: "Detalhes, Bilhetes,
 * Perguntas, Organizador, Galeria, Programa, Ao Vivo..."). "Novidades" was
 * removed from the whole site on 2026-11-13 at the client's request. */
export const EVENT_TAB_DISPLAY_ORDER: EventTabKey[] = [
  "details",
  "tickets",
  "organizer",
  "gallery",
  "program",
  "speakers",
  "live",
];
