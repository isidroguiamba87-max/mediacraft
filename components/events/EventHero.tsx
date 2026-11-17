"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, ChevronRight, MapPin, Ticket } from "lucide-react";
import { Link } from "@/config/i18n";
import { LangSwitcher } from "@/components/layout/LangSwitcher";
import { formatDateRange, scheduleDateRange } from "@/lib/utils";
import { formatEventDays } from "@/lib/events/dates";
import { liveSessions, type LiveSessions } from "@/lib/events/liveSession";
import { buildPanels } from "@/lib/pulse/panels";
import type { PulseEventDetail } from "@/lib/pulse/types";

/**
 * The event page's own top bar (client design 2026-11-13): the event's logo
 * on the left (set in the admin's "Visual do Evento"; MediaCraft's when
 * none), the language flags on the right. Replaces the MediaCraft header on
 * event pages (see ConditionalHeader).
 */
export function EventTopBar({ logoUrl, title }: { logoUrl: string | null; title: string }) {
  return (
    <div className="bg-white">
      <div className="mx-auto flex h-[4.5rem] max-w-container items-center justify-between px-6 lg:px-10">
        <Link href="/" aria-label={title} className="flex h-full min-w-0 items-center gap-3 py-3">
          {logoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image */}
              <img src={logoUrl} alt="" className="h-full max-h-12 w-auto max-w-[160px] shrink-0 object-contain" />
              {/* the event's name beside its logo (client, 2026-11-13) */}
              <span className="hidden max-w-[18rem] font-body text-xs leading-tight font-bold text-brand-navy uppercase sm:block sm:text-sm">
                {title}
              </span>
            </>
          ) : (
            <span className="rounded-lg bg-brand-navy px-3 py-2">
              <Image src="/logo/logo.png" alt="MediaCraft" width={3914} height={1138} className="h-6 w-auto" />
            </span>
          )}
        </Link>
        <LangSwitcher />
      </div>
    </div>
  );
}

/** Re-evaluated every 30 s; null on the server and first paint so the
 * markup always matches (the card simply appears once mounted). */
function useLiveSessions(event: PulseEventDetail): LiveSessions | null {
  const panels = useMemo(() => buildPanels(event.sections), [event.sections]);
  const [live, setLive] = useState<LiveSessions | null>(null);
  useEffect(() => {
    const tick = () => setLive(liveSessions(panels, event.timezone || "Africa/Maputo"));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [panels, event.timezone]);
  return live;
}

/**
 * "Agora / A seguir" (2026-11-17): on the event day only, a floating card on
 * the cover with the session running right now (and the next one), from the
 * Pulse programme times in the event's timezone. Clicking opens the
 * Programa on that session.
 */
function LiveNowCard({
  live,
  onSessionClick,
}: {
  live: LiveSessions;
  onSessionClick: ((key: string) => void) | null;
}) {
  const t = useTranslations("eventTabs");
  const main = live.current ?? live.next!;
  const isNow = !!live.current;
  const following = live.current ? live.next : null;
  const time = (p: { timeFrom: string; timeTo: string }) =>
    [p.timeFrom, p.timeTo].filter(Boolean).join(" – ");

  return (
    <button
      type="button"
      onClick={() => onSessionClick?.(main.key)}
      disabled={!onSessionClick}
      className="reveal-up mt-8 w-full max-w-md rounded-2xl bg-white/95 px-5 py-4 text-left text-brand-navy shadow-[0_18px_44px_rgba(0,0,0,0.35)] backdrop-blur transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:mt-10"
    >
      <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] uppercase">
        {isNow ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-red opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-red" />
            </span>
            <span className="text-brand-red">{t("liveNowLabel")}</span>
          </>
        ) : (
          <span className="text-brand-red">{t("liveNextLabel")}</span>
        )}
        <span className="font-semibold text-slate tabular-nums">· {time(main)}</span>
      </span>
      <span className="mt-1.5 block font-body text-base leading-snug font-bold sm:text-lg">{main.title}</span>
      {main.sectionTitle && <span className="mt-0.5 block text-xs text-slate">{main.sectionTitle}</span>}

      {following && (
        <span className="mt-3 block border-t border-line pt-2.5 text-xs text-slate">
          <span className="font-bold tracking-[0.12em] text-brand-navy uppercase">{t("liveNextLabel")}</span>{" "}
          <span className="tabular-nums">· {following.timeFrom}</span> — {following.title}
        </span>
      )}

      {onSessionClick && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-red">
          {t("liveSeeInProgram")}
          <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/**
 * The event's first screen (client design 2026-11-13) — nothing else on it:
 * a big rounded card with the cover under the event's shadow colour (set in
 * the admin, `--event-overlay`; navy 60% by default), and centred on it the
 * dates | venue line, the event name, its theme (admin) and "Ver programa".
 * The tabs and their content follow below, on scroll.
 */
export function EventHero({
  event,
  tagline,
  onProgramClick,
  onTicketsClick,
  onSessionClick = null,
}: {
  event: PulseEventDetail;
  tagline: string | null;
  /** Opens the Programa on one session (the "Agora" card). */
  onSessionClick?: ((key: string) => void) | null;
  /** null when the event has no programme tab to open. */
  onProgramClick: (() => void) | null;
  /** null when the event has no tickets tab. */
  onTicketsClick: (() => void) | null;
}) {
  const locale = useLocale();
  const t = useTranslations("eventTabs");
  const day = formatEventDays(
    event.scheduleDates.map((d) => d.date),
    locale,
  );
  const range = scheduleDateRange(event.scheduleDates);
  const city = event.location?.address?.city;
  // Tickets on sale in Pulse right now. Paid → "Bilhetes"; only free ones
  // → "Reservar bilhete" (Pulse's own reservation: reserve + 0-MZN payment,
  // done in the Bilhetes section). Nothing on sale → no button at all.
  const onSale = event.tickets.filter((tk) => tk.state === "ACTIVE" && tk.quantitySold < tk.quantity);
  const paidOnSale = onSale.some((tk) => tk.price > 0);
  const live = useLiveSessions(event);

  return (
    <section className="bg-white px-4 pb-4 sm:px-6 sm:pb-6 lg:px-10 lg:pb-10">
      <div className="relative mx-auto flex min-h-[calc(100svh-4.5rem-1rem)] max-w-[1600px] items-center justify-center overflow-hidden rounded-[1.25rem] bg-brand-navy px-6 py-16 text-center text-white sm:min-h-[calc(100svh-4.5rem-1.5rem)] sm:rounded-[1.75rem] lg:min-h-[calc(100svh-4.5rem-2.5rem)]">
        {event.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- remote Pulse / Supabase media
          <img src={event.coverUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        )}
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ background: "var(--event-overlay, rgb(0 27 50 / 0.6))" }}
        />

        <div className="relative flex max-w-5xl flex-col items-center">
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-body text-base uppercase sm:text-xl lg:text-2xl">
            {(day || range) && (
              <span className="flex items-center gap-2">
                <CalendarDays aria-hidden className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" strokeWidth={2.2} />
                {day ? (
                  <span>
                    {day.days}, <strong className="font-bold">{day.month}</strong>, {day.year}
                  </span>
                ) : (
                  range && <span>{formatDateRange(range.start, range.end, locale)}</span>
                )}
              </span>
            )}
            {(day || range) && event.location?.name && (
              <span aria-hidden className="h-6 w-px bg-white/90 sm:h-7" />
            )}
            {event.location?.name && (
              <span className="flex items-center gap-2">
                <MapPin aria-hidden className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" strokeWidth={2.2} />
                <span>
                  <strong className="font-bold">{event.location.name}</strong>
                  {city ? `, ${city}` : ""}
                </span>
              </span>
            )}
          </p>

          <h1 className="mt-5 text-white sm:mt-7">
            <span className="block font-body text-4xl leading-[1.05] font-bold tracking-tight uppercase sm:text-6xl lg:text-7xl">
              {event.title}
            </span>
          </h1>

          {tagline && (
            <p className="mt-4 max-w-3xl font-body text-sm leading-snug font-bold text-balance uppercase sm:mt-5 sm:text-lg lg:text-xl">
              {tagline}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
          {onTicketsClick && onSale.length > 0 && (
            <button
              type="button"
              onClick={onTicketsClick}
              className="inline-flex items-center gap-2 rounded-full bg-brand-red px-6 py-2.5 font-body text-sm font-bold tracking-wide text-white uppercase shadow-sm transition-colors hover:bg-brand-red-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-base"
            >
              <Ticket aria-hidden className="h-5 w-5" strokeWidth={2.2} />
              {paidOnSale ? t("tickets") : t("reserveTicket")}
            </button>
          )}
          {onProgramClick && (
            <button
              type="button"
              onClick={onProgramClick}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-2.5 font-body text-sm font-bold tracking-wide text-brand-navy uppercase shadow-sm transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-base"
            >
              {t("viewProgram")}
              <ChevronRight aria-hidden className="h-5 w-5" strokeWidth={3} />
            </button>
          )}
          </div>

          {live && <LiveNowCard live={live} onSessionClick={onSessionClick} />}
        </div>
      </div>
    </section>
  );
}
