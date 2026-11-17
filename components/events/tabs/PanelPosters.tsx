"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useRouter } from "@/config/i18n";
import { SpeakerPopup, type PopupSpeaker } from "./SpeakerPopup";

export type PosterSpeaker = PopupSpeaker;

export interface PosterPanel {
  key: string;
  /** "Painel 3" / "Outros oradores". */
  label: string;
  title: string;
  speakers: PosterSpeaker[];
}

export interface PosterPartner {
  name: string;
  logoUrl: string;
  link: string | null;
}

/** Rows of 5, the remainder on the last (centred) row — client, 2026-11-13:
 * "até se possível 5" (6 → 5·1, 8 → 5·3, 13 → 5·5·3). */
function balancedRows<T>(items: T[], max = 5): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += max) out.push(items.slice(i, i + max));
  return out;
}

/**
 * "Painéis & Sessões" as posters (client design 2026-11-13): one slide per
 * panel (agenda session with speakers), laid out like the event's own panel
 * artwork — the event cover under its shadow, the event logo + name top
 * left, dates/venue top right, "PAINEL N" + the panel title, the panelists
 * in balanced rows of up to 5, and the event's partners along the foot.
 * Side arrows (and ←/→) move to the next/previous panel; no filter pills.
 * Each panelist opens their profile page, as before.
 */
export function PanelPosters({
  eventId,
  eventTitle,
  logoUrl,
  coverUrl,
  dateLabel,
  venueLabel,
  panels,
  partners,
}: {
  eventId: string;
  eventTitle: string;
  logoUrl: string | null;
  coverUrl: string | null;
  dateLabel: string | null;
  venueLabel: string | null;
  panels: PosterPanel[];
  partners: PosterPartner[];
}) {
  const t = useTranslations("speakersDirectory");
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const closePopup = useCallback(() => setOpenSlug(null), []);
  const count = panels.length;
  const go = useCallback((d: number) => setIndex((i) => (((i + d) % count) + count) % count), [count]);

  useEffect(() => {
    if (count <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (document.querySelector('[aria-labelledby="speaker-popup-name"]')) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, go]);

  if (count === 0) return <p className="text-sm text-slate">{t("empty")}</p>;
  const panel = panels[Math.min(index, count - 1)];
  const rows = balancedRows(panel.speakers);
  // "Outros oradores" isn't a real session — it has no panel page.
  const panelHref = panel.key === "__others" ? null : `/eventos/${eventId}/paineis/${encodeURIComponent(panel.key)}`;
  // Anywhere on the poster opens the panel page (client 2026-11-17) —
  // except the panelists themselves (they open their popup) and the
  // partners' logo links, which keep their own behaviour.
  const onPosterClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!panelHref) return;
    if ((e.target as HTMLElement).closest("button, a")) return;
    if (window.getSelection()?.toString()) return;
    router.push(panelHref);
  };

  const arrow =
    "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-red text-white shadow-md transition-colors hover:bg-brand-red-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:opacity-40";

  return (
    <div aria-roledescription="carousel" aria-label={t("panelsTitle")}>
      <div className="flex items-center gap-3 sm:gap-5">
        {count > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label={t("prevPanel")} className={cn(arrow, "hidden sm:grid")}>
            <ChevronLeft className="h-6 w-6" strokeWidth={2.6} />
          </button>
        )}

        <article
          key={panel.key}
          aria-roledescription="slide"
          aria-label={`${panel.label}: ${panel.title}`}
          onClick={onPosterClick}
          className={cn(
            "reveal-up relative min-w-0 flex-1 overflow-hidden rounded-[1.25rem] bg-brand-navy font-body text-white shadow-[0_18px_44px_rgba(0,27,50,0.25)]",
            panelHref && "cursor-pointer transition-shadow hover:shadow-[0_22px_52px_rgba(0,27,50,0.35)]",
          )}
        >
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- remote Pulse / Supabase media
            <img src={coverUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          )}
          <span
            aria-hidden
            className="absolute inset-0"
            style={{ background: "var(--event-overlay, rgb(0 27 50 / 0.6))" }}
          />
          <span aria-hidden className="absolute inset-0 bg-black/25" />

          <div className="relative flex flex-col gap-5 p-4 sm:gap-6 sm:p-7 lg:p-9">
            {/* top: logo + name · panel label + title · dates/venue */}
            <div className="grid items-start gap-4 lg:grid-cols-[1fr_auto_1fr]">
              <div className="flex items-center gap-3">
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image
                  <img src={logoUrl} alt="" className="h-10 w-auto max-w-[120px] object-contain sm:h-12" />
                )}
                <span className="max-w-[16rem] text-xs leading-tight font-bold uppercase sm:text-sm">{eventTitle}</span>
              </div>

              <div className="text-center lg:max-w-xl">
                <p className="text-xs font-bold tracking-[0.18em] text-[#F2C14E] uppercase sm:text-sm">{panel.label}</p>
                <h3 className="mt-1 text-white">
                  <span className="block font-body text-lg leading-tight font-bold text-balance uppercase sm:text-2xl">
                    {panel.title}
                  </span>
                </h3>
                {panelHref && (
                  <Link
                    href={panelHref}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold tracking-wide text-[#F2C14E] uppercase underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {t("openPanel")}
                    <ChevronRight aria-hidden className="h-3.5 w-3.5" strokeWidth={2.6} />
                  </Link>
                )}
              </div>

              {(dateLabel || venueLabel) && (
                <div className="flex flex-col gap-1 justify-self-start rounded-xl border border-white/40 bg-white/10 px-3.5 py-2 text-xs backdrop-blur-sm sm:text-sm lg:justify-self-end">
                  {dateLabel && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays aria-hidden className="h-4 w-4 shrink-0 text-[#F2C14E]" />
                      <span className="font-bold uppercase">{dateLabel}</span>
                    </span>
                  )}
                  {venueLabel && (
                    <span className="flex items-center gap-1.5">
                      <MapPin aria-hidden className="h-4 w-4 shrink-0 text-[#F2C14E]" />
                      <span className="uppercase">{venueLabel}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* panelists — phone: an even 3-up grid (last row centred);
                sm+: rows of 5, remainder centred on the last row */}
            <ul className="grid grid-cols-6 gap-x-3 gap-y-5 sm:hidden">
              {panel.speakers.map((sp, i) => {
                // 6-column track, each tile spans 2 → 3 per row; a short last
                // row (1 or 2 tiles) is centred by starting it one or two
                // columns in.
                const n = panel.speakers.length;
                const lastRowCount = n % 3;
                const first = lastRowCount !== 0 && i === n - lastRowCount;
                const start = first ? (lastRowCount === 1 ? "col-start-3" : "col-start-2") : "";
                return (
                  <li key={sp.slug} className={`col-span-2 ${start}`}>
                    <button
                        type="button"
                        onClick={() => setOpenSlug(sp.slug)}
                        aria-haspopup="dialog"
                        className="group block w-full text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <span className="relative block aspect-[4/5] overflow-hidden rounded-xl border border-white/25 bg-[#001833] shadow-md">
                          {sp.photoUrl && (
                            // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media
                            <img
                              src={sp.photoUrl}
                              alt=""
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                            />
                          )}
                        </span>
                        <span className="mt-2 block text-[11px] leading-tight font-extrabold tracking-wide break-words text-[#F2C14E] uppercase sm:text-xs">
                          {sp.name}
                        </span>
                        {sp.role && (
                          <span className="mt-0.5 line-clamp-2 block text-[9px] leading-tight font-semibold text-white/90 uppercase sm:text-[10px]">
                            {sp.role}
                          </span>
                        )}
                      </button>
                  </li>
                );
              })}
            </ul>
            <div className="hidden flex-col gap-5 sm:flex">
              {rows.map((row, r) => (
                <ul key={r} className="flex flex-wrap justify-center gap-4">
                  {row.map((sp) => (
                    <li key={sp.slug} className="w-[18%] max-w-[9.5rem]">
                      <button
                        type="button"
                        onClick={() => setOpenSlug(sp.slug)}
                        aria-haspopup="dialog"
                        className="group block w-full text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <span className="relative block aspect-[4/5] overflow-hidden rounded-xl border border-white/25 bg-[#001833] shadow-md">
                          {sp.photoUrl && (
                            // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media
                            <img
                              src={sp.photoUrl}
                              alt=""
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                            />
                          )}
                        </span>
                        <span className="mt-2 block text-[11px] leading-tight font-extrabold tracking-wide break-words text-[#F2C14E] uppercase sm:text-xs">
                          {sp.name}
                        </span>
                        {sp.role && (
                          <span className="mt-0.5 line-clamp-2 block text-[9px] leading-tight font-semibold text-white/90 uppercase sm:text-[10px]">
                            {sp.role}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
            </div>

            {/* partners strip */}
            {partners.length > 0 && (
              <div className="rounded-xl bg-white px-4 py-3">
                <p className="mb-2 text-center text-[10px] font-bold tracking-[0.2em] text-brand-navy uppercase">
                  {t("partners")}
                </p>
                <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
                  {partners.map((p) => {
                    const img = (
                      // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media
                      <img src={p.logoUrl} alt={p.name} loading="lazy" className="h-7 w-auto max-w-[110px] object-contain sm:h-9" />
                    );
                    return (
                      <li key={`${p.name}-${p.logoUrl}`}>
                        {p.link ? (
                          <a href={p.link} target="_blank" rel="noopener noreferrer">
                            {img}
                          </a>
                        ) : (
                          img
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </article>

        {count > 1 && (
          <button type="button" onClick={() => go(1)} aria-label={t("nextPanel")} className={cn(arrow, "hidden sm:grid")}>
            <ChevronRight className="h-6 w-6" strokeWidth={2.6} />
          </button>
        )}
      </div>

      {count > 1 && (
        <div className="-mt-1 flex items-center justify-center gap-3 sm:mt-4">
          <button type="button" onClick={() => go(-1)} aria-label={t("prevPanel")} className={cn(arrow, "sm:hidden")}>
            <ChevronLeft className="h-6 w-6" strokeWidth={2.6} />
          </button>
          <span className="font-body text-sm font-bold text-brand-navy tabular-nums">
            {index + 1} / {count}
          </span>
          <button type="button" onClick={() => go(1)} aria-label={t("nextPanel")} className={cn(arrow, "sm:hidden")}>
            <ChevronRight className="h-6 w-6" strokeWidth={2.6} />
          </button>
        </div>
      )}

      {openSlug &&
        (() => {
          // Only the panel the speaker was clicked on (the slide on screen —
          // it can't change while the popup is open), never the list of
          // every panel they appear in (client, 2026-11-13).
          const speaker = panel.speakers.find((sp) => sp.slug === openSlug);
          if (!speaker) return null;
          const on = panel.key === "__others" ? [] : [{ label: panel.label, title: panel.title }];
          return <SpeakerPopup speaker={speaker} sessions={on} onClose={closePopup} logoUrl={logoUrl} eventTitle={eventTitle} />;
        })()}
    </div>
  );
}
