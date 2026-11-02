"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Mail, MapPin, Heart } from "lucide-react";
import { LinkedinIcon, InstagramIcon, FacebookIcon } from "@/components/ui/SocialIcons";
import { Link } from "@/config/i18n";
import { mainNav, siteConfig } from "@/config/site.config";
import { usePulse } from "@/components/pulse/PulseContext";

const FLAGSHIP_EVENT_SLUG = "forum-diplomacia-turismo-investimento-2026";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const { openPulse } = usePulse();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-navy text-white">
      <div className="mx-auto max-w-container px-6 py-14 lg:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <Image
              src="/logo/logo.png"
              alt="MediaCraft"
              width={3914}
              height={1138}
              className="h-8 w-auto"
            />
            <p className="mt-4 max-w-xs text-sm text-white/70">{t("tagline")}</p>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
              {t("nav")}
            </p>
            <ul className="flex flex-col gap-2.5">
              {mainNav.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="text-sm text-white/80 hover:text-white">
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
              {t("platform")}
            </p>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/eventos" className="text-sm text-white/80 hover:text-white">
                  {tNav("events")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/eventos/${FLAGSHIP_EVENT_SLUG}`}
                  className="text-sm text-white/80 hover:text-white"
                >
                  {t("microsite")}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openPulse}
                  className="text-sm text-white/80 hover:text-white"
                >
                  {t("pulse")}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
              {t("contact")}
            </p>
            <ul className="flex flex-col gap-2.5 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <Mail size={16} className="mt-0.5 shrink-0" />
                <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-white">
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span>{siteConfig.contact.address}</span>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
              {t("follow")}
            </p>
            <div className="flex gap-3">
              <a
                href={siteConfig.contact.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"
              >
                <LinkedinIcon size={18} />
              </a>
              <a
                href={siteConfig.contact.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"
              >
                <InstagramIcon size={18} />
              </a>
              <a
                href={siteConfig.contact.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"
              >
                <FacebookIcon size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 items-center gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:grid-cols-[1fr_auto_1fr]">
          <p className="text-center sm:text-left">
            © {year} {siteConfig.legalName}. {t("rights")}
          </p>
          {/* Centered independently of the copyright line's length (the
           * 1fr/auto/1fr grid, not justify-between) — 2026-11-03: "podes
           * ser possível ter essas informações... no rodapé no centro". */}
          <p className="flex flex-wrap items-center justify-center gap-1 text-center">
            {t("developedBy")}
            <Heart size={12} className="fill-brand-red text-brand-red" aria-hidden />
            {t("by")}{" "}
            <a
              href={siteConfig.developer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white/70 hover:text-white"
            >
              {siteConfig.developer.name}
            </a>
          </p>
          <div aria-hidden className="hidden sm:block" />
        </div>
      </div>
    </footer>
  );
}
