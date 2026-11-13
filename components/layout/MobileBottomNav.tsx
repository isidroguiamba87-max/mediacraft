"use client";

import { Home, Images, Newspaper, Users, Mail, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/config/i18n";
import { mainNav, sectionNav } from "@/config/site.config";
import { useActiveSection } from "@/hooks/useActiveSection";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<(typeof mainNav)[number]["key"], LucideIcon> = {
  home: Home,
  about: Users,
  gallery: Images,
  news: Newspaper,
  contact: Mail,
};

const SPY_IDS = Object.keys(sectionNav);

/** The mobile main nav, app-style, fixed to the bottom — universal across
 * every page, including inside an event (the event micro-site's own fixed
 * frame reserves this bar's height in its own layout math instead of
 * overlapping it — see EventShell's `h-[calc(100vh-5rem-4rem)]`). */
export function MobileBottomNav() {
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
    <>
      {/* Spacer so fixed-positioning the bar below doesn't cover page
       * content/footer — lives in normal flow, right where the bar
       * would otherwise sit. */}
      <div className="h-16 md:hidden" aria-hidden />

      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-30 flex bg-brand-navy px-1 pt-1.5 shadow-[0_-4px_16px_rgba(0,27,50,0.25)] md:hidden"
        style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
      >
        {mainNav.map((item) => {
          const Icon = NAV_ICONS[item.key];
          const active = activeKey === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-brand px-2 py-1.5 text-[11px] font-medium",
                active ? "text-brand-red" : "text-white/60",
              )}
              aria-current={active ? "true" : undefined}
            >
              <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
