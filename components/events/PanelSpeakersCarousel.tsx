"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { withResolvedChannels } from "@/lib/networking/parseChannels";
import { ConnectButton } from "@/components/networking/ConnectButton";
import type { PulseSpeakerLink } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export interface CarouselSpeaker {
  name: string;
  company: string;
  occupation: string;
  photoUrl: string | null;
  links?: PulseSpeakerLink[];
}

function initials(name: string) {
  return name
    .replace(/^(s\.?\s*ex\.?ª?|dr\.?ª?|eng\.?ª?)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/** "Dia 22 · Quarta-feira" from the session's ISO date (null if unparsable). */
function useDayLabel(iso: string) {
  const locale = useLocale();
  const t = useTranslations("panel");
  if (!iso) return null;
  // Pulse sends midnight UTC ("2026-09-19T00:00:00.000Z"): read only the
  // calendar day, pinned to noon, so no timezone shifts it a day back.
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(d);
  return t("dayLabel", {
    day: d.getDate(),
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
  });
}

/**
 * "Intervenientes" inside a panel's page (client mock 2026-11-17): section
 * title with a thin rule, a day pill ("Dia 22 · Quarta-feira"), and the
 * panelists as a horizontal snap carousel of portrait cards — photo on top,
 * a white rounded footer with the name and role — with round arrows on the
 * sides. 1 card per view on phones, 2 on tablets, 3 on desktop. Arrows hide
 * when everything already fits. Keeps the `sessionId`-bound ConnectButton
 * from SessionSpeakerList so the per-session networking metric isn't lost.
 */
export function PanelSpeakersCarousel({
  eventId,
  sessionId,
  isFree,
  date,
  speakers,
}: {
  eventId: string;
  sessionId: string;
  isFree: boolean;
  date: string;
  speakers: CarouselSpeaker[];
}) {
  const t = useTranslations("panel");
  const dayLabel = useDayLabel(date);
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [measure]);

  const scroll = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 24 : el.clientWidth;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const scrollable = !(edges.start && edges.end);
  const arrow =
    "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-red text-white shadow-md transition-[background-color,opacity] hover:bg-brand-red-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:pointer-events-none disabled:opacity-30";

  return (
    <section aria-labelledby="panel-speakers-title" className="font-body">
      <h2 id="panel-speakers-title" className="w-fit border-b border-brand-red pr-6 pb-2 sm:pr-16">
        <span className="block text-xl font-extrabold tracking-wide text-brand-navy uppercase sm:text-2xl">
          {t("participants")}
        </span>
      </h2>

      {dayLabel && (
        <p className="mt-6 w-fit rounded-full border-2 border-brand-navy px-5 py-1.5 text-base font-bold text-brand-navy sm:text-lg">
          {dayLabel}
        </p>
      )}

      <div aria-roledescription="carousel" className="mt-6 flex items-center gap-3 sm:gap-5">
        {scrollable && (
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={edges.start}
            aria-label={t("prevSpeaker")}
            className={cn(arrow, "hidden sm:grid")}
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.6} />
          </button>
        )}

        <ul
          ref={trackRef}
          className={cn(
            "-my-6 flex min-w-0 flex-1 snap-x snap-mandatory gap-6 overflow-x-auto px-1 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            !scrollable && "justify-center",
          )}
        >
          {speakers.map((sp, i) => (
            <li
              key={`${sp.name}-${i}`}
              aria-roledescription="slide"
              className="w-[70%] max-w-[250px] shrink-0 snap-start sm:w-[250px]"
            >
              <article className="flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-[0_6px_20px_rgba(0,27,50,0.2)]">
                <div className="relative aspect-[5/4] bg-paper-2">
                  {sp.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media
                    <img
                      src={sp.photoUrl}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center bg-brand-navy font-display text-4xl text-white">
                      {initials(sp.name)}
                    </span>
                  )}
                </div>
                <div className="relative -mt-5 flex flex-1 flex-col items-center rounded-t-[1.25rem] bg-white px-4 pt-3 pb-4 text-center">
                  <h3 className="text-base leading-snug font-bold text-brand-navy">{sp.name}</h3>
                  {(sp.occupation || sp.company) && (
                    <p className="mt-1 text-xs leading-snug text-slate">
                      {[sp.occupation, sp.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-auto pt-3 empty:hidden">
                    <ConnectButton
                      speaker={withResolvedChannels(sp)}
                      eventId={eventId}
                      isFree={isFree}
                      source="session"
                      sessionId={sessionId}
                      variant="compact"
                    />
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>

        {scrollable && (
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={edges.end}
            aria-label={t("nextSpeaker")}
            className={cn(arrow, "hidden sm:grid")}
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2.6} />
          </button>
        )}
      </div>

      {scrollable && (
        <div className="mt-5 flex justify-center gap-3 sm:hidden">
          <button type="button" onClick={() => scroll(-1)} disabled={edges.start} aria-label={t("prevSpeaker")} className={arrow}>
            <ChevronLeft className="h-6 w-6" strokeWidth={2.6} />
          </button>
          <button type="button" onClick={() => scroll(1)} disabled={edges.end} aria-label={t("nextSpeaker")} className={arrow}>
            <ChevronRight className="h-6 w-6" strokeWidth={2.6} />
          </button>
        </div>
      )}
    </section>
  );
}
