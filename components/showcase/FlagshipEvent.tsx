import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { Link } from "@/config/i18n";
import { buttonVariants } from "@/components/ui/Button";
import { MouseGlow } from "@/components/ui/MouseGlow";
import { getPublicEvents } from "@/lib/pulse/endpoints";
import { cn, daysUntil, formatDateRange, formatEventLocation, scheduleDateRange } from "@/lib/utils";
import type { PulseEvent } from "@/lib/pulse/types";

interface SoonEvent {
  event: PulseEvent;
  isLiveToday: boolean;
  daysToStart: number;
}

/**
 * The "evento em breve" station — only appears once a real published event
 * is within 7 days of starting (or already under way). No qualifying
 * event → renders nothing, on purpose: an empty homepage section beats a
 * fake "live now" banner for an event that isn't. More than one qualifies
 * → a grid, not a single panel repeated.
 */
export async function FlagshipEvent() {
  const t = await getTranslations("showcase.flagship");
  const locale = await getLocale();
  const { events } = await getPublicEvents({ status: "upcoming" });

  const soon: SoonEvent[] = events
    .map((event): SoonEvent | null => {
      const range = scheduleDateRange(event.scheduleDates);
      if (!range) return null;
      const daysToStart = daysUntil(range.start);
      const daysToEnd = daysUntil(range.end);
      if (daysToStart > 7) return null;
      return { event, isLiveToday: daysToStart <= 0 && daysToEnd >= 0, daysToStart };
    })
    .filter((x): x is SoonEvent => x !== null)
    .sort((a, b) => a.daysToStart - b.daysToStart);

  if (soon.length === 0) return null;

  return (
    <section className="mx-auto max-w-container px-6 py-20 lg:px-10">
      <div className={cn("grid gap-6", soon.length > 1 && "md:grid-cols-2")}>
        {soon.map(({ event, isLiveToday, daysToStart }) => (
          <FlagshipCard
            key={event.id}
            event={event}
            isLiveToday={isLiveToday}
            daysToStart={daysToStart}
            locale={locale}
            t={t}
          />
        ))}
      </div>
    </section>
  );
}

function FlagshipCard({
  event,
  isLiveToday,
  daysToStart,
  locale,
  t,
}: {
  event: PulseEvent;
  isLiveToday: boolean;
  daysToStart: number;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const range = scheduleDateRange(event.scheduleDates);

  return (
    <div className="relative overflow-hidden rounded-brand bg-brand-navy px-6 py-8 text-white sm:px-8 sm:py-9">
      {event.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media, host not finalized yet
        <img src={event.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(0deg, rgba(0,27,50,0.95) 0%, rgba(0,27,50,0.78) 45%, rgba(0,27,50,0.45) 100%), radial-gradient(40% 60% at 12% 20%, rgba(191,38,46,0.3), transparent)",
        }}
      />
      <MouseGlow />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.14em] uppercase">
          {isLiveToday ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-red px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              {t("live")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
              {t("soon")}
            </span>
          )}
          <span className="text-white/60">
            {isLiveToday ? t("today") : t("daysUntil", { count: daysToStart })}
          </span>
        </div>

        <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-brand-red uppercase">
          {t("label")}
        </p>
        <h2 className="mt-1.5 max-w-3xl font-display text-xl leading-tight sm:text-2xl">
          {event.title}
        </h2>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
          {range && (
            <span className="flex items-center gap-2">
              <CalendarDays size={16} className="text-brand-red" />
              {formatDateRange(range.start, range.end, locale)}
            </span>
          )}
          {event.location?.name && (
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-brand-red" />
              {formatEventLocation(event.location)}
            </span>
          )}
        </div>

        <Link href={`/eventos/${event.id}`} className={buttonVariants("primary", "md", "mt-6")}>
          {t("cta")}
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
