"use client";

import { useLocale, useTranslations } from "next-intl";
import { Accessibility, CalendarDays, MapPin, Ticket, Users } from "lucide-react";
import { formatDateRange, formatEventLocation, isEventFree, scheduleDateRange } from "@/lib/utils";
import { MouseGlow } from "@/components/ui/MouseGlow";
import { buttonVariants } from "@/components/ui/Button";
import type { PulseEventDetail } from "@/lib/pulse/types";

/**
 * Event banner — rendered inside EventShell (a Client Component) rather
 * than directly in page.tsx, since its ticket CTA jumps to a section via
 * EventShell's own state instead of a URL anchor. A normal top-of-page
 * hero: it scrolls away with the rest of the page like any other section,
 * same on every breakpoint (2026-10-23 revert — an earlier version had a
 * `collapsed` state that shrank it to a thin bar once scrolled past, part
 * of the fixed-frame layout EventShell no longer uses). Taller than
 * before too, on the same ask ("está muito fina... podes fazer esse hero
 * ser mais grande") — nothing constrains its height anymore now that the
 * page scrolls normally instead of fitting everything into one viewport.
 */
export function EventHero({
  event,
  onTicketsClick,
}: {
  event: PulseEventDetail;
  onTicketsClick: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("eventTabs");
  const range = scheduleDateRange(event.scheduleDates);
  const isFree = isEventFree(event);

  return (
    <section className="relative overflow-hidden bg-brand-navy text-white h-64 sm:h-72 md:h-96 lg:h-[28rem]">
      <MouseGlow />
      {event.coverUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- remote Pulse media, host not finalized yet */}
          <img
            src={event.coverUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span aria-hidden className="absolute inset-0 bg-brand-navy/60" />
        </>
      )}

      <div className="relative mx-auto flex h-full max-w-container items-center gap-6 px-6 lg:px-10">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] sm:text-3xl lg:text-4xl">
            {event.title}
          </h1>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/80 sm:text-base">
            {range && (
              <span className="flex items-center gap-1.5">
                <CalendarDays size={16} className="shrink-0 text-brand-red" />
                {formatDateRange(range.start, range.end, locale)}
              </span>
            )}
            {event.location?.name && (
              <span className="flex items-center gap-1.5">
                <MapPin size={16} className="shrink-0 text-brand-red" />
                {formatEventLocation(event.location)}
              </span>
            )}
            {event.ageLimit > 0 && (
              <span className="hidden items-center gap-1.5 sm:flex">
                <Users size={16} className="shrink-0 text-brand-red" />
                {t("ageLimit", { count: event.ageLimit })}
              </span>
            )}
            {event.wheelchairAccess && (
              <span className="hidden items-center gap-1.5 lg:flex">
                <Accessibility size={16} className="shrink-0 text-brand-red" />
                {t("wheelchairAccess")}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onTicketsClick}
            className={buttonVariants("primary", "lg", "mt-5 w-fit")}
          >
            <Ticket size={18} />
            {isFree ? t("heroFree") : t("tickets")}
          </button>
        </div>

        {event.coverUrl && (
          <div className="hidden h-[80%] shrink-0 overflow-hidden rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.4)] sm:block sm:aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote Pulse media, host not finalized yet */}
            <img src={event.coverUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}
