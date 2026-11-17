"use client";

import { useTranslations } from "next-intl";
import { ChevronRight, Handshake, Globe2, Radio, Users, type LucideIcon } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

const KEYS = ["partners", "countries", "channels", "participants"] as const;

/** Mobile-only (2026-11-17: "os pontos, dá pra usar ícones... para o modo
 * mobile") — the plain red dot stays as-is from `sm:` up. */
const ICONS: Record<(typeof KEYS)[number], LucideIcon> = {
  partners: Handshake,
  countries: Globe2,
  channels: Radio,
  participants: Users,
};

/**
 * "Impacto que se mede em resultados" — one full screen on the one-page
 * home (2026-11-11): uppercase navy title with the red "Ver tudo" pill
 * aligned right on the same row (→ #eventos), then the rounded navy card
 * with a hairline timeline and a red dot above each figure. Each "+N"
 * counts up once when it enters the viewport (AnimatedCounter).
 */
export function NumbersStation() {
  const t = useTranslations("stats");
  const tShow = useTranslations("showcase");

  return (
    // Natural height on every screen — the old full-screen min-height (with
    // the content centred in it) opened a big blank gap between the hero
    // and this title (2026-11-17, mobile then desktop).
    <section className="bg-white text-brand-navy">
      <div className="mx-auto w-full max-w-container px-6 pt-4 pb-14 sm:pt-6 sm:pb-20 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-body text-2xl leading-[1.1] font-bold tracking-tight uppercase sm:text-4xl lg:text-5xl">
            {tShow("numbersTitle").replace(/\.$/, "")}
          </h2>
          <a
            href="#eventos"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-red px-5 py-2.5 font-body text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-brand-red/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
          >
            {tShow("numbersViewAll")}
            <ChevronRight aria-hidden className="h-5 w-5" strokeWidth={3} />
          </a>
        </div>

        <div className="mt-6 rounded-[2rem] bg-brand-navy px-6 py-10 text-white sm:mt-8 sm:rounded-[2.5rem] sm:px-10 sm:py-14">
          <div className="relative">
            {/* Timeline rule — runs between the centres of the first and last dots */}
            <span
              aria-hidden
              className="absolute top-[7px] right-[12.5%] left-[12.5%] hidden h-px bg-white/80 sm:block"
            />
            <ul className="relative grid grid-cols-2 gap-y-10 sm:grid-cols-4 sm:gap-y-0">
              {KEYS.map((key) => {
                const raw = t(`items.${key}.value`); // e.g. "+70"
                const n = parseInt(raw.replace(/\D/g, ""), 10) || 0;
                const Icon = ICONS[key];
                return (
                  <li key={key} className="flex flex-col items-center text-center">
                    <Icon aria-hidden strokeWidth={1.75} className="h-7 w-7 text-brand-red sm:hidden" />
                    <span
                      aria-hidden
                      className="hidden rounded-full bg-brand-red sm:-mt-[3px] sm:block sm:h-5 sm:w-5"
                    />
                    <p className="mt-6 font-body text-3xl leading-none font-bold tracking-tight sm:mt-8 sm:text-4xl lg:text-5xl">
                      <AnimatedCounter value={n} prefix="+" />
                    </p>
                    <p className="mt-2 max-w-[11rem] font-body text-sm leading-snug text-white sm:mt-3 sm:text-lg lg:text-xl">
                      {t(`items.${key}.label`)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
