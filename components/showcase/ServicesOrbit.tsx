"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { services } from "@/content/services";
import type { Service } from "@/types";
import { cn } from "@/lib/utils";
import { serviceDetails } from "@/content/serviceDetails";
import { PillarDetailModal } from "./PillarDetailModal";

const N = services.length;
const STEP = 360 / N; // 72° between areas
const FOCUS = 0; // deg — the focus slot: straight out to the right (3 o'clock)
const AUTO_MS = 7000; // one-page brief (2026-11-11): ~7 s per service
type Stage = NonNullable<Service["stage"]>;
const DEFAULT_STAGE: Stage = { src: "/images/services/what-we-do-bg.png", kind: "photo" };
const stageOf = (i: number): Stage => services[i].stage ?? DEFAULT_STAGE;
/** Every distinct background, mounted once and cross-faded by the active area. */
const STAGES = Array.from(
  new Map(services.map((_, i) => [stageOf(i).src, stageOf(i)])).values(),
);

const pad = (n: number) => String(n).padStart(2, "0");

/** Cyclic distance between two wheel slots (0 = active, 1 = neighbour…). */
const ringDist = (i: number, active: number) => {
  const d = (((i - active) % N) + N) % N;
  return Math.min(d, N - d);
};

/**
 * "O que fazemos?" — client design (2026-11-11). Each area can carry its own
 * full-bleed background (`stage` in content/services.ts — 01 the event stage
 * photo, 03 the social-media artwork…); they cross-fade as the wheel turns.
 * Photos get a heavy navy wash (solid left, clear right, dark foot);
 * graphics that already have a navy left side only get a light one. Left: the five areas ride a wheel around the
 * MediaCraft mark (navy logo on a white disc inside a thin red ring); the
 * active area sits at 3 o'clock joined to the ring by a short red spoke, its
 * neighbours stay solid white, the far two fade back. Right: a solid navy card
 * with the active area's title + description + progress dashes.
 *
 * Not scroll-driven — an IntersectionObserver arms it, then a timer turns the
 * wheel one area at a time; hover pauses, tapping a node or dash jumps.
 * Deterministic first render (`armed=false`, `turn=0`) → hydration-safe.
 * Below `lg` / reduced motion: heading + a single navy card with "Seguinte".
 */
export function ServicesOrbit() {
  const t = useTranslations("services");
  const reduce = useReducedMotion();

  const sectionRef = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  // In view right now — rotation pauses while the section is off-screen and
  // resumes on the same service when it comes back.
  const [visible, setVisible] = useState(false);
  // "Ver mais" popup (2026-11-19): the service id it's showing, if open —
  // rotation pauses while it's up so the card behind doesn't change.
  const [detailId, setDetailId] = useState<string | null>(null);
  const tHero = useTranslations("hero");
  const [turn, setTurn] = useState(0);
  const active = ((turn % N) + N) % N;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        if (e.isIntersecting) setArmed(true);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // A fresh timeout per turn, so a click on a chip/dash restarts the 7 s
  // from that service. Never holds the page's scroll — this only ever
  // changes which service is shown.
  useEffect(() => {
    if (!armed || !visible || reduce || paused || focused || detailId) return;
    const id = setTimeout(() => setTurn((v) => v + 1), AUTO_MS);
    return () => clearTimeout(id);
  }, [armed, visible, reduce, paused, focused, detailId, turn]);

  const goTo = useCallback((i: number) => {
    setTurn((v) => {
      const cur = ((v % N) + N) % N;
      return v + ((((i - cur) % N) + N) % N);
    });
  }, []);

  const rot = FOCUS - turn * STEP;
  const activeSvc = services[active];
  const stage = stageOf(active);
  const wash = stage.wash ?? (stage.kind === "photo" ? "heavy" : "soft");

  const heading = (
    <div>
      <h2 className="text-white">
        <span className="font-body text-4xl font-bold tracking-wide uppercase sm:text-5xl">
          {t("eyebrow")}
        </span>
      </h2>
      <span aria-hidden className="what-rule mt-3 block h-px bg-brand-red" />
    </div>
  );

  const seeMore = serviceDetails[activeSvc.id] ? (
    <button
      type="button"
      onClick={() => setDetailId(activeSvc.id)}
      aria-haspopup="dialog"
      className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/80 px-4 py-1.5 font-body text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-white hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {tHero("seeMore")}
      <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={3} />
    </button>
  ) : null;

  const dashes = (
    <div className="mt-6 flex items-center gap-2">
      {services.map((s, i) => (
        <button
          key={s.id}
          type="button"
          onClick={() => goTo(i)}
          aria-label={`${pad(i + 1)} — ${t(`items.${s.id}.title`)}`}
          aria-current={i === active}
          className={cn(
            "h-[5px] rounded-full transition-all duration-500",
            i === active ? "w-10 bg-brand-red" : "w-4 bg-white hover:bg-white/70",
          )}
        />
      ))}
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className="orbit-section what-ground relative overflow-hidden"
      aria-roledescription="carousel"
      aria-label={t("carousel")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      {/* ---- per-area background + matching wash, cross-faded ----
          (client, 2026-11-11) the picture never spans the full width: it sits
          in a box anchored RIGHT at full section height that reaches only to
          about the middle (max 1396px, so it's never upscaled); the rest is
          plain navy and the box's left edge melts into it (.what-stage-edge)
          under the wash, so you never see where the photo starts. */}
      <div aria-hidden className="absolute inset-0">
        {STAGES.map((st, i) => (
          <div
            key={st.src}
            className={cn(
              "what-stage-box transition-opacity duration-[900ms] ease-out",
              st.src === stage.src ? "opacity-100" : "opacity-0",
            )}
          >
            <Image
              src={st.src}
              alt=""
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 58vw, 100vw"
              // artwork keeps its right side (the phone/posts) whole and
              // gives up only its plain gradient on the left
              className={cn("object-cover", st.kind === "graphic" && "object-right")}
            />
            <span className="what-stage-edge" />
          </div>
        ))}
        <div
          className={cn(
            "what-wash absolute inset-0 transition-opacity duration-[900ms]",
            wash === "heavy" ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "what-wash-soft absolute inset-0 transition-opacity duration-[900ms]",
            wash === "soft" ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      {/* =================== lg: wheel + logo hub =================== */}
      <div className="orbit-hub absolute inset-0">
        <div className="absolute top-14 left-14 z-30">{heading}</div>

        <div
          className="orbit-wheel absolute inset-0"
          style={{ "--rot": `${rot}deg` } as React.CSSProperties}
        >
          {services.map((s, i) => (
            <span
              key={`spoke-${s.id}`}
              aria-hidden
              className={cn("orbit-spoke", i === active && "is-active")}
              style={{ "--phi": `${i * STEP}deg` } as React.CSSProperties}
            />
          ))}

          {services.map((s, i) => {
            const d = ringDist(i, active);
            return (
              <div
                key={s.id}
                className={cn(
                  "orbit-node",
                  d === 0 && "is-active",
                  d === 1 && "is-near",
                  d >= 2 && "is-far",
                )}
                style={
                  {
                    "--phi": `${i * STEP}deg`,
                    zIndex: d === 0 ? 30 : 10,
                  } as React.CSSProperties
                }
              >
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={t(`items.${s.id}.title`)}
                  aria-current={d === 0}
                  className="orbit-node-inner absolute top-0 left-0 w-[11.5rem] rounded-2xl border bg-white px-4 py-2.5 text-center"
                >
                  <span className="block font-body text-[13px] font-bold text-brand-red">
                    {pad(i + 1)}
                  </span>
                  <span className="mt-0.5 block font-body text-[13px] leading-snug text-brand-navy">
                    {t(`items.${s.id}.title`)}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* centre: thin red ring around a white disc with the navy mark */}
        <div
          className={cn("orbit-logo orbit-ring absolute grid place-items-center rounded-full", armed && "is-armed")}
          style={{ left: "var(--wheel-cx)", top: "var(--wheel-cy)", zIndex: 20 }}
        >
          <div
            data-thread-target
            className="thread-star grid h-[6.5rem] w-[6.5rem] place-items-center rounded-full bg-white shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
          >
            <span aria-hidden className="thread-star-ring" />
            <Image
              src="/logo/logo-navy.png"
              alt="MediaCraft"
              width={3914}
              height={1138}
              sizes="90px"
              className="h-auto w-[4.75rem]"
            />
          </div>
        </div>

        {/* right: the active area */}
        <div
          className="absolute right-[5%] z-40 w-[min(24rem,32vw)] -translate-y-1/2"
          style={{ top: "var(--wheel-cy)" }}
        >
          <div
            key={activeSvc.id}
            className="reveal-up rounded-[1.75rem] bg-brand-navy/95 p-6 shadow-[0_28px_60px_rgba(0,0,0,0.45)] sm:p-7"
          >
            <h3 className="text-white">
              <span className="block font-body text-[1.4rem] leading-[1.2] font-bold uppercase">
                {t(`items.${activeSvc.id}.title`)}
              </span>
            </h3>
            <p className="mt-3 line-clamp-4 font-body text-sm leading-relaxed text-white/90">
              {t(`items.${activeSvc.id}.description`)}
            </p>
            {dashes}
            {seeMore}
          </div>
        </div>
      </div>

      {/* =================== fallback (<lg / reduced motion) =================== */}
      <div className="orbit-list relative mx-auto max-w-container px-6 py-8 sm:py-12">
        {heading}

        {/* the five numbered chips as a sideways-scrolling strip — tablet
            only; on phones it's just the card with side arrows
            (2026-11-17: "tira esses cartões… o modo mobile é só ter o
            cartão com a imagem de fundo com esses botões de lado") */}
        <div className="-mx-6 mt-8 hidden snap-x gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:flex">
          {services.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-current={i === active}
              className={cn(
                "w-40 shrink-0 snap-start rounded-2xl border px-3 py-2 text-center font-body transition-colors",
                i === active
                  ? "border-brand-red bg-white"
                  : "border-transparent bg-white/25 text-white/80",
              )}
            >
              <span className="block text-[12px] font-bold text-brand-red">{pad(i + 1)}</span>
              <span
                className={cn(
                  "mt-0.5 block text-[12px] leading-snug",
                  i === active ? "text-brand-navy" : "text-white/85",
                )}
              >
                {t(`items.${s.id}.title`)}
              </span>
            </button>
          ))}
        </div>

        <div className="relative mt-8 sm:mt-5">
        <article
          key={activeSvc.id}
          className="reveal-up rounded-[1.75rem] bg-[rgba(0,27,50,0.75)] px-11 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:p-6"
        >
          <span className="font-body text-[13px] font-bold text-brand-red">
            {pad(active + 1)} — {pad(N)}
          </span>
          <h3 className="mt-1 text-white">
            <span className="block font-body text-xl leading-tight font-bold uppercase">
              {t(`items.${activeSvc.id}.title`)}
            </span>
          </h3>
          <p className="mt-3 font-body text-sm leading-relaxed text-white/90">
            {t(`items.${activeSvc.id}.description`)}
          </p>
          {dashes}
          {seeMore}
        </article>

        {/* phone-only side arrows, straddling the card's edges */}
        {(
          [
            ["prev", -1, ChevronLeft, "-left-3"],
            ["next", 1, ChevronRight, "-right-3"],
          ] as const
        ).map(([key, dir, Icon, side]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTurn((v) => v + dir)}
            aria-label={t(key === "prev" ? "previous" : "next")}
            className={cn(
              "absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-brand-navy shadow-[0_6px_16px_rgba(0,0,0,0.35)] transition-colors hover:bg-brand-red hover:text-white sm:hidden",
              side,
            )}
          >
            <Icon aria-hidden className="h-5 w-5" strokeWidth={2.75} />
          </button>
        ))}
        </div>
      </div>
      {detailId && serviceDetails[detailId] && (
        <PillarDetailModal
          detail={serviceDetails[detailId]}
          photo={stageOf(services.findIndex((sv) => sv.id === detailId)).src}
          closeLabel={tHero("close")}
          onClose={() => setDetailId(null)}
        />
      )}
    </section>
  );
}
