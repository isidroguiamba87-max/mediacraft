import { Megaphone, Target, PenSquare, CalendarRange, Users } from "lucide-react";
import type { Service } from "@/types";

/**
 * The five service pillars shown on the home page. Titles and
 * descriptions are translated — edit them in messages/*.json under
 * services.items.<id>.title / .description. Only structure (order, icon)
 * lives here.
 */
export const services: Service[] = [
  // Order = the numbering in the client's "O que fazemos?" design (01–05).
  {
    id: "events",
    icon: CalendarRange,
    images: ["/images/home-services/events-1.jpg", "/images/home-services/events-2.jpg"],
    // 2026-11-11: dedicated file ("Ativo 1" from the client's new export
    // batch) — kept separate from the shared DEFAULT_STAGE
    // (what-we-do-bg.png) in ServicesOrbit.tsx, which "content" (02) also
    // falls back to; overwriting that one would have changed 02's
    // background too, which wasn't asked for.
    stage: { src: "/images/services/what-we-do-events.png", kind: "photo" },
  },
  {
    id: "content",
    icon: PenSquare,
    images: ["/images/home-services/content.jpg"],
    // client's "Ativo 7" (app/fotos novas/1x), its transparent left cut
    // away and a soft left fade baked in — sits right over the navy.
    stage: { src: "/images/services/what-we-do-content.png", kind: "graphic", fill: "#17223a", wash: "heavy" },
  },
  {
    id: "campaigns",
    icon: Users,
    images: ["/images/home-services/campaigns.jpg"],
    // 2026-11-12: client's new "Campanhas e Engajamento Público.png"
    // (app/fotos novas/1x, 16001px, semi-transparent pastel gradient) →
    // resized to 2400px and flattened onto the section navy, as JPG.
    stage: { src: "/images/services/what-we-do-campaigns-v2.jpg", kind: "graphic", fill: "#17223a" },
  },
  {
    id: "communication",
    icon: Megaphone,
    images: ["/images/home-services/communication.jpg"],
    // client's "Ativo 3" (app/fotos novas/1x) — a real photo, so no `fill`
    // needed and the default "heavy" wash (same as "events") already
    // applies without having to repeat it here.
    stage: { src: "/images/services/what-we-do-communication.png", kind: "photo" },
  },
  {
    id: "programs",
    icon: Target,
    images: ["/images/home-services/campaigns-engagement.png"],
    // client's "Ativo 4" (app/fotos novas/1x), saved as a lighter JPG
    stage: { src: "/images/services/what-we-do-programs.jpg", kind: "photo" },
  },
];
