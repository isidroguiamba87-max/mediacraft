"use client";

import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { Link } from "@/config/i18n";
import { siteConfig } from "@/config/site.config";

/** A compact, desktop-only footer for the event micro-site (`md:`) — the
 * real site Footer never shows on an event detail page, mobile included
 * (see ConditionalFooter: "dentro do evento não ter um footer, apenas as
 * informações do evento"), so this single-row one is what appears at the
 * bottom once a visitor scrolls past the event's own content. */
export function EventFooter() {
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="hidden shrink-0 border-t border-white/10 bg-brand-navy px-6 py-2.5 md:block md:px-10">
      <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-x-6 gap-y-1.5 text-[11px] text-white/60 sm:text-xs">
        <p className="shrink-0">
          © {year} {siteConfig.legalName}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/" className="hover:text-white">
            {tNav("home")}
          </Link>
          <Link href="/eventos" className="hover:text-white">
            {tNav("events")}
          </Link>
          <Link href="/novidades" className="hover:text-white">
            {tNav("news")}
          </Link>
          <a href={`mailto:${siteConfig.contact.email}`} className="hidden hover:text-white sm:inline">
            {siteConfig.contact.email}
          </a>
        </div>

        <p className="flex shrink-0 items-center gap-1">
          {tFooter("developedBy")}
          <Heart size={10} className="fill-brand-red text-brand-red" aria-hidden />
          {tFooter("by")}{" "}
          <a
            href={siteConfig.developer.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-white"
          >
            {siteConfig.developer.name}
          </a>
        </p>
      </div>
    </footer>
  );
}
