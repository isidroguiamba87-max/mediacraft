import { useLocale } from "next-intl";
import { Link } from "@/config/i18n";
import { earliestScheduleDate, formatDate } from "@/lib/utils";
import type { PulseEvent } from "@/lib/pulse/types";

/**
 * A single book standing on the `/eventos` shelf: a compact, portrait
 * face-out cover (title + date over the photo) with the same spine / page
 * edge / hover-open treatment as {@link EventCard} (`.book-*` in
 * globals.css), plus a soft cast shadow onto the shelf plank beneath it.
 * A slight resting `tilt` (a couple of degrees, alternating per row) keeps
 * the row from looking mechanically identical, like books leant on a shelf.
 */
export function EventBook({ event, tilt = 0 }: { event: PulseEvent; tilt?: number }) {
  const locale = useLocale();
  const href = `/eventos/${event.id}`;
  const date = earliestScheduleDate(event.scheduleDates);

  return (
    <Link
      href={href}
      aria-label={event.title}
      className="book-wrap group block w-32 shrink-0 sm:w-40"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <span aria-hidden className="book-pages" />
      <div className="book-cover relative flex aspect-[3/4.3] flex-col overflow-hidden rounded-md border border-line bg-brand-navy shadow-brand">
        <span aria-hidden className="book-spine" />
        {event.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media, host not finalized yet
          <img
            src={event.coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
        <div className="relative mt-auto bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3 pt-8">
          <p className="line-clamp-2 font-display text-sm leading-snug text-white">
            {event.title}
          </p>
          {date && (
            <p className="mt-1 text-[11px] text-white/70">{formatDate(date, locale)}</p>
          )}
        </div>
      </div>
      <span aria-hidden className="book-shadow" />
    </Link>
  );
}
