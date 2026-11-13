"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/Button";
import { usePageLoadSeed, pickStablePhoto } from "@/hooks/usePageLoadSeed";
import { cn } from "@/lib/utils";

// One-page brief (2026-11-11): ~6 s per panel, loop, Eventos → Comunicação
// → Reputação (the intro video only plays once, before the first loop).
const WORD_MS = 6000;
/** Display order, as indexes into the i18n `showcase.pillars` arrays
 * (stored Comunicação, Reputação, Eventos). */
const ORDER = [2, 0, 1] as const;
/** Each panel's button, same display order: Eventos → "Explorar eventos"
 * (the #eventos section), the other two → "Saiba mais" (#o-que-fazemos). */
const PANEL_CTA: { key: "secondaryCta" | "learnMore"; href: string }[] = [
  { key: "secondaryCta", href: "#eventos" },
  { key: "learnMore", href: "#o-que-fazemos" },
  { key: "learnMore", href: "#o-que-fazemos" },
];
const INTRO_VIDEO_SRC = "/video/hero-intro.mp4";
// Shot specifically for a tall/portrait screen (confirmed: vertical
// framing, not just the desktop clip letterboxed) — picked over the
// desktop source below `sm`'s breakpoint (640px) via the <source media>
// query, same cutoff the object-fit split a few lines down already used.
// The browser itself decides which one to fetch, so a visitor never
// downloads both.
const INTRO_VIDEO_SRC_MOBILE = "/video/hero-intro-mobile.mp4";
const MOBILE_BREAKPOINT_QUERY = "(max-width: 639px)";
// How long before the video's own end the crossfade into the normal hero
// starts (2026-10-26: "quando começa a desaparecer logo aparece o
// primeiro título... de forma suave" — the handoff needs to be under way
// before the video actually finishes, not triggered only once it does).
const INTRO_FADE_SECONDS = 1.2;

/** Chrome occasionally rejects `play()` with "video-only background media
 * was paused to save power" (confirmed live) even for a call made
 * directly inside a click handler — a known, usually transient Chrome
 * quirk. One short retry clears it in practice; only give up and fall
 * through to the plain hero after that second attempt also fails. */
async function playVideo(video: HTMLVideoElement, onGiveUp: () => void) {
  try {
    await video.play();
  } catch {
    await new Promise((r) => setTimeout(r, 200));
    try {
      await video.play();
    } catch {
      onGiveUp();
    }
  }
}

/** One photo set per `showcase.pillars` entry, same order across every
 * locale (Comunicação/Communication, Reputação/Reputation, Eventos/
 * Events — confirmed in messages/*.json) — indexed rather than matched
 * by (translated) word. `undefined` for a theme with no photo yet; the
 * background just stays the plain wash for it (2026-10-22: "o que
 * faltar deixa em branco").
 *
 * Only 3 pillars now — "Conteúdos" was dropped (2026-11-11: "só
 * ficamos com três títulos... Eventos, Comunicação e Reputação, o
 * outro remova"); see messages/*.json's `showcase.pillars`/
 * `pillarDescriptions`, which dropped their 4th entry the same way. */
const PILLAR_PHOTOS: (string[] | undefined)[] = [
  // 2026-10-27: swapped to a different photo for the hero specifically
  // ("essa deve ser a imagem a ser usada agora com o título Comunicação
  // na tela de início") — `content/services.ts`'s own "Comunicação" card
  // further down the page keeps the original `communication.jpg`, this
  // is a separate file so that section is unaffected.
  ["/images/home-services/communication-hero.jpg"],
  // 2026-10-31: "podes fazer o uso da imagem de reputação que está aqui no
  // projeto" — fills what used to be the one blank pillar.
  ["/images/home-services/Reputation.png"],
  // 2026-11-11: swapped to the audience/stage photo specifically matched
  // to the new dark-overlay hero design ("esse aqui deve ser o novo
  // visual da tela de início") — events-1/2.jpg stay as they were,
  // content/services.ts's own "Eventos" card further down the page
  // keeps using those, unaffected by this hero-only change.
  ["/images/services/events.jpg"],
];

export function ShowcaseHero() {
  const t = useTranslations("showcase");
  const tHero = useTranslations("hero");
  const pillars = useMemo(() => {
    const raw = t.raw("pillars") as string[];
    return ORDER.map((i) => raw[i]).filter((w): w is string => !!w);
  }, [t]);
  // One paragraph per pillar, same index as PILLAR_PHOTOS/pillars — swaps
  // in alongside the photo and headline as the cycle advances, replacing
  // the single fixed tagline the hero used to show regardless of theme.
  const pillarDescriptions = useMemo(() => {
    const raw = t.raw("pillarDescriptions") as string[];
    return ORDER.map((i) => raw[i] ?? "");
  }, [t]);
  const photos = ORDER.map((i) => PILLAR_PHOTOS[i]);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reduceMotion = useReducedMotion();
  const pageLoadSeed = usePageLoadSeed();

  // The branded intro video, shown once before the sand-headline word
  // cycle begins (2026-10-26: "sempre que uma pessoa abrir a página deve
  // ver um vídeo, só depois disso é que muda para os 4 temas"). Starts
  // "playing" so the very first paint already hides the hero behind it
  // (server and client agree, no reduced-motion special-case needed at
  // this point — see the effect below for that).
  const [videoPhase, setVideoPhase] = useState<"playing" | "fading" | "done">("playing");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Skip the video outright for prefers-reduced-motion — a render-time
  // adjustment (React's own pattern for "derive state from a changing
  // value") rather than a `useEffect` calling `setState` directly, same
  // workaround this project already uses elsewhere (e.g. ConnectModal's
  // `prevOpen` comparison) for the `set-state-in-effect` lint rule.
  const [prevReduceMotion, setPrevReduceMotion] = useState(reduceMotion);
  if (reduceMotion !== prevReduceMotion) {
    setPrevReduceMotion(reduceMotion);
    if (reduceMotion && videoPhase !== "done") setVideoPhase("done");
  }

  // The word cycle freezes while the pointer rests on the word, same as
  // while the intro video is still showing — the first pillar a visitor
  // sees should always be the actual first one, not whichever the timer
  // had already ticked to behind the video (2026-10-26: "logo aparece o
  // primeiro título").
  const [active, setActive] = useState(0);
  const paused = hovered || focused || videoPhase !== "done" || !!reduceMotion;
  // Restarted on every change of `active` (auto or a dot click), so a jump
  // always gets a full 6 s before the next panel. Cleared on unmount.
  useEffect(() => {
    if (paused || pillars.length <= 1) return;
    const id = setTimeout(() => setActive((v) => (v + 1) % pillars.length), WORD_MS);
    return () => clearTimeout(id);
  }, [paused, active, pillars.length]);

  // Autoplay (muted) on mount — tried ourselves rather than relying only
  // on the `autoPlay` attribute, so a browser that blocks it still falls
  // through to the normal hero instead of leaving a frozen, unplayed
  // video covering everything. The `setState` lives inside the promise's
  // rejection callback, not the effect body itself, which is the
  // "subscribe to an external system, setState in its callback" shape the
  // lint rule's own description allows.
  useEffect(() => {
    if (reduceMotion || !videoRef.current) return;
    playVideo(videoRef.current, () => setVideoPhase("done"));
  }, [reduceMotion]);

  // The header's replay button (HeroVideoReplayButton) lives outside this
  // component's tree entirely — a plain window event is the simplest way
  // to signal "play it again" across that boundary. The video element
  // itself is never unmounted (see the render below) specifically so this
  // handler's `videoRef.current` is always live and so Chrome doesn't
  // treat a freshly-created element as unengaged "background media" and
  // immediately suspend it again (confirmed live: a remount-based replay
  // hit "AbortError: ...video-only background media was paused to save
  // power" on the second play) — reusing the same element and just
  // resetting its position plays reliably instead.
  useEffect(() => {
    function onReplay() {
      const v = videoRef.current;
      if (!v) return;
      setVideoPhase("playing");
      v.currentTime = 0;
      playVideo(v, () => setVideoPhase("done"));
    }
    window.addEventListener("mediacraft:replay-hero-video", onReplay);
    return () => window.removeEventListener("mediacraft:replay-hero-video", onReplay);
  }, []);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={tHero("carousel")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      className="flex min-h-[calc(100svh-5rem)] flex-col bg-paper px-6 pb-6 sm:px-10 sm:pb-10 lg:px-16 lg:pb-16"
    >
      {/* The card itself: rounded corners + overflow-hidden clip the photo
       * underneath to match, white margin around it coming from the
       * section's own padding above (2026-11-11: "olhe as bordas
       * brancas... tem aqui a imagem com a frase no centro" — the hero
       * isn't full-bleed in the new design, it's an inset card;
       * "esse retângulo da foto está muito grande... ter bordas brancas
       * mais grandes" — margin bumped up further so the card itself
       * reads smaller against the white page background. No top padding
       * though — "temos na parte da navbar a parte branca que eu quero
       * para a parte de cima... apenas deixa isso nos lados esquerdo e
       * direito": the header's own white background already is the top
       * margin, so the card starts right under it, flush, with the
       * white gutter only left/right/bottom). */}
      <div className="relative flex flex-1 flex-col items-center justify-start overflow-hidden rounded-[2rem] bg-brand-navy px-6 pt-10 pb-16 text-center sm:justify-center sm:py-24">
      {/* The themed photo behind everything, with a flat dark wash over it
       * so white text stays legible regardless of what's in the photo
       * (2026-11-11: "esse aqui deve ser o novo visual da tela de início" —
       * replaces the previous light wash + navy text treatment; same
       * dark-overlay-over-photo pattern EventHero already uses). */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {photos.map((images, i) =>
          images && images.length > 0 ? (
            <Image
              key={i}
              src={pickStablePhoto(images, pageLoadSeed)}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              // Stage/conference photos tend to put their busiest content
              // (screens, banners) in the upper-middle band — exactly
              // where the title/subtitle sit. Favoring the lower portion
              // puts calmer content (floor, crowd) behind the text instead.
              style={{ objectPosition: "50% 68%" }}
              className={cn(
                "object-cover transition-opacity duration-[1200ms] ease-out",
                active === i ? "opacity-100" : "opacity-0",
              )}
            />
          ) : null,
        )}
        <div className="absolute inset-0 bg-brand-navy/70" />
      </div>

      <div className="relative flex w-full max-w-[1500px] flex-col items-center">
        {/* Plain bold word, cross-fading between pillars — replaces the
         * sand-particle canvas (SandHeadline) for this redesign
         * (2026-11-11: "tem uma coisa as letras... mostra exatamente como
         * deve ficar" — the mockup's title is clean solid type, not a
         * grain texture). Stacked absolutely so the crossfade doesn't
         * reflow layout; hover still pauses the cycle, same as before. */}
        <div className="relative flex h-[16vh] max-h-[190px] min-h-[100px] w-full max-w-[1300px] items-center justify-center sm:h-[24vh] sm:max-h-[270px] sm:min-h-[150px]">
          <span className="sr-only">{pillars.join(", ")}</span>
          {pillars.map((word, i) => (
            <span
              key={word}
              aria-hidden={active !== i}
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              className={cn(
                "absolute text-6xl font-extrabold tracking-tight text-white uppercase transition-opacity duration-[800ms] ease-out sm:text-7xl lg:text-8xl",
                active === i ? "opacity-100" : "opacity-0",
              )}
            >
              {word}
            </span>
          ))}
        </div>

        {/* One paragraph per pillar (pillarDescriptions[active]) — replaces
         * the single fixed tagline that used to show here regardless of
         * which theme was active. Still the page's one real <h1>, just
         * longer copy now; same text content for every visitor and for
         * search engines regardless of which pillar happened to be
         * animating in when the page was crawled. */}
        <h1
          className="reveal-up mt-6 max-w-2xl text-lg leading-relaxed font-normal text-white/90 sm:text-xl"
          style={{ animationDelay: "0.1s", fontFamily: "Arial, Helvetica, sans-serif" }}
        >
          {pillarDescriptions[active]}
        </h1>

        <div
          className="reveal-up mt-8 flex flex-wrap justify-center gap-4"
          style={{ animationDelay: "0.3s" }}
        >
          <motion.span whileTap={{ scale: 0.95 }} className="inline-flex">
            <a
              href={PANEL_CTA[active]?.href ?? "#eventos"}
              className={buttonVariants(
                "ghost",
                "lg",
                "border-transparent bg-white text-brand-navy uppercase tracking-wide hover:bg-white/90",
              )}
            >
              {tHero(PANEL_CTA[active]?.key ?? "secondaryCta")}
            </a>
          </motion.span>
        </div>
      </div>

      {/* segmented indicators — jump straight to any panel */}
      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center gap-2 sm:bottom-8">
        {pillars.map((word, i) => (
          <button
            key={word}
            type="button"
            onClick={() => setActive(i)}
            aria-label={tHero("goTo", { n: i + 1 })}
            aria-current={active === i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              active === i ? "w-10 bg-brand-red" : "w-5 bg-white/60 hover:bg-white",
            )}
          />
        ))}
      </div>

      {!reduceMotion && (
        // Solid navy backdrop behind the video, not just the video itself
        // — the mobile source below is its own vertical clip so
        // `object-cover` fills the screen cleanly either way, but this
        // still covers the brief gap before the chosen <source> has
        // enough data to paint a frame.
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 bg-brand-navy transition-opacity duration-[1200ms] ease-out",
            videoPhase === "playing" ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (videoPhase === "playing" && v.duration && v.currentTime >= v.duration - INTRO_FADE_SECONDS) {
                setVideoPhase("fading");
              }
            }}
            onEnded={() => setVideoPhase("done")}
            className="h-full w-full object-cover"
          >
            {/* The browser picks the first matching <source> at load
             * time and only fetches that one — a visitor never
             * downloads both clips. */}
            <source src={INTRO_VIDEO_SRC_MOBILE} media={MOBILE_BREAKPOINT_QUERY} />
            <source src={INTRO_VIDEO_SRC} />
          </video>
        </div>
      )}
      </div>
    </section>
  );
}
