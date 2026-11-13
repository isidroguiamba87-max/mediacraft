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

  // Client design (2026-11-11): deep navy ground, big white type, the
  // columns split by dashed rules, plain white social glyphs, no top rule
  // on the legal block. Type scales fluidly so it keeps the artboard's
  // proportions (1875px wide) on large screens.
  const body = "text-[clamp(1rem,1.3vw,1.625rem)] leading-[1.32]";
  const heading =
    "mb-[0.55em] font-body text-[clamp(1.0625rem,1.45vw,1.75rem)] font-bold tracking-[0.02em] uppercase";
  const col = "footer-col lg:pl-[clamp(1.25rem,1.9vw,2.25rem)]";

  return (
    <footer className="footer-ground font-body text-white">
      <div className="mx-auto max-w-[120rem] px-6 pt-16 pb-16 sm:px-10 lg:px-[5.3%] lg:pt-[clamp(3.5rem,5vw,6rem)] lg:pb-[clamp(4rem,5.8vw,7rem)]">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-[minmax(0,1.55fr)_auto_auto_minmax(0,1.3fr)_auto] lg:gap-x-[clamp(1.25rem,1.9vw,2.25rem)]">
          <div className="col-span-2 lg:col-span-1">
            <Image
              src="/logo/logo.png"
              alt="MediaCraft"
              width={3914}
              height={1138}
              className="h-[clamp(3rem,3.9vw,4.6rem)] w-auto"
            />
            <p className={`mt-[1.1em] max-w-[24em] ${body}`}>{t("tagline")}</p>
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
            <ul className={`flex flex-col gap-[0.6em] ${body}`}>
              <li className="flex items-start gap-[0.65em]">
                <Mail aria-hidden strokeWidth={1.5} className="mt-[0.05em] h-[1.2em] w-[1.2em] shrink-0" />
                <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-white/70">
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-[0.65em]">
                <MapPin aria-hidden strokeWidth={1.5} className="mt-[0.05em] h-[1.35em] w-[1.2em] shrink-0" />
                <span className="max-w-[13em]">{siteConfig.contact.address}</span>
              </li>
            </ul>
          </div>

          <div className={col}>
            <p className={heading}>{t("follow")}</p>
            <div className="flex items-center gap-[clamp(1rem,1.2vw,1.4rem)] pt-[0.2em]">
              <a
                href={siteConfig.contact.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-white/70"
              >
                <FacebookIcon size={20} />
              </a>
              <a
                href={siteConfig.contact.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-white/70"
              >
                <InstagramIcon size={19} />
              </a>
              <a
                href={siteConfig.contact.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="hover:text-white/70"
              >
                <LinkedinIcon size={19} />
              </a>
            </div>
          </div>
        </div>

        <div className={`mt-[clamp(3rem,6.6vw,8rem)] flex flex-wrap items-center justify-between gap-x-6 gap-y-2 ${body}`}>
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
              className="font-bold hover:text-white/70"
            >
              {siteConfig.developer.name}
            </a>
          </p>
        </div>
        <p className={`mt-[1.3em] ${body}`}>
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
