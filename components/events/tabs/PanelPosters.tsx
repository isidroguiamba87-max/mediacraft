"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LangSwitcher } from "@/components/layout/LangSwitcher";

export interface PosterSpeaker {
  slug: string;
  name: string;
  /** "occupation, company" — shown under the name on the poster. */
  role: string;
  occupation?: string;
  company?: string;
  photoUrl: string | null;
}

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
 * "Interveniente" popup (client design 2026-11-13): opens on a panelist
 * click — photo card on the left; name (event accent colour), role, a rule,
 * then "Painel N:" + title for every panel they're on. Shows only what
 * Pulse has (no bio field exists). No profile page any more (removed
 * 2026-11-13 at the client's request) — the popup is the speaker view.
 */
function SpeakerPopup({
  speaker,
  panels,
  onClose,
  logoUrl,
  eventTitle,
}: {
  logoUrl: string | null;
  eventTitle: string;
  speaker: PosterSpeaker;
  panels: { label: string; title: string }[];
  onClose: () => void;
}) {
  const t = useTranslations("speakersDirectory");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const role = speaker.occupation ?? speaker.role;
  const company = speaker.occupation ? speaker.company : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="speaker-popup-name">
      <button type="button" aria-label={t("close")} onClick={onClose} className="absolute inset-0 bg-brand-navy/55 backdrop-blur-[2px]" />
      <div className="reveal-up relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[1.5rem] bg-white p-6 font-body shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-10">
        {/* header like the event page: the event's logo with its name beside
            it on the left, the language flags + close on the right */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image
              <img src={logoUrl} alt="" className="h-10 w-auto max-w-[120px] shrink-0 object-contain sm:h-12" />
            )}
            <span className="max-w-[16rem] text-xs leading-tight font-bold text-brand-navy uppercase sm:text-sm">
              {eventTitle}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LangSwitcher />
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              autoFocus
              className="grid h-9 w-9 place-items-center rounded-full text-slate transition-colors hover:bg-paper-2 hover:text-brand-navy"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <p className="mt-6 inline-block border-b-[1.5px] border-brand-red pr-10 pb-1.5 text-lg font-bold tracking-wide text-brand-red uppercase sm:text-xl">
          {t("speakerTitle")}
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-center sm:gap-10">
          <div className="mx-auto aspect-[4/5] w-48 overflow-hidden rounded-[1.25rem] bg-paper-2 shadow-[0_14px_34px_rgba(0,27,50,0.25)] sm:w-full">
            {speaker.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media
              <img src={speaker.photoUrl} alt={speaker.name} className="h-full w-full object-cover object-top" />
            )}
          </div>

          <div>
            <h3 id="speaker-popup-name" className="text-brand-red">
              <span className="block font-body text-2xl leading-tight font-bold sm:text-3xl">{speaker.name}</span>
            </h3>
            {role && <p className="mt-2 text-base leading-snug text-brand-navy">{role}</p>}
            {company && <p className="mt-0.5 text-sm text-slate">{company}</p>}

            {panels.length > 0 && (
              <>
                <span aria-hidden className="mt-5 block h-px w-full max-w-sm bg-brand-red" />
                <ul className="mt-4 space-y-3">
                  {panels.map((p) => (
                    <li key={p.label + p.title}>
                      <p className="font-bold text-brand-red">{p.label}:</p>
                      <p className="text-base text-brand-navy">{p.title}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
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
  eventTitle,
  logoUrl,
  coverUrl,
  dateLabel,
  venueLabel,
  panels,
  partners,
}: {
  eventTitle: string;
  logoUrl: string | null;
  coverUrl: string | null;
  dateLabel: string | null;
  venueLabel: string | null;
  panels: PosterPanel[];
  partners: PosterPartner[];
}) {
  const t = useTranslations("speakersDirectory");
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
          className="reveal-up relative min-w-0 flex-1 overflow-hidden rounded-[1.25rem] bg-brand-navy font-body text-white shadow-[0_18px_44px_rgba(0,27,50,0.25)]"
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
        <div className="mt-4 flex items-center justify-center gap-3">
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
          return <SpeakerPopup speaker={speaker} panels={on} onClose={closePopup} logoUrl={logoUrl} eventTitle={eventTitle} />;
        })()}
    </div>
  );
}
