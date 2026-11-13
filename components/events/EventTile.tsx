import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/config/i18n";
import { formatEventLocation } from "@/lib/utils";
import type { PulseEvent } from "@/lib/pulse/types";

/**
 * Events-grid card: photo on top (navy block when the event has no cover),
 * white foot with the red uppercase title and a one-line grey
 * "place | dates" caption. Soft dark shadow all round; the whole card is
 * the link.
 */
export function EventTile({ event }: { event: PulseEvent }) {
  const locale = useLocale();
  const t = useTranslations("events");
  const dates = formatEventDates(
    event.scheduleDates.map((d) => d.date),
    locale,
  );
  const place = event.location?.name ? formatEventLocation(event.location) : "";
  const caption = [place, dates].filter(Boolean).join(" | ");

  return (
    <Link
      href={`/eventos/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-shadow duration-300 hover:shadow-[0_10px_28px_rgba(0,0,0,0.42)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-red"
    >
      <div className="relative aspect-[9/5] overflow-hidden bg-brand-navy">
        {event.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media, host not finalized yet
          <img
            src={event.coverUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="px-5 pt-3 pb-4 sm:px-5">
        <h3 className="truncate font-body text-lg leading-tight font-bold tracking-tight text-brand-red uppercase sm:text-xl">
          {event.title}
        </h3>
        {caption && (
          <p className="mt-1.5 truncate font-body text-[13px] text-slate sm:text-sm">{caption}</p>
        )}
        <span className="sr-only">{t("card.viewDetails")}</span>
      </div>
    </Link>
  );
}

/**
 * "22 & 23 de Julho de 2026" style range. Days in the same month/year are
 * joined ("22, 23 & 24"); dates spanning months fall back to listing each
 * full date. Single date → "14 de outubro de 2026".
 */
function formatEventDates(isoDates: string[], locale: string) {
  if (isoDates.length === 0) return "";
  const dates = [...new Set(isoDates.map((d) => d.slice(0, 10)))]
    .sort()
    .map((d) => new Date(`${d}T12:00:00`));
  const joinDays = (days: string[]) =>
    days.length === 1 ? days[0] : `${days.slice(0, -1).join(", ")} & ${days[days.length - 1]}`;

  const month = (d: Date) => new Intl.DateTimeFormat(locale, { month: "long" }).format(d);
  const sameMonth = dates.every(
    (d) => d.getMonth() === dates[0].getMonth() && d.getFullYear() === dates[0].getFullYear(),
  );

  const full = (days: string, d: Date) => {
    const m = month(d);
    const y = d.getFullYear();
    if (locale === "en") return `${m.charAt(0).toUpperCase() + m.slice(1)} ${days}, ${y}`;
    if (locale === "fr") return `${days} ${m} ${y}`;
    return `${days} de ${m} de ${y}`;
  };

  if (sameMonth) return full(joinDays(dates.map((d) => String(d.getDate()))), dates[0]);
  return dates.map((d) => full(String(d.getDate()), d)).join(" & ");
}
