"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, MapPin } from "lucide-react";
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

/** "{count} sessões · Room A · Room B" — total sessions across every
 * section that day, plus the distinct room names actually used (derived
 * from `panel.rooms`, same data the per-item location pill already shows,
 * just deduplicated and rolled up to the day level). */
function daySummary(day: DayGroup, t: ReturnType<typeof useTranslations>): string | null {
  const panels = day.sections.flatMap((s) => s.panels);
  if (panels.length === 0) return null;
  const venues = [...new Set(panels.flatMap((p) => p.rooms.map((r) => r.title)))];
  return [t("programSessions", { count: panels.length }), ...venues].join(" · ");
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
          className="flex flex-wrap gap-2.5"
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
                  "relative flex items-center gap-2 rounded-full border px-3.5 py-2 text-left transition-colors",
                  active
                    ? "border-brand-red bg-brand-navy shadow-brand"
                    : "border-line bg-paper hover:border-brand-red/40",
                )}
              >
                {parts ? (
                  <>
                    <span
                      className={cn(
                        "font-display text-xl leading-none font-bold tabular-nums",
                        active ? "text-white" : "text-brand-navy",
                      )}
                    >
                      {parts.num}
                    </span>
                    <span className="flex flex-col leading-tight">
                      <span
                        className={cn(
                          "font-mono text-[9px] font-semibold tracking-[0.12em] text-brand-red uppercase",
                        )}
                      >
                        {parts.weekday}
                      </span>
                      <span className={cn("text-[11px]", active ? "text-white/60" : "text-slate")}>
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

      {/* "{count} sessões · venue1 · venue2" — only what's actually
       * derivable from this day's own panels (room titles), nothing
       * invented (no theme/title field exists on a Pulse day). */}
      {daySummary(day, t) && <p className="text-sm text-slate">{daySummary(day, t)}</p>}

      {(() => {
        // One continuous timeline for the whole day — each card carries
        // its own section/category pill now (see ProgramItem), so the big
        // per-section header+rail break this used to have was just the
        // same information shown twice.
        const dayPanels = day.sections.flatMap((s) => s.panels);
        return (
          <ol className="relative flex flex-col">
            {dayPanels.map((panel, i) => (
              <ProgramItem
                key={panel.key}
                eventId={eventId}
                panel={panel}
                last={i === dayPanels.length - 1}
              />
            ))}
          </ol>
        );
      })()}
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
          className="relative z-10 mt-4 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 border-brand-red bg-paper"
          aria-hidden
        >
          <Check size={8} strokeWidth={3} className="text-brand-red" />
        </span>
      </div>

      {/* session card */}
      <div className="min-w-0 pb-5">
        <Link
          href={`/eventos/${eventId}/paineis/${panel.key}`}
          className="block rounded-brand border border-line bg-paper px-4 py-3.5 transition-colors hover:border-brand-red/40 hover:bg-paper-2"
        >
          {panel.sectionTitle && (
            <p className="mb-1.5 inline-block rounded-full bg-brand-red/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-brand-red uppercase">
              {panel.sectionTitle}
            </p>
          )}
          {panel.rooms.length > 0 && (
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] text-slate">
              <MapPin size={12} className="shrink-0 text-brand-red" />
              {panel.rooms.map((r) => r.title).join(" · ")}
            </p>
          )}
          <p className="font-display text-base leading-snug text-brand-navy">{panel.title}</p>

          {panel.speakers.length === 1 ? (
            <SingleSpeakerRow speaker={panel.speakers[0]!} />
          ) : (
            panel.speakers.length > 1 && (
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
            )
          )}
        </Link>
      </div>
    </li>
  );
}

function SingleSpeakerRow({ speaker }: { speaker: Panel["speakers"][number] }) {
  const role = [speaker.occupation, speaker.company].filter(Boolean).join(" · ");
  return (
    <div className="mt-3 flex items-center gap-2.5">
      <Avatar photoUrl={speaker.photoUrl} name={speaker.name} size={32} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{speaker.name}</p>
        {role && <p className="truncate text-[11px] text-slate">{role}</p>}
      </div>
    </div>
  );
}
