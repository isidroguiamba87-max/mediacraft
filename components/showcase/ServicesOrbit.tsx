"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { services } from "@/content/services";
import { cn } from "@/lib/utils";
import { usePageLoadSeed, pickStablePhoto } from "@/hooks/usePageLoadSeed";

const N = services.length;
const STEP = 360 / N; // 72° between areas
const FOCUS = -8; // deg — the focus slot, just above 3 o'clock of the wheel
const AUTO_MS = 4200;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The five service areas ride a wheel whose centre sits behind the MediaCraft
 * mark, off to the left. It is NOT scroll-driven — once the section comes into
 * view (the current arriving) the mark reveals and lights, and the wheel turns
 * one area at a time on a timer, its photo + text opening in the panel on the
 * right. Tapping any title or dot jumps to that area; hovering the section
 * pauses the rotation.
 *
 * Deterministic first render (`armed=false`, `turn=0`) so it is hydration-safe
 * and uses no `motion.*` components. Below `lg` (cropping the wheel never
 * read well at that size, tried a few variants) and under reduced-motion it
 * swaps for a single card instead — logo + title, then info, then photo —
 * showing one area (`active`) at a time, advanced by its own "Seguinte"
 * button as well as the same auto-advance timer as the wheel.
 */
export function ServicesOrbit() {
  const t = useTranslations("services");
  const reduce = useReducedMotion();

  const sectionRef = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [turn, setTurn] = useState(0);
  const active = ((turn % N) + N) % N;

  // A real photo per area lives at `public/images/services/<id>.jpg` by
  // default; a theme can instead list several in content/services.ts's
  // `images` — see usePageLoadSeed for how a theme with more than one
  // picks between them.
  const pageLoadSeed = usePageLoadSeed();
  const photoSrc = useCallback(
    (id: string) => {
      const images = services.find((s) => s.id === id)?.images;
      if (!images || images.length === 0) return `/images/services/${id}.jpg`;
      return pickStablePhoto(images, pageLoadSeed);
    },
    [pageLoadSeed],
  );

  // Reveal + start the moment the section is in view (the current is arriving).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setArmed(true),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!armed || reduce || paused) return;
    const id = setInterval(() => setTurn((v) => v + 1), AUTO_MS);
    return () => clearInterval(id);
  }, [armed, reduce, paused]);

  const goTo = useCallback((i: number) => {
    setTurn((v) => {
      const cur = ((v % N) + N) % N;
      return v + ((((i - cur) % N) + N) % N);
    });
  }, []);

  const rot = FOCUS - turn * STEP;
  const activeSvc = services[active];
  const ActiveIcon = activeSvc.icon;

  return (
    <section
      ref={sectionRef}
      className="orbit-section relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* =================== lg: wheel + logo hub =================== */}
      <div className="orbit-hub absolute inset-0">
        {/* ---- big background photo per active area ---- */}
        <div aria-hidden className="absolute inset-0">
          {services.map((s, i) => (
            <Image
              key={s.id}
              src={photoSrc(s.id)}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className={cn(
                "object-cover transition-opacity duration-[900ms] ease-out",
                armed && i === active ? "opacity-100" : "opacity-0",
              )}
            />
          ))}
          <div
            className={cn(
              "absolute inset-0 bg-paper transition-opacity duration-700",
              armed ? "opacity-0" : "opacity-100",
            )}
          />
          {/* readability wash: only the left band (heading + the wheel labels).
              The right half stays clear so the photo carries the panel. */}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              armed ? "opacity-100" : "opacity-0",
            )}
            style={{
              background:
                "linear-gradient(90deg, rgba(244,246,248,0.9) 0%, rgba(244,246,248,0.5) 30%, rgba(244,246,248,0) 52%, rgba(244,246,248,0) 100%)",
            }}
          />
        </div>

        <div className="pointer-events-none absolute top-10 left-10 z-30">
          <h2 className="max-w-sm font-display text-3xl leading-tight tracking-wide text-brand-navy uppercase sm:text-4xl">
            {t("eyebrow")}
          </h2>
        </div>

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

          {services.map((s, i) => (
            <div
              key={s.id}
              className={cn("orbit-node", i === active && "is-active")}
              style={
                {
                  "--phi": `${i * STEP}deg`,
                  zIndex: i === active ? 30 : 10,
                } as React.CSSProperties
              }
            >
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={t(`items.${s.id}.title`)}
                aria-current={i === active}
                className="orbit-node-inner absolute top-0 left-0 w-44 rounded-2xl border border-line bg-white/95 px-3 py-2.5 text-center shadow-sm backdrop-blur"
              >
                <span className="block font-display text-[10px] tracking-[0.18em] text-brand-red/70">
                  {pad(i + 1)}
                </span>
                <span className="mt-0.5 block text-[13px] font-semibold leading-snug text-brand-navy">
                  {t(`items.${s.id}.title`)}
                </span>
              </button>
            </div>
          ))}
        </div>

        {/* centre: the MediaCraft mark — hidden, then revealed (`.is-armed`) and
            ignited (`.is-lit`, from ScrollThread hitting `[data-thread-target]`) */}
        <div
          data-thread-target
          className={cn(
            "thread-star orbit-logo absolute grid h-36 w-36 place-items-center rounded-full border border-white/10 bg-brand-navy shadow-[0_18px_44px_rgba(0,27,50,0.28)]",
            armed && "is-armed",
          )}
          style={{ left: "var(--wheel-cx)", top: "var(--wheel-cy)", zIndex: 20 }}
        >
          <span aria-hidden className="thread-star-ring" />
          <Image
            src="/logo/logo.png"
            alt="MediaCraft"
            width={3914}
            height={1138}
            sizes="130px"
            className="h-auto w-[8rem]"
          />
        </div>

        {/* right: the delivered area — a single compact card so it never clips */}
        <div className="absolute top-1/2 right-6 z-40 w-[min(24rem,38vw)] -translate-y-1/2 lg:right-12">
          <div
            key={activeSvc.id}
            className="reveal-up rounded-3xl border border-white/15 bg-brand-navy/55 p-6 shadow-[0_24px_60px_rgba(0,27,50,0.32)] backdrop-blur-md sm:p-7"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white">
              <ActiveIcon size={20} />
            </span>
            <p className="mt-4 font-display text-xs tracking-[0.14em] text-white/55">
              {pad(active + 1)} — {pad(N)}
            </p>
            <h3 className="mt-1 font-display text-xl leading-tight text-white">
              {t(`items.${activeSvc.id}.title`)}
            </h3>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/75">
              {t(`items.${activeSvc.id}.description`)}
            </p>

            <div className="mt-6 flex items-center gap-2">
              {services.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${pad(i + 1)} — ${t(`items.${s.id}.title`)}`}
                  aria-current={i === active}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === active
                      ? "w-8 bg-brand-red"
                      : "w-3 bg-white/25 hover:bg-white/50",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =================== fallback card (<lg / reduced motion) ===================
          No wheel, no stacked list either — one card at a time, same area
          the wheel would be showing (`active`), advanced by its own
          "Seguinte" button here (plus the same auto-advance timer as the
          wheel). Logo stays put; only the title/info/photo change. */}
      <div className="orbit-list mx-auto max-w-container px-6 pt-10 pb-20 lg:px-10 lg:pt-20">
        <h2 className="max-w-2xl font-display text-3xl leading-tight tracking-wide text-brand-navy uppercase sm:text-4xl">
          {t("eyebrow")}
        </h2>

        <article className="relative mt-8 aspect-[3/4] overflow-hidden rounded-2xl shadow-brand sm:aspect-[4/3]">
          {/* the photo is the card's own background — the full frame, not
              a sliver peeking around a panel. The caption panel below sits
              over just its own bottom portion, compact on purpose so the
              photo still reads as the background, not a border. */}
          <Image
            key={activeSvc.id}
            src={photoSrc(activeSvc.id)}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover"
          />

          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
            {/* info sits in its own solid panel instead of straight on the
                photo — a soft wash over the whole image is never reliably
                readable against every photo, a flat panel always is. */}
            <div className="rounded-xl bg-brand-navy p-3">
              <div className="flex items-center gap-2">
                <div className="shrink-0 rounded-lg bg-white/10 px-1.5 py-1">
                  <Image
                    src="/logo/logo.png"
                    alt="MediaCraft"
                    width={3914}
                    height={1138}
                    sizes="80px"
                    className="h-auto w-12"
                  />
                </div>
                <ArrowRight size={16} className="shrink-0 text-brand-red" aria-hidden />
                <h3 className="font-display text-sm leading-tight text-white">
                  {t(`items.${activeSvc.id}.title`)}
                </h3>
              </div>

              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/85">
                {t(`items.${activeSvc.id}.description`)}
              </p>

              <div className="mt-2.5 flex items-center justify-between gap-3">
                <span className="font-display text-xs tracking-[0.14em] text-white/55">
                  {pad(active + 1)} — {pad(N)}
                </span>
                <button
                  type="button"
                  onClick={() => goTo(active + 1)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-3.5 py-1.5 text-sm font-medium text-white"
                >
                  {t("next")}
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
