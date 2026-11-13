"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PillDropdown } from "@/components/ui/PillDropdown";
import { EventTile } from "@/components/events/EventTile";
import type { PulseEvent } from "@/lib/pulse/types";

/**
 * #eventos on the one-page home (2026-11-11): "EVENTOS" title with the
 * Recentes / year dropdown on the right, then the real Pulse events as
 * cards (3 / 2 / 1 columns). Filtering is client-side over the list the
 * server already loaded and ordered — no reload, no URL change. Nothing is
 * invented to pad the grid.
 */
export function HomeEventsGrid({
  events,
  years,
}: {
  /** Already in "Recentes" order, each with its start year. */
  events: { event: PulseEvent; year: number }[];
  years: number[];
}) {
  const t = useTranslations("events");
  const tNav = useTranslations("nav");
  const [year, setYear] = useState("");
  const shown = year ? events.filter((e) => String(e.year) === year) : events;

  return (
    <div className="mx-auto w-full max-w-container px-6 py-14 sm:py-20 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <h2 className="inline-block border-b-2 border-brand-red pb-0.5 text-brand-navy">
          <span className="font-body text-4xl leading-none font-bold tracking-tight uppercase sm:text-5xl">
            {tNav("events")}
          </span>
        </h2>
        <PillDropdown
          ariaLabel={t("filters.label")}
          value={year}
          onChange={setYear}
          options={[
            { value: "", label: t("filters.recent") },
            ...years.map((y) => ({ value: String(y), label: String(y) })),
          ]}
        />
      </div>

      {shown.length > 0 ? (
        <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:mt-12 sm:grid-cols-2 sm:gap-y-14 lg:grid-cols-3">
          {shown.map(({ event }) => (
            <li key={event.id}>
              <EventTile event={event} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-12 text-sm text-slate">{t("empty")}</p>
      )}
    </div>
  );
}
