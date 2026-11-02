"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { Link } from "@/config/i18n";
import { cn } from "@/lib/utils";
import { usePageLoadSeed } from "@/hooks/usePageLoadSeed";
import { Avatar } from "./Program";
import type { DayGroup, Panel } from "@/lib/pulse/panels";

/** "24" / "QUI" / "OUT" from an ISO date — parsed at noon UTC so no local
 * timezone can roll it back a day (the classic `new Date("2026-10-24")`
 * footgun). Mirrors the day-pill layout from the reference "Agenda"
 * project the user pointed at (2026-10-31): big date number + weekday +
 * month, not just a plain "Dia 1" button. */
function dayLabelParts(date: string, locale: string) {
  const d = Date.parse(`${date}T12:00:00Z`);
  const clean = (s: string) => s.replace(".", "").toUpperCase();
  return {
    num: date.slice(8, 10),
    weekday: clean(new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(d)),
    month: clean(new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(d)),
  };
}

/** First session's start to last session's end across a day's panels, in
 * their original (already chronological) order — a real, derived summary
 * rather than invented metadata, shown under the day's section titles the
 * same way the reference project shows a time chip under each event card. */
function timeRange(panels: Panel[]): string | null {
  const from = panels.find((p) => p.timeFrom)?.timeFrom;
  const to = [...panels].reverse().find((p) => p.timeTo)?.timeTo;
  if (!from && !to) return null;
  return [from, to].filter(Boolean).join(" – ");
}

/**
 * When the program spans more than one day, each day gets its own big
 * date-pill tab — pick "24" and only that day's sections/sessions show,
 * pick "25" and it swaps to that day's instead. A single-day program (or
 * one with no usable dates at all) skips the tabs entirely, same as
 * before this existed.
 *
 * Within a day, sessions render as a connected vertical timeline (time on
 * the left, a line+dot rail, the session card on the right) instead of a
 * grid of disconnected cards — the organization style from the reference
 * "Agenda" project (2026-10-31: "a imagem ilustra como deve estar
 * organizado o programa do evento"). Each session still links to its own
 * detail page (where the per-panel rating lives), just restyled.
 */
export function ProgramDayTabs({ eventId, days }: { eventId: string; days: DayGroup[] }) {
  const t = useTranslations("eventTabs");
  const locale = useLocale();
  const [activeIdx, setActiveIdx] = useState(0);

  // `Date.now()` returns a different value on every call, which makes a
  // bare `useSyncExternalStore` read of it violate React's "getSnapshot
  // must be cacheable" contract (confirmed live: "The result of
  // getSnapshot should be cached to avoid an infinite loop"). Reusing the
  // project's existing `usePageLoadSeed` (`performance.timeOrigin`, stable
  // for the whole page's lifetime) is day-granularity-accurate enough for
  // the "today" badge and sidesteps that entirely — same reasoning that
  // hook was already built for (ShowcaseHero/ServicesOrbit). Server
  // snapshot is 0, so nothing is ever marked "today" during SSR; the real
  // value lands on the client's first paint.
  const nowMs = usePageLoadSeed();
  const todayKey = nowMs > 0 ? new Date(nowMs).toISOString().slice(0, 10) : "";

  const multiDay = days.length > 1;
  const day = days[activeIdx] ?? days[0];

  return (
    <div className="flex flex-col gap-8">
      {multiDay && (
        <div
          role="tablist"
          aria-label={t("program")}
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3"
        >
          {days.map((d, i) => {
            const active = activeIdx === i;
            const parts = d.date ? dayLabelParts(d.date, locale) : null;
            const isToday = !!d.date && d.date === todayKey;
            return (
              <button
                key={d.date ?? i}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-brand-navy bg-brand-navy shadow-brand"
                    : "border-line bg-paper hover:border-brand-red/40",
                )}
              >
                {parts ? (
                  <>
                    <span
                      className={cn(
                        "font-display text-3xl leading-none font-bold tabular-nums",
                        active ? "text-white" : "text-brand-navy",
                      )}
                    >
                      {parts.num}
                    </span>
                    <span className="flex flex-col leading-tight">
                      <span
                        className={cn(
                          "font-mono text-[10px] font-semibold tracking-[0.14em] uppercase",
                          active ? "text-white/80" : "text-brand-red",
                        )}
                      >
                        {parts.weekday}
                      </span>
                      <span className={cn("text-xs", active ? "text-white/60" : "text-slate")}>
                        {parts.month}
                      </span>
                    </span>
                  </>
                ) : (
                  <span className={cn("text-sm font-semibold", active ? "text-white" : "text-ink")}>
                    {t("programDay", { n: i + 1 })}
                  </span>
                )}
                {isToday && (
                  <span className="absolute -top-2 right-2 rounded-full bg-brand-red px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase shadow">
                    {t("programToday")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {day.sections.map((section) => {
        const range = timeRange(section.panels);
        return (
          <div key={section.title} className="flex flex-col gap-1">
            {section.title && (
              <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-brand-red uppercase">
                {section.title}
              </p>
            )}
            {range && (
              <p className="text-xs text-slate">
                {range} · {t("programSessions", { count: section.panels.length })}
              </p>
            )}
            <ol className="relative mt-3 flex flex-col">
              {section.panels.map((panel, i) => (
                <ProgramItem
                  key={panel.key}
                  eventId={eventId}
                  panel={panel}
                  last={i === section.panels.length - 1}
                />
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

function ProgramItem({ eventId, panel, last }: { eventId: string; panel: Panel; last: boolean }) {
  const overflow = panel.speakers.length - 4;

  return (
    <li className="grid grid-cols-[3.25rem_1.5rem_1fr] gap-x-3 sm:grid-cols-[4rem_1.5rem_1fr]">
      {/* time */}
      <div className="pt-4 text-right tabular-nums">
        {panel.timeFrom && (
          <p className="text-sm leading-none font-bold text-brand-navy">{panel.timeFrom}</p>
        )}
        {panel.timeTo && <p className="mt-1 text-[11px] text-slate">{panel.timeTo}</p>}
      </div>

      {/* timeline rail */}
      <div className="relative flex justify-center">
        <span
          className={cn("absolute top-0 w-px bg-line", last ? "h-4" : "bottom-0")}
          aria-hidden
        />
        <span
          className="relative z-10 mt-4 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-brand-red bg-paper"
          aria-hidden
        />
      </div>

      {/* session card */}
      <div className="min-w-0 pb-5">
        <Link
          href={`/eventos/${eventId}/paineis/${panel.key}`}
          className="block rounded-brand border border-line bg-paper px-4 py-3.5 transition-colors hover:border-brand-red/40 hover:bg-paper-2"
        >
          {panel.rooms.length > 0 && (
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] text-slate">
              <MapPin size={12} className="shrink-0 text-brand-red" />
              {panel.rooms.map((r) => r.title).join(" · ")}
            </p>
          )}
          <p className="font-display text-base leading-snug text-brand-navy">{panel.title}</p>

          {panel.speakers.length > 0 && (
            <div className="mt-3 flex -space-x-2.5">
              {panel.speakers.slice(0, 4).map((sp, i) => (
                <Avatar key={i} photoUrl={sp.photoUrl} name={sp.name} size={32} ring />
              ))}
              {overflow > 0 && (
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-paper bg-brand-navy font-mono text-[10px] text-white">
                  +{overflow}
                </span>
              )}
            </div>
          )}
        </Link>
      </div>
    </li>
  );
}
