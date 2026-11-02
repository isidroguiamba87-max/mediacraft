"use client";

import { useTranslations } from "next-intl";
import { MouseGlow } from "@/components/ui/MouseGlow";
import { AnimatedCounter } from "./AnimatedCounter";

const KEYS = ["partners", "countries", "channels", "participants"] as const;

/**
 * The reach figures on the navy band. Each stat is a small dossier entry: a
 * big two-tone figure (white "+", red digits that count up on scroll) and a
 * monospace label, under its own red tick on a hairline rule.
 */
export function NumbersStation() {
  const t = useTranslations("stats");
  const tShow = useTranslations("showcase");

  return (
    <section className="relative overflow-hidden border-y border-line bg-brand-navy text-white">
      <MouseGlow />

      <div className="relative mx-auto max-w-container px-6 py-14 sm:py-24 lg:px-10">
        <h2 className="max-w-2xl">
          <span className="font-body text-2xl leading-[1.15] font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {tShow("numbersTitle")}
          </span>
        </h2>

        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:mt-16 sm:gap-x-8 sm:gap-y-14 sm:grid-cols-4">
          {KEYS.map((key) => {
            const raw = t(`items.${key}.value`); // e.g. "+70"
            const n = parseInt(raw.replace(/\D/g, ""), 10) || 0;
            return (
              <div key={key} className="relative border-t border-white/20 pt-4 sm:pt-7">
                <span
                  aria-hidden
                  className="absolute -top-0.5 left-0 h-[3px] w-8 bg-brand-red sm:w-12"
                />
                <p className="font-body text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="text-white">+</span>
                  <AnimatedCounter value={n} className="text-brand-red" />
                </p>
                <p className="mt-1.5 font-mono text-[11px] tracking-wide text-white/55 sm:mt-3 sm:text-xs">
                  {t(`items.${key}.label`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
