import {
  Handshake,
  LayoutDashboard,
  Newspaper,
  Images,
  Star,
  MessageCircleQuestion,
  Database,
  Palette,
} from "lucide-react";

/** Shared between AdminSidebar (desktop) and the mobile nav in AdminHeader
 * so both always list the same modules in the same order. "Relatório" was
 * folded into "Dashboard" (2026-10-09) — picking an event there now shows
 * the same detailed, printable report that used to live at its own
 * /admin/relatorio route. "Documentos" was retired entirely (2026-10-10,
 * "todos os documentos virão da plataforma Pulse") — materials are now
 * Pulse-only, with nothing left to manage from this admin panel.
 * "Networking" (2026-10-12) is the organizer-facing view of the
 * Networking funnel's metrics. */
export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/novidades", label: "Novidades", icon: Newspaper },
  { href: "/admin/galeria", label: "Galeria", icon: Images },
  { href: "/admin/avaliacao", label: "Avaliação", icon: Star },
  { href: "/admin/perguntas", label: "Perguntas", icon: MessageCircleQuestion },
  { href: "/admin/networking", label: "Networking", icon: Handshake },
  { href: "/admin/eventos", label: "Visual do Evento", icon: Palette },
  { href: "/admin/pulse", label: "Dados do Pulse", icon: Database },
] as const;
