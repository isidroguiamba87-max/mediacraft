import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "@/config/i18n";
import { earliestScheduleDate, formatEventLocation } from "@/lib/utils";
import type { PulseEvent } from "@/lib/pulse/types";

/**
 * An event as a book: a full-bleed cover photo with a "free"/"sold out"
 * chip top-left (real `isFree`/`isSoldOut` booleans from `GET
 * /embed/:domain/events`, confirmed live 2026-09-18 — Pulse's list still
 * has no category field to badge by, but these two are real now) and the
 * title + date + place set over a dark gradient at the foot, a spine down
 * the left edge and a page-corner fold bottom-right (`.book-*` /
 * `.book-fold` in globals.css). Hover tilts the cover open on the spine;
 * the whole card is the link.
 */
export function EventCard({ event }: { event: PulseEvent }) {
  const locale = useLocale();
  const t = useTranslations("events");
  const href = `/eventos/${event.id}`;
  const date = earliestScheduleDate(event.scheduleDates);

  return (
    <div className="book-wrap group h-full">
      <span aria-hidden className="book-pages" />
      <Link
        href={href}
        aria-label={event.title}
        className="book-cover relative flex aspect-[4/5] flex-col overflow-hidden rounded-2xl border border-line bg-brand-navy shadow-brand transition-shadow duration-300 group-hover:shadow-xl"
      >
        <span aria-hidden className="book-spine" />

        {event.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media, host not finalized yet
          <img
            src={event.coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10"
        />

        {event.isSoldOut ? (
          <span className="relative z-10 m-2.5 inline-flex w-fit items-center rounded-full bg-brand-red px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.1em] text-white uppercase shadow-sm sm:m-4 sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.14em]">
            {t("soldOut")}
          </span>
        ) : (
          event.isFree && (
            <span className="relative z-10 m-2.5 inline-flex w-fit items-center rounded-full bg-white/95 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.1em] text-brand-navy uppercase shadow-sm sm:m-4 sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.14em]">
              {t("free")}
            </span>
          )
        )}

        <div className="relative z-10 mt-auto p-3 sm:p-5">
          <h3 className="font-display text-sm leading-snug font-bold text-white sm:text-lg">
            {event.title}
          </h3>
          <div className="mt-2 flex flex-col gap-1 font-mono text-[9px] tracking-wide text-white/80 sm:mt-3 sm:gap-1.5 sm:text-[11px]">
            {date && (
              <span className="flex items-center gap-1.5 sm:gap-2">
                <CalendarDays size={12} className="shrink-0 text-brand-red sm:size-[13px]" />
                {formatCompactDate(date, locale)}
              </span>
            )}
            {event.location?.name && (
              <span className="flex items-center gap-1.5 sm:gap-2">
                <MapPin size={12} className="shrink-0 text-brand-red sm:size-[13px]" />
                {formatEventLocation(event.location)}
              </span>
            )}
          </div>
        </div>

        <span aria-hidden className="book-fold" />
        <span className="sr-only">{t("card.viewDetails")}</span>
      </Link>
    </div>
  );
}

/** Compact single date for the card foot, e.g. "14 Mai 2026". */
function formatCompactDate(iso: string, locale: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat(locale, { month: "short" })
    .format(d)
    .replace(".", "");
  return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)} ${d.getFullYear()}`;
}
