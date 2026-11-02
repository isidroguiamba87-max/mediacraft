import { Megaphone, Target, PenSquare, CalendarRange, Users } from "lucide-react";
import type { Service } from "@/types";

/**
 * The five service pillars shown on the home page. Titles and
 * descriptions are translated — edit them in messages/*.json under
 * services.items.<id>.title / .description. Only structure (order, icon)
 * lives here.
 */
export const services: Service[] = [
  { id: "communication", icon: Megaphone, images: ["/images/home-services/communication.jpg"] },
  { id: "programs", icon: Target, images: ["/images/home-services/campaigns-engagement.png"] },
  { id: "content", icon: PenSquare, images: ["/images/home-services/content.jpg"] },
  {
    id: "events",
    icon: CalendarRange,
    images: ["/images/home-services/events-1.jpg", "/images/home-services/events-2.jpg"],
  },
  { id: "campaigns", icon: Users, images: ["/images/home-services/campaigns.jpg"] },
];
