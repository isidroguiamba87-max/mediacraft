import type { LucideIcon } from "lucide-react";

/** A team member's fixed (non-translated) data. Role/title is translated
 * and lives in messages/*.json under team.members.<id>.role. `photo` is
 * optional — without one, TeamCard falls back to an initials avatar. */
export interface TeamMember {
  id: string;
  name: string;
  photo?: string;
  email?: string;
  linkedin?: string;
  whatsapp?: string;
}

/** A partner shown on the home page marquee / "view all" modal. Without a
 * `logo`, the UI falls back to a text chip with the partner's name. */
export interface Partner {
  id: string;
  name: string;
  logo?: string;
  url?: string;
}

/** One of the five service pillars. Title/description are translated and
 * live in messages/*.json under services.items.<id>. */
export interface Service {
  id: string;
  icon: LucideIcon;
  /** Background photo(s) for the home page's service card (2026-10-22).
   * Omitted entirely while a theme has no photo yet — the card falls back
   * to a plain brand-gradient background rather than breaking the grid.
   * More than one path means the card picks one at random on each visit
   * ("se dessa vez mostra essa, na próxima volta é a outra") — see
   * components/home/ServicePhoto.tsx. */
  images?: string[];
}
