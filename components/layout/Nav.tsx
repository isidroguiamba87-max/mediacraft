"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/config/i18n";
import { mainNav } from "@/config/site.config";
import { cn } from "@/lib/utils";

export function Nav({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-8", className)}>
      {mainNav.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-brand-red",
              active ? "text-brand-red" : "text-ink",
            )}
            aria-current={active ? "page" : undefined}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
