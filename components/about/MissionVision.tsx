"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Target, Eye, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const CARDS: {
  id: "mission" | "vision";
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}[] = [
  { id: "mission", icon: Target, iconBg: "bg-brand-red/10", iconColor: "text-brand-red" },
  { id: "vision", icon: Eye, iconBg: "bg-brand-navy/10", iconColor: "text-brand-navy" },
];

const AUTO_MS = 4500;
const PREVIEW_LENGTH = 110;

/** Smaller radius, lighter shadow, more discreet border than the shared
 * `Card` component's defaults, same styling this pair has used since
 * 2026-10-26. */
const cardClass = "rounded-xl border border-line bg-white p-6 shadow-sm";

/**
 * Missão & Visão, as their own section right under the Intro photo band
 * (2026-11-01: "Missão e Visão devem estar lá em cima depois [da] imagem
 * que devolvemos" — pulled back out of History's sidebar, where they'd
 * been folded in during the previous pass, and given their own soft
 * decorative backdrop per the newest reference). Full mission/vision text
 * on desktop/tablet; an auto-sliding, tap-to-expand carousel on mobile —
 * unchanged from the interaction this pair already had before the fold.
 */
export function MissionVision() {
  const t = useTranslations("about");

  return (
    <section className="relative overflow-hidden bg-paper py-16 lg:py-20">
      <span
        aria-hidden
        className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-brand-red/10 blur-3xl"
      />
      <span
        aria-hidden
        className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand-navy/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-container px-6 lg:px-10">
        <div className="hidden gap-6 sm:grid sm:grid-cols-2">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.id} className={cn(cardClass, "flex flex-col gap-4")}>
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full",
                    card.iconBg,
                    card.iconColor,
                  )}
                >
                  <Icon size={20} />
                </div>
                <h3 className="font-display text-2xl text-brand-navy">{t(`${card.id}.title`)}</h3>
                <p className="text-sm leading-relaxed text-slate">{t(`${card.id}.text`)}</p>
              </div>
            );
          })}
        </div>

        <div className="sm:hidden">
          <MissionVisionCarousel />
        </div>
      </div>
    </section>
  );
}

function MissionVisionCarousel() {
  const t = useTranslations("about");
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (expanded) return;
    const id = setInterval(() => setActive((a) => (a + 1) % CARDS.length), AUTO_MS);
    return () => clearInterval(id);
  }, [expanded]);

  return (
    <div>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {CARDS.map((card) => {
            const Icon = card.icon;
            const isExpanded = expanded === card.id;
            const text = t(`${card.id}.text`);
            const preview = text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH).trimEnd()}…` : text;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setExpanded(isExpanded ? null : card.id)}
                aria-expanded={isExpanded}
                className="w-full shrink-0 px-0.5 text-left"
              >
                <div className={cn(cardClass, "transition-shadow", isExpanded && "shadow-md")}>
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full",
                      card.iconBg,
                      card.iconColor,
                    )}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 font-display text-2xl text-brand-navy">{t(`${card.id}.title`)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate">{isExpanded ? text : preview}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {CARDS.map((card, i) => (
          <button
            key={card.id}
            type="button"
            aria-label={t(`${card.id}.title`)}
            aria-current={i === active}
            onClick={() => {
              setActive(i);
              setExpanded(null);
            }}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === active ? "w-8 bg-brand-red" : "w-3 bg-line",
            )}
          />
        ))}
      </div>
    </div>
  );
}
