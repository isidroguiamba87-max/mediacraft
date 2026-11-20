"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftRight } from "lucide-react";
import { PillDropdown } from "@/components/ui/PillDropdown";
import { EventTile } from "@/components/events/EventTile";
import type { PulseEvent } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

type Item = { event: PulseEvent; year: number; channels?: string | null };
type Mode = "events" | "communication";

/**
 * #eventos on the one-page home: "EVENTOS" title, and on the right a
 * "Comunicação" switch (client 2026-11-19) plus the Recentes / year
 * dropdown, then the real Pulse events as cards (3 / 2 / 1 columns).
 * The switch flips the same grid to the events the admin marked as
 * Comunicação ("Visual do Evento" → Tipo) — gold title/dropdown/card
 * titles, channels under each title — and back. Filtering is client-side
 * over lists the server already loaded and ordered; nothing is invented to
 * pad the grid.
 */
export function HomeEventsGrid({
  events,
  years,
  communication,
  communicationYears,
}: {
  /** Already in "Recentes" order, each with its start year. */
  events: Item[];
  years: number[];
  communication: Item[];
  communicationYears: number[];
}) {
  const t = useTranslations("events");
  const tNav = useTranslations("nav");
  const [mode, setMode] = useState<Mode>("events");
  const [year, setYear] = useState("");
  const gold = mode === "communication";
  const list = gold ? communication : events;
  const listYears = gold ? communicationYears : years;
  const shown = year ? list.filter((e) => String(e.year) === year) : list;

  const switchTo = (next: Mode) => {
    setMode(next);
    setYear("");
  };

  return (
    <div className="mx-auto w-full max-w-container px-6 pt-8 pb-14 sm:py-20 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <h2
          aria-live="polite"
          className={cn("inline-block border-b-2 pb-0.5 text-brand-navy", gold ? "border-[#D4962B]" : "border-brand-red")}
        >
          <span className="font-body text-4xl leading-none font-bold tracking-tight uppercase sm:text-5xl">
            {gold ? tNav("communication") : tNav("events")}
          </span>
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => switchTo(gold ? "events" : "communication")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border-2 bg-white px-5 py-1 font-body text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
              gold
                ? "border-brand-red text-brand-red hover:bg-brand-red hover:text-white focus-visible:outline-brand-red"
                : "border-[#D4962B] text-[#D4962B] hover:bg-[#D4962B] hover:text-white focus-visible:outline-[#D4962B]",
            )}
          >
            <ArrowLeftRight aria-hidden className="h-4 w-4" strokeWidth={2.5} />
            {gold ? tNav("events") : tNav("communication")}
          </button>
          <PillDropdown
            key={mode}
            ariaLabel={t("filters.label")}
            value={year}
            onChange={setYear}
            tone={gold ? "gold" : "red"}
            options={[
              { value: "", label: t("filters.recent") },
              ...listYears.map((y) => ({ value: String(y), label: String(y) })),
            ]}
          />
        </div>
      </div>

      {shown.length > 0 ? (
        <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:mt-12 sm:grid-cols-2 sm:gap-y-14 lg:grid-cols-3">
          {shown.map(({ event, channels }) => (
            <li key={event.id}>
              <EventTile event={event} caption={gold ? channels : undefined} tone={gold ? "gold" : "red"} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-12 text-sm text-slate">{t("empty")}</p>
      )}
    </div>
  );
}
