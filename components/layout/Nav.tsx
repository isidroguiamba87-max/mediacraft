"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/config/i18n";
import { mainNav, sectionNav } from "@/config/site.config";
import { useActiveSection } from "@/hooks/useActiveSection";
import { cn } from "@/lib/utils";

const SPY_IDS = Object.keys(sectionNav);

/**
 * One-page nav (2026-11-11): Início · Sobre Nós · Galeria · Contacto, all
 * anchors on the home page (smooth scroll + header offset come from CSS —
 * `scroll-behavior` on <html>, `scroll-mt-20` on each section). On the home
 * page the link of the section in view is highlighted (scroll-spy); on any
 * other page (an event, a news item) "Início" stays lit.
 */
export function Nav({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const section = useActiveSection(SPY_IDS);
  const activeKey = pathname.startsWith("/novidades")
    ? "news"
    : section
      ? sectionNav[section]
      : pathname === "/"
        ? "home"
        : null;

  return (
    <nav className={cn("flex items-center gap-2", className)}>
      {mainNav.map((item) => {
        const active = activeKey === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-brand-red text-white" : "text-ink hover:text-brand-red",
            )}
            aria-current={active ? "true" : undefined}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
