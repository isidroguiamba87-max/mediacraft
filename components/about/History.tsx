"use client";

import { useState } from "react";
import { Dancing_Script } from "next/font/google";
import { useTranslations } from "next-intl";
import { ChevronDown, Compass, Flame, Heart, Users } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Scoped to just the founders' signature below — nothing else in the
// project uses a script face (2026-10-31 reference: "assinatura elegante,
// semelhante a uma assinatura editorial"). Self-hosted by Next at build
// time, no extra package needed.
const signature = Dancing_Script({ subsets: ["latin"], weight: ["700"] });

interface TitlePart {
  t: string;
  hl: boolean;
}

// Same icon-per-value mapping the original (now-removed) Values.tsx used.
const VALUE_ICONS = {
  boldness: Flame,
  inclusion: Users,
  curiosity: Compass,
  empathy: Heart,
} as const;
const VALUE_KEYS = Object.keys(VALUE_ICONS) as (keyof typeof VALUE_ICONS)[];

/**
 * "A nossa história" — also where Valores lives (2026-11-01: Missão and
 * Visão moved back out into their own section, `MissionVision.tsx`,
 * positioned right after Intro — "Missão e Visão devem estar lá em cima
 * depois da imagem que devolvemos" — leaving only Valores in this
 * section's sidebar, "com o seu devido texto que já tinha na versão
 * anterior", i.e. each value's full original title+description, not just
 * a name list — and its original photo background, 2026-11-01: "podes
 * devolver a imagem que ficava no fundo dos valores"). Centred eyebrow +
 * title, the full narrative on the left ending in a quote+signature panel
 * over the founders' own photo (2026-11-02, see `QuoteSignature`), Valores
 * on the right. Six paragraphs is a lot to dump on a reader at once, so
 * the same preview-then-"ler mais" treatment the old History had is kept.
 */
export function History() {
  const t = useTranslations("about");
  const th = useTranslations("about.history");
  const paragraphs = th.raw("paragraphs") as string[];
  const titleParts = th.raw("titleParts") as TitlePart[];
  const [expanded, setExpanded] = useState(false);
  const [first, second, ...rest] = paragraphs;

  return (
    <section id="historia" className="bg-paper-2 py-16 lg:py-24">
      <div className="mx-auto max-w-container px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8 bg-brand-red/40" />
            <p className="text-xs font-semibold tracking-[0.2em] text-brand-red uppercase">
              {th("eyebrow")}
            </p>
            <span aria-hidden className="h-px w-8 bg-brand-red/40" />
          </div>
          <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
            {titleParts.map((p, i) => (
              <span key={i} className={p.hl ? "text-brand-red" : "text-brand-navy"}>
                {p.t}
              </span>
            ))}
          </h2>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_24rem] lg:items-start lg:gap-16">
          {/* left: the full narrative, ending in the founders' signature */}
          <div>
            <div className="flex flex-col gap-5 text-justify text-sm leading-relaxed text-slate sm:text-base">
              <p>{first}</p>

              {second && (
                <div className="relative">
                  <p className={cn(!expanded && "line-clamp-3")}>{second}</p>
                  {!expanded && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-paper-2 to-transparent"
                    />
                  )}
                </div>
              )}

              {expanded && rest.map((p, i) => <p key={i}>{p}</p>)}

              {second && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center gap-1.5 self-start text-sm font-medium text-brand-red"
                  aria-expanded={expanded}
                >
                  {expanded ? th("readLess") : th("readMore")}
                  <ChevronDown size={16} className={cn("transition-transform", expanded && "rotate-180")} />
                </button>
              )}
            </div>

            <QuoteSignature quote={t("quote")} signatureRole={t("signatureRole")} />
          </div>

          {/* right: Valores */}
          <ValuesCard />
        </div>
      </div>
    </section>
  );
}

/** The quote and the founders' signature, closing out the narrative next
 * to their own photo (2026-11-02: "podes colocar essa imagem aqui na
 * parte de baixo do texto historial... vais colocar a forma do [quote] e
 * [Linda e Vanessa / Fundadoras...]"). The text and the photo got their
 * own side-by-side halves rather than text overlaid on a full-bleed crop
 * — the overlay version cropped the photo down to a sliver too short to
 * actually show the founders ("não dá para vê-las" — 2026-11-02 follow-
 * up) — each half keeping its own natural size instead. `founders.jpg`
 * was sitting unused in public/images/about since the earlier Hero
 * redesign (which used this same side-by-side shape) was reverted. */
function QuoteSignature({ quote, signatureRole }: { quote: string; signatureRole: string }) {
  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-line shadow-sm lg:grid lg:grid-cols-2">
      <div className="bg-brand-navy p-7 sm:p-9">
        <span aria-hidden className="font-display text-4xl leading-none text-white/30">
          “
        </span>
        <p className="mt-1 font-display text-lg leading-snug text-white italic sm:text-xl">{quote}</p>

        <div className="mt-7">
          <span aria-hidden className="mb-2 block h-0.5 w-10 bg-brand-red" />
          <p className={cn(signature.className, "text-4xl text-white")}>Linda e Vanessa</p>
          <p className="mt-1 text-xs font-semibold tracking-[0.1em] text-white/70 uppercase">
            {signatureRole}
          </p>
        </div>
      </div>

      <div className="relative min-h-[16rem] lg:min-h-[22rem]">
        <Image
          src="/images/about/founders.jpg"
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          style={{ objectPosition: "50% 30%" }}
          className="object-cover"
        />
      </div>
    </div>
  );
}

/** Restored to the original Values.tsx content — each value with its own
 * icon, title and full description, not just a name list (2026-11-01:
 * "no lado direito do texto de história deixa apenas os valores com seu
 * devido texto que já tinha na versão anterior") — and its original photo
 * background, muted so it stays easy to read ("algo suave que não agride
 * os olhos"). On `lg` (desktop), each value sits in its own bordered
 * rectangle, stacked one per row rather than a 2-up grid of squares
 * (2026-11-02: "os valores deve estar em retângulos em cima do outro e
 * não assim em quadrados") — same frosted glowing-bordered card treatment
 * the original Values.tsx used. Below `lg` (mobile), that per-item border
 * drops back to the plain icon+text row it had before the rectangle
 * request (2026-11-02 follow-up: "no modo mobile volte como estava
 * anteriormente... sem mexer no modo desktop") — same icon, same text,
 * just no box around each one. */
function ValuesCard() {
  const t = useTranslations("about.values");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line shadow-sm">
      <Image
        src="/images/services/communication.jpg"
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 24rem"
        className="object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-brand-navy/75" />

      <div className="relative p-6">
        <h3 className="font-display text-xl text-white">{t("title")}</h3>
        <span aria-hidden className="mt-2 block h-0.5 w-6 bg-brand-red" />

        <div className="mt-4 flex flex-col gap-4 lg:gap-3">
          {VALUE_KEYS.map((key) => {
            const Icon = VALUE_ICONS[key];
            return (
              <div
                key={key}
                className="flex items-start gap-3 lg:rounded-xl lg:border lg:border-brand-red/40 lg:bg-white/10 lg:p-3 lg:shadow-[0_0_18px_rgba(191,38,46,0.12)] lg:backdrop-blur-md"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-red to-brand-red-deep text-white shadow-[0_0_14px_rgba(191,38,46,0.5)]">
                  <Icon size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t(`items.${key}.title`)}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-white/75">
                    {t(`items.${key}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
