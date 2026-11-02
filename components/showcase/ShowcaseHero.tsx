"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/config/i18n";
import { buttonVariants } from "@/components/ui/Button";
import { useCycledIndex } from "@/hooks/useCycledIndex";
import { usePageLoadSeed, pickStablePhoto } from "@/hooks/usePageLoadSeed";
import { cn } from "@/lib/utils";
import { SandHeadline } from "./SandHeadline";

const WORD_MS = 5200;
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
 * Events, Conteúdos/Content — confirmed in messages/*.json) — indexed
 * rather than matched by (translated) word. `undefined` for a theme with
 * no photo yet; the background just stays the plain wash for it
 * (2026-10-22: "o que faltar deixa em branco"). */
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
  ["/images/home-services/events-1.jpg", "/images/home-services/events-2.jpg"],
  ["/images/home-services/content.jpg"],
];

export function ShowcaseHero() {
  const t = useTranslations("showcase");
  const tHero = useTranslations("hero");
  const pillars = useMemo(() => t.raw("pillars") as string[], [t]);
  const [hovered, setHovered] = useState(false);
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
  const active = useCycledIndex(pillars.length, WORD_MS, hovered || videoPhase !== "done");

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
    <section className="relative flex min-h-[calc(100vh-5rem)] flex-col items-center justify-start overflow-hidden bg-paper px-6 pt-10 pb-16 text-center sm:justify-center sm:py-24">
      {/* The themed photo behind everything, dimmed a bit so the plain
       * text below stays readable on its own (2026-10-23 correction:
       * "isso aqui não era para fazer acender... podes diminuir a
       * visibilidade das imagens, ofuscá-las um pouco" — the glow/stroke
       * treatment is gone; this wash is what carries legibility now,
       * same role the hero's original gradient always had). */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {PILLAR_PHOTOS.map((images, i) =>
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
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 90% at 50% -10%, rgba(255,255,255,0.72) 0%, rgba(246,247,249,0.56) 50%, rgba(241,243,245,0.4) 100%)",
          }}
        />
      </div>

      <div className="relative flex w-full max-w-[1500px] flex-col items-center">
        <SandHeadline
          words={pillars}
          index={active}
          onHoverChange={setHovered}
          // The word sits vertically centred inside this box (canvas
          // `textBaseline: "middle"`), so a box taller than the glyphs
          // themselves reads as dead space above the word — exactly what
          // was pushing "Reputação" down on mobile (2026-10-23: "esse
          // espaço aí em cima podes remover... fazer o texto subir um
          // pouco... para o modo mobile"). Smaller box on mobile only.
          className="h-[16vh] max-h-[180px] min-h-[110px] w-full max-w-[1300px] sm:h-[22vh] sm:max-h-[240px] sm:min-h-[140px]"
        />

        <h1
          className="reveal-up mt-6 max-w-3xl font-display text-2xl leading-tight text-brand-navy sm:text-3xl"
          style={{ animationDelay: "0.1s" }}
        >
          {tHero("title")}
        </h1>

        <div
          className="reveal-up mt-8 flex flex-wrap justify-center gap-4"
          style={{ animationDelay: "0.3s" }}
        >
          <motion.span whileTap={{ scale: 0.95 }} className="inline-flex">
            {/* Ghost variant's own border (`border-line`, a near-white
             * gray) disappears against both a photo AND this hero's plain
             * fallback background — a navy-tinted border shows up as a
             * visible pill outline either way, with a frosted fill for
             * the photo case. */}
            <Link
              href="/eventos"
              className={buttonVariants(
                "ghost",
                "lg",
                "border-brand-navy/30 bg-white/40 text-brand-navy backdrop-blur-md hover:bg-white/60",
              )}
            >
              {tHero("secondaryCta")}
            </Link>
          </motion.span>
        </div>
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
    </section>
  );
}
