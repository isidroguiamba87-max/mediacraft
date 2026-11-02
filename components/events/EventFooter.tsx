"use client";

import { useTranslations } from "next-intl";
import { LinkedinIcon, InstagramIcon, FacebookIcon } from "@/components/ui/SocialIcons";
import { Link } from "@/config/i18n";
import { siteConfig } from "@/config/site.config";

/** A compact, desktop-only footer for the event micro-site (`md:`) — the
 * real site Footer never shows on an event detail page, mobile included
 * (see ConditionalFooter: "dentro do evento não ter um footer, apenas as
 * informações do evento"), so this single-row one is what appears at the
 * bottom once a visitor scrolls past the event's own content. */
export function EventFooter() {
  const tNav = useTranslations("nav");
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

        <div className="flex shrink-0 items-center gap-2.5">
          <a
            href={siteConfig.contact.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-white/60 hover:text-white"
          >
            <LinkedinIcon size={14} />
          </a>
          <a
            href={siteConfig.contact.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-white/60 hover:text-white"
          >
            <InstagramIcon size={14} />
          </a>
          <a
            href={siteConfig.contact.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="text-white/60 hover:text-white"
          >
            <FacebookIcon size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
}
