import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublicEvents } from "@/lib/pulse/endpoints";
import type { Locale } from "@/config/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { EventTile } from "@/components/events/EventTile";
import { EventYearFilter } from "@/components/events/EventYearFilter";
import { earliestScheduleDate } from "@/lib/utils";
import type { PulseEvent } from "@/lib/pulse/types";

/** Start date used for ordering and the year filter. Falls back to
 * `createdAt` when `scheduleDates` is empty — a real case for past events,
 * since Pulse's repository filters schedule dates to `date >= now`. */
function startTime(e: PulseEvent) {
  const date = earliestScheduleDate(e.scheduleDates);
  return new Date(date ?? e.createdAt);
}

/** "Recentes": upcoming events soonest-first, then past events
 * most-recent-first — what's coming up next is always on top. */
function byRecent(events: PulseEvent[]): PulseEvent[] {
  const now = Date.now();
  return [...events].sort((a, b) => {
    const aTime = startTime(a).getTime();
    const bTime = startTime(b).getTime();
    const aUpcoming = aTime >= now;
    const bUpcoming = bTime >= now;
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    const diff = aTime - bTime;
    return aUpcoming ? diff : -diff;
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.events" });
  return buildMetadata({
    locale: locale as Locale,
    path: "/eventos",
    title: t("title"),
    description: t("description"),
  });
}

interface EventsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ano?: string }>;
}

export default async function EventsPage({ params, searchParams }: EventsPageProps) {
  const { locale } = await params;
  const { ano } = await searchParams;
  setRequestLocale(locale);

  const [t, tNav] = await Promise.all([getTranslations("events"), getTranslations("nav")]);
  const { events, usedFallback } = await getPublicEvents({});

  // Filter options: the last four years, plus any older year an event
  // actually falls in — newest first.
  const thisYear = new Date().getFullYear();
  const years = [
    ...new Set([
      thisYear,
      thisYear - 1,
      thisYear - 2,
      thisYear - 3,
      ...events.map((e) => startTime(e).getFullYear()),
    ]),
  ].sort((a, b) => b - a);

  const year = ano && /^\d{4}$/.test(ano) ? Number(ano) : null;
  const visible = byRecent(
    year ? events.filter((e) => startTime(e).getFullYear() === year) : events,
  );

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-container px-6 py-14 sm:py-20 lg:px-10">
        <JsonLd data={breadcrumbSchema(locale as Locale, [{ name: tNav("events"), path: "/eventos" }])} />

        <div className="flex flex-wrap items-center justify-between gap-6">
          <h1 className="inline-block border-b-2 border-brand-red pb-0.5 font-body text-4xl leading-none font-bold tracking-tight text-brand-navy uppercase sm:text-5xl">
            {tNav("events")}
          </h1>
          <EventYearFilter years={years} />
        </div>

        {usedFallback && (
          <p className="mt-6 rounded-brand border border-line bg-paper-2 px-4 py-3 text-sm text-slate">
            {t("offline")}
          </p>
        )}

        {visible.length > 0 ? (
          <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:mt-12 sm:grid-cols-2 sm:gap-y-14 lg:grid-cols-3">
            {visible.map((event) => (
              <li key={event.id}>
                <EventTile event={event} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-12 text-sm text-slate">{t("empty")}</p>
        )}
      </div>
    </div>
  );
}
