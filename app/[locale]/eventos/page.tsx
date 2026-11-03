import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublicEvents } from "@/lib/pulse/endpoints";
import type { Locale } from "@/config/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { EventBook } from "@/components/events/EventBook";
import { EventFilters } from "@/components/events/EventFilters";
import { earliestScheduleDate } from "@/lib/utils";
import type { PulseEvent } from "@/lib/pulse/types";

const BOOKS_PER_SHELF = 5;
/** Alternating lean so a row doesn't look mechanically identical. */
const TILTS = [-1.5, 1, -0.5, 1.5, -1];

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

/** Nearest-first: upcoming events (soonest first), then past events
 * (most recent first) — so the top shelf is always what's coming up next.
 * Falls back to `createdAt` when `scheduleDates` is empty — a real case
 * for past events, since Pulse's repository always filters schedule
 * dates to `date >= now` regardless of which period matched the event. */
function byShelfOrder(events: PulseEvent[]): PulseEvent[] {
  const now = Date.now();
  const sortKey = (e: PulseEvent) => {
    const date = earliestScheduleDate(e.scheduleDates);
    return date ? new Date(date).getTime() : new Date(e.createdAt).getTime();
  };
  return [...events].sort((a, b) => {
    const aTime = sortKey(a);
    const bTime = sortKey(b);
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
  searchParams: Promise<{ period?: string }>;
}

export default async function EventsPage({ params, searchParams }: EventsPageProps) {
  const { locale } = await params;
  const { period } = await searchParams;
  setRequestLocale(locale);

  const [t, tNav] = await Promise.all([getTranslations("events"), getTranslations("nav")]);
  const { events, usedFallback } = await getPublicEvents({
    status: period === "upcoming" || period === "past" ? period : undefined,
  });

  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-10">
      <JsonLd data={breadcrumbSchema(locale as Locale, [{ name: tNav("events"), path: "/eventos" }])} />
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl text-brand-navy">{t("title")}</h1>
        <p className="mt-4 text-base text-slate">{t("subtitle")}</p>
      </div>

      {usedFallback && (
        <p className="mt-6 rounded-brand border border-line bg-paper-2 px-4 py-3 text-sm text-slate">
          {t("offline")}
        </p>
      )}

      <div className="mt-10">
        <EventFilters />
      </div>

      {events.length > 0 ? (
        <div className="mt-14 space-y-16">
          {chunk(byShelfOrder(events), BOOKS_PER_SHELF).map((row, shelfIndex) => (
            <div key={row[0]?.id ?? shelfIndex}>
              {shelfIndex === 0 && (
                <p className="mb-5 text-xs font-semibold tracking-[0.14em] text-brand-red uppercase">
                  {t("shelfNearest")}
                </p>
              )}
              <div className="flex flex-wrap items-end gap-6 sm:gap-8">
                {row.map((event, i) => (
                  <EventBook key={event.id} event={event} tilt={TILTS[i % TILTS.length]} />
                ))}
              </div>
              <div className="shelf-plank mt-4" />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-sm text-slate">{t("empty")}</p>
      )}
    </div>
  );
}
