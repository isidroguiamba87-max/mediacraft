"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Mail, MapPin, Heart } from "lucide-react";
import { LinkedinIcon, InstagramIcon, FacebookIcon } from "@/components/ui/SocialIcons";
import { Link } from "@/config/i18n";
import { footerNav, siteConfig } from "@/config/site.config";
import { usePulse } from "@/components/pulse/PulseContext";

const FLAGSHIP_EVENT_SLUG = "forum-diplomacia-turismo-investimento-2026";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const { openPulse } = usePulse();
  const year = new Date().getFullYear();

  // Client design (2026-11-11): deep navy ground, white type, the columns
  // split by dashed rules, plain white social glyphs, no top rule on the
  // legal block. Slimmed down 2026-11-17 ("tudo aqui está muito grande…
  // devem ficar finos"): smaller, lighter type and tighter spacing.
  const body = "text-[13px] font-light leading-[1.55] sm:text-sm";
  const heading = "mb-2.5 font-body text-[13px] font-semibold tracking-[0.08em] uppercase sm:text-sm";
  const col = "footer-col lg:pl-6";

  return (
    <footer className="footer-ground font-body text-white">
      <div className="mx-auto max-w-[120rem] px-6 pt-10 pb-8 sm:px-10 lg:px-[5.3%] lg:pt-12 lg:pb-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1.55fr)_auto_auto_minmax(0,1.3fr)_auto] lg:gap-x-6">
          <div className="col-span-2 lg:col-span-1">
            <Image
              src="/logo/logo.png"
              alt="MediaCraft"
              width={3914}
              height={1138}
              className="h-9 w-auto sm:h-10"
            />
            <p className={`mt-3 max-w-[26em] text-white/80 ${body}`}>{t("tagline")}</p>
          </div>

          <div className={col}>
            <p className={heading}>{t("nav")}</p>
            <ul className={body}>
              {footerNav.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="hover:text-white/70">
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={col}>
            <p className={heading}>{t("platform")}</p>
            <ul className={`max-w-[8.5em] ${body}`}>
              <li>
                <Link href="/eventos" className="hover:text-white/70">
                  {tNav("events")}
                </Link>
              </li>
              <li>
                <Link href={`/eventos/${FLAGSHIP_EVENT_SLUG}`} className="hover:text-white/70">
                  {t("microsite")}
                </Link>
              </li>
              <li>
                <button type="button" onClick={openPulse} className="text-left hover:text-white/70">
                  {t("pulse")}
                </button>
              </li>
            </ul>
          </div>

          <div className={col}>
            <p className={heading}>{t("contact")}</p>
            <ul className={`flex flex-col gap-1.5 ${body}`}>
              <li className="flex items-start gap-[0.65em]">
                <Mail aria-hidden strokeWidth={1.5} className="mt-[0.2em] h-[1.1em] w-[1.1em] shrink-0" />
                <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-white/70">
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-[0.65em]">
                <MapPin aria-hidden strokeWidth={1.5} className="mt-[0.2em] h-[1.1em] w-[1.1em] shrink-0" />
                <span className="max-w-[13em]">{siteConfig.contact.address}</span>
              </li>
            </ul>
          </div>

          <div className={col}>
            <p className={heading}>{t("follow")}</p>
            <div className="flex items-center gap-4 pt-0.5">
              <a
                href={siteConfig.contact.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-white/70"
              >
                <FacebookIcon size={15} />
              </a>
              <a
                href={siteConfig.contact.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-white/70"
              >
                <InstagramIcon size={15} />
              </a>
              <a
                href={siteConfig.contact.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="hover:text-white/70"
              >
                <LinkedinIcon size={15} />
              </a>
            </div>
          </div>
        </div>

        <div className={`mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 text-xs font-light text-white/75`}>
          <p>
            © {year} {siteConfig.legalName}. {t("rights")}
          </p>
          <p className="flex items-center gap-[0.35em]">
            {t("developedBy")}
            <Heart aria-hidden className="h-[0.9em] w-[0.9em] fill-brand-red text-brand-red" />
            {t("by")}{" "}
            <a
              href={siteConfig.developer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white hover:text-white/70"
            >
              {siteConfig.developer.name}
            </a>
          </p>
        </div>
        <p className="mt-2 text-xs font-light text-white/75">
          <Link href="/politica-privacidade" className="hover:text-white/70">
            {t("privacyPolicy")}
          </Link>
          <span aria-hidden className="mx-[0.3em]">|</span>
          <Link href="/termos-de-uso" className="hover:text-white/70">
            {t("termsOfUse")}
          </Link>
        </p>
      </div>
    </footer>
  );
}
