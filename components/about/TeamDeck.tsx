"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { team } from "@/content/team";
import { cn, initials } from "@/lib/utils";
import { LinkedinIcon, WhatsappIcon } from "@/components/ui/SocialIcons";
import { Modal } from "@/components/ui/Modal";

/** Preview length (chars) shown inline before a "read more" is needed —
 * short enough that a long bio (Linda, Vanessa) never pushes the portrait
 * ribbon far down the page and reads as if it were blocking it. */
const BIO_PREVIEW_LENGTH = 180;

const COUNT = team.length;
const START = Math.floor(COUNT / 2);
const SPAN = 2; // portraits shown each side of the centred one
const AUTO_MS = 5000;

const mod = (n: number) => ((n % COUNT) + COUNT) % COUNT;

/**
 * "A nossa equipa" — an endless ribbon of portraits (drag, wheel, arrows,
 * ←/→, and it auto-advances). The strip loops: every member sits at its
 * nearest cyclic offset from the centre, so pulling from either side keeps
 * bringing faces round for ever. The centred person's full story opens in the
 * panel on the left; clicking any portrait brings that person to the centre.
 *
 * `active` is unbounded — the shown member is `team[mod(active)]`. First
 * render is deterministic (centre = START), so no hydration guard; card
 * motion is a plain CSS transition, disabled under reduced motion.
 */
export function TeamDeck() {
  const t = useTranslations("team.members");
  const tDeck = useTranslations("team");
  const reduce = useReducedMotion();

  const [active, setActive] = useState(START);
  const [paused, setPaused] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const wheelLock = useRef(0);
  const dragFrom = useRef<number | null>(null);

  // Every path that moves `active` also closes the full-bio popup, so it
  // never shows stale content once a different person is centred (autoplay,
  // arrow keys, wheel/drag, or picking another portrait).
  const go = useCallback((dir: number) => {
    setBioOpen(false);
    setActive((a) => a + dir);
  }, []);

  const jumpTo = useCallback((realIdx: number) => {
    setBioOpen(false);
    setActive((a) => {
      let d = mod(realIdx - mod(a));
      if (d > COUNT / 2) d -= COUNT;
      return a + d;
    });
  }, []);

  useEffect(() => {
    if (reduce || paused) return;
    const id = setInterval(() => {
      setBioOpen(false);
      setActive((a) => a + 1);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [reduce, paused]);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const now = Date.now();
      if (now - wheelLock.current < 320) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 6) return;
      wheelLock.current = now;
      go(d > 0 ? 1 : -1);
    },
    [go],
  );

  const realIdx = mod(active);
  const member = team[realIdx];
  const hasBio = t.has(`${member.id}.bio`);
  const bio = hasBio ? t(`${member.id}.bio`) : "";
  const bioParagraphs = hasBio ? bio.split("\n\n") : [];
  const firstParagraph = bioParagraphs[0] ?? "";
  const needsExpand = hasBio && (bioParagraphs.length > 1 || firstParagraph.length > BIO_PREVIEW_LENGTH);
  const preview = needsExpand
    ? `${firstParagraph.slice(0, BIO_PREVIEW_LENGTH).trimEnd()}…`
    : firstParagraph;

  return (
    <div
      className="team-deck relative mt-14 overflow-hidden rounded-3xl px-4 py-8 sm:px-8 sm:py-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid gap-4 sm:gap-10 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:items-center lg:gap-14">
        {/* ---------- left: the centred person's story ---------- */}
        <div className="order-2 lg:order-1">
          <div key={member.id} className="reveal-up">
            <h3 className="font-display text-2xl leading-tight text-brand-navy sm:text-3xl">
              {member.name}
            </h3>
            <p className="mt-2 font-mono text-xs tracking-wide text-slate">
              {t(`${member.id}.role`)}
            </p>

            {hasBio && (
              <div className="mt-5 space-y-3 text-sm leading-relaxed text-slate">
                <p>{preview}</p>
              </div>
            )}

            {needsExpand && (
              <button
                type="button"
                onClick={() => setBioOpen(true)}
                className="mt-2 text-sm font-medium text-brand-red hover:underline"
              >
                {tDeck("readMore")}
              </button>
            )}

            <ContactRow member={member} className="mt-6 justify-start" />
          </div>
        </div>

        {/* ---------- right: the endless portrait ribbon ---------- */}
        <div className="relative order-1 overflow-hidden lg:order-2">
          <div
            role="group"
            aria-roledescription="carrossel"
            aria-label={tDeck("title")}
            tabIndex={0}
            onWheel={onWheel}
            onPointerDown={(e) => (dragFrom.current = e.clientX)}
            onPointerUp={(e) => {
              if (dragFrom.current == null) return;
              const dx = e.clientX - dragFrom.current;
              dragFrom.current = null;
              if (Math.abs(dx) > 44) go(dx < 0 ? 1 : -1);
            }}
            onPointerLeave={() => (dragFrom.current = null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                go(1);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                go(-1);
              }
            }}
            className="relative mx-auto h-[320px] cursor-grab touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-brand-red active:cursor-grabbing sm:h-[440px] md:h-[520px]"
          >
            {team.map((m, i) => {
              let off = mod(i - active);
              if (off > COUNT / 2) off -= COUNT;
              const abs = Math.abs(off);
              const shown = abs <= SPAN;
              const isActive = off === 0;
              const scale = isActive ? 1 : abs === 1 ? 0.8 : 0.62;
              const shiftY = isActive ? 0 : 18 + abs * 10;
              const opacity = !shown
                ? 0
                : isActive
                  ? 1
                  : abs === 1
                    ? 0.5
                    : 0.22;

              return (
                <article
                  key={m.id}
                  aria-hidden={!isActive}
                  onClick={() => {
                    if (shown && !isActive) jumpTo(i);
                  }}
                  style={{
                    transform: `translate(-50%, -50%) translateX(calc(${off} * 56%)) translateY(${shiftY}px) scale(${scale})`,
                    opacity,
                    // Capped below the sticky header's z-30 (globals: Header.tsx)
                    // so the centred card can never out-stack it, even if this
                    // section's overflow-clipping is ever relaxed.
                    zIndex: 20 - abs,
                    pointerEvents: shown ? "auto" : "none",
                  }}
                  className={cn(
                    "absolute top-1/2 left-1/2 w-56 sm:w-72",
                    !reduce &&
                      "transition-[transform,opacity] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                    shown && !isActive && "cursor-pointer",
                  )}
                >
                  <div
                    className={cn(
                      "relative aspect-[3/4] overflow-hidden rounded-2xl border shadow-brand transition-colors duration-500",
                      isActive ? "border-brand-red" : "border-line",
                    )}
                  >
                    {m.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.photo}
                        alt={isActive ? m.name : ""}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center bg-brand-navy">
                        <span className="font-display text-5xl text-white/85">
                          {initials(m.name)}
                        </span>
                      </div>
                    )}

                    <span
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
                    />

                    {abs <= 1 && (
                      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-left">
                        <b className="font-display text-base leading-tight font-semibold text-white">
                          {m.name}
                        </b>
                        <small className="line-clamp-2 font-mono text-[10px] leading-snug tracking-wide text-white/70">
                          {t(`${m.id}.role`)}
                        </small>
                      </span>
                    )}

                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute bottom-0 left-0 h-1 w-16 bg-brand-red"
                      />
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* controls */}
          <div className="mx-auto mt-3 flex items-center justify-center gap-4 sm:mt-8">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Anterior"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-brand-navy transition-colors hover:border-brand-red hover:text-brand-red"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Seguinte"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-brand-navy transition-colors hover:border-brand-red hover:text-brand-red"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <Modal open={bioOpen} onClose={() => setBioOpen(false)} title={member.name} className="max-w-3xl">
        <div className="grid gap-6 sm:grid-cols-[1fr_11rem] sm:items-start">
          <div className="order-2 sm:order-1">
            <p className="font-mono text-xs tracking-wide text-slate">{t(`${member.id}.role`)}</p>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate">
              {bioParagraphs.map((para, k) => (
                <p key={k}>{para}</p>
              ))}
            </div>
            <ContactRow member={member} className="mt-6 justify-start" />
          </div>

          <div className="order-1 aspect-[3/4] w-32 overflow-hidden rounded-2xl border border-line sm:order-2 sm:w-full">
            {member.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center bg-brand-navy">
                <span className="font-display text-3xl text-white/85">{initials(member.name)}</span>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ContactRow({
  member,
  className,
}: {
  member: (typeof team)[number];
  className?: string;
}) {
  if (!member.linkedin && !member.email && !member.whatsapp) return null;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {member.linkedin && (
        <a
          href={member.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="grid h-9 w-9 place-items-center rounded-full border border-line text-slate transition-colors hover:text-brand-red"
        >
          <LinkedinIcon size={15} />
        </a>
      )}
      {member.whatsapp && (
        <a
          href={member.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="grid h-9 w-9 place-items-center rounded-full border border-line text-slate transition-colors hover:text-brand-red"
        >
          <WhatsappIcon size={15} />
        </a>
      )}
      {member.email && (
        <a
          href={`mailto:${member.email}`}
          aria-label="Email"
          className="grid h-9 w-9 place-items-center rounded-full border border-line text-slate transition-colors hover:text-brand-red"
        >
          <Mail size={15} />
        </a>
      )}
    </div>
  );
}
