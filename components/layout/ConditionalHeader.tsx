"use client";

import { usePathname } from "@/config/i18n";

// Inside an event (`/eventos/<id>`) the page has its own top bar — the
// event's logo + the language flags (EventTopBar, client design
// 2026-11-13) — so the MediaCraft header isn't shown there. Same route
// rule as ConditionalFooter.
// …and the panelists' private interaction page (/eventos/<id>/interacao/<token>).
const EVENT_DETAIL_PATTERN = /^\/eventos\/[^/]+(\/interacao\/[^/]+)?$/;

export function ConditionalHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (EVENT_DETAIL_PATTERN.test(pathname)) return null;
  return <>{children}</>;
}
