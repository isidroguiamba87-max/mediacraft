"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
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
      className="team-deck relative overflow-hidden pt-8 pb-0 sm:pt-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid gap-4 sm:gap-10 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:items-center lg:gap-14">
        {/* ---------- left: the centred person's story ---------- */}
        <div className="order-2 lg:order-1">
          <div key={member.id} className="reveal-up">
            <h3 className="font-body text-2xl leading-tight font-medium text-brand-red sm:text-[1.75rem]">
              {member.name}
            </h3>
            <p className="mt-1 font-body text-base text-slate">
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

            <ContactRow member={member} className="mt-4 justify-start" />
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
            className="relative mx-auto h-[300px] cursor-grab touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-brand-red active:cursor-grabbing sm:h-[360px] md:h-[380px]"
          >
            {team.map((m, i) => {
              let off = mod(i - active);
              if (off > COUNT / 2) off -= COUNT;
              const abs = Math.abs(off);
              const shown = abs <= SPAN;
              const isActive = off === 0;
              // Hovering a faded side card brings it forward so its photo
              // and name read clearly without having to click it to the
              // centre first ("ver as pessoas / as fotos por interação").
              const isHovered = shown && !isActive && hoveredIdx === i;
              const scale = isActive ? 1 : isHovered ? 0.94 : abs === 1 ? 0.86 : 0.76;
              const shiftY = isActive ? 0 : isHovered ? 4 : 10 + abs * 6;
              const opacity = !shown
                ? 0
                : isActive || isHovered
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
                  onMouseEnter={() => shown && !isActive && setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx((cur) => (cur === i ? null : cur))}
                  style={{
                    transform: `translate(-50%, -50%) translateX(calc(${off} * 44%)) translateY(${shiftY}px) scale(${scale})`,
                    opacity,
                    // Capped below the sticky header's z-30 (globals: Header.tsx)
                    // so the centred card can never out-stack it, even if this
                    // section's overflow-clipping is ever relaxed.
                    zIndex: isHovered ? 19 : 20 - abs,
                    pointerEvents: shown ? "auto" : "none",
                  }}
                  className={cn(
                    "absolute top-1/2 left-1/2 w-56 sm:w-72",
                    !reduce &&
                      "transition-[transform,opacity] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                    shown && !isActive && "cursor-pointer",
                  )}
                >
                  {/* Full-bleed portrait card: name + role sit as a white
                      overlay on a bottom scrim; the centred card gets a red
                      ring, side cards just fade back (2026-11-19 mock-up). */}
                  <div
                    className={cn(
                      "relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#d9dbe0] transition-[box-shadow,outline-color] duration-500",
                      isActive
                        ? "outline outline-2 outline-offset-2 outline-brand-red shadow-[0_10px_26px_rgba(0,0,0,0.35)]"
                        : isHovered
                          ? "outline outline-2 outline-offset-2 outline-white/70 shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
                          : "shadow-[0_6px_16px_rgba(0,0,0,0.15)]",
                    )}
                  >
                    {m.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.photo}
                        alt={isActive || isHovered ? m.name : ""}
                        className="absolute inset-0 h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center bg-brand-navy">
                        <span className="font-display text-5xl text-white/85">{initials(m.name)}</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3 text-left sm:p-4">
                      <b className="block truncate font-body text-lg leading-tight font-semibold text-white sm:text-xl">
                        {m.name}
                      </b>
                      <small className="mt-0.5 block truncate font-body text-xs text-white/80 sm:text-sm">
                        {t(`${m.id}.role`)}
                      </small>
                    </div>
                  </div>
                </article>
              );
            })}
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
          className="grid h-9 w-9 place-items-center rounded-full bg-brand-navy text-white transition-colors hover:bg-brand-red"
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
          className="grid h-9 w-9 place-items-center rounded-full bg-brand-navy text-white transition-colors hover:bg-brand-red"
        >
          <WhatsappIcon size={15} />
        </a>
      )}
      {member.email && (
        <a
          href={`mailto:${member.email}`}
          aria-label="Email"
          className="grid h-9 w-9 place-items-center rounded-full bg-brand-navy text-white transition-colors hover:bg-brand-red"
        >
          <Mail size={15} />
        </a>
      )}
    </div>
  );
}
