"use client";

import { usePathname } from "@/config/i18n";
import { Footer } from "./Footer";

// The event detail page (`/eventos/<id>`, exactly two segments) never gets
// the real, multi-column Footer: on desktop it's a fixed-height frame with
// its own compact footer built in (EventFooter, inside EventShell), and on
// mobile (2026-10-09: "dentro do evento não ter um footer, apenas as
// informações do evento") scrolling should only ever move the hero —
// nothing should appear or shift below the event content. Every other
// route (the events list, a panel's own detail page) keeps the real
// Footer always.
const EVENT_DETAIL_PATTERN = /^\/eventos\/[^/]+$/;

export function ConditionalFooter() {
  const pathname = usePathname();
  if (EVENT_DETAIL_PATTERN.test(pathname)) {
    return null;
  }
  return <Footer />;
}
