import { getLocale, getTranslations } from "next-intl/server";
import { ExternalLink, Radio } from "lucide-react";
import { formatDate, isEventLiveNow, youtubeEmbedUrl } from "@/lib/utils";
import type { PulseScheduleDate } from "@/lib/pulse/types";

/**
 * There's no dedicated live-stream endpoint or "is live" flag — per
 * backend (2026-09-14), the stream link is just `location.eventLink` on
 * the event detail, set by the organizer in Pulse Admin. "Live now" is
 * inferred client-side-free, at render time, from the event's schedule
 * (see isEventLiveNow) — a heuristic, not a real-time signal — so it only
 * controls the "on air" badge, never whether the link itself is shown:
 * the link is real and valid outside the live window too (before it airs,
 * or as a replay after), so it always appears once the organizer sets it.
 */
export async function Live({
  eventLink,
  scheduleDates,
}: {
  eventLink: string | null;
  scheduleDates: PulseScheduleDate[];
}) {
  const t = await getTranslations("eventTabs");

  if (!eventLink) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-brand border border-dashed border-line py-16 text-center">
        <Radio size={22} className="text-slate" />
        <p className="text-sm text-slate">{t("liveOffline")}</p>
      </div>
    );
  }

  const locale = await getLocale();
  const live = isEventLiveNow(scheduleDates);
  const embedUrl = youtubeEmbedUrl(eventLink);
  const next = [...scheduleDates].sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {live ? (
          <p className="flex items-center gap-2 text-sm font-medium text-brand-red">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-red opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-red" />
            </span>
            {t("liveOnAir")}
          </p>
        ) : (
          <p className="text-sm text-slate">
            {next ? t("liveScheduledFor", { date: formatDate(next.date, locale) }) : t("liveScheduledSoon")}
          </p>
        )}
        <a
          href={eventLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-red hover:underline"
        >
          {t("liveWatchLink")}
          <ExternalLink size={14} />
        </a>
      </div>

      {embedUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-brand bg-brand-navy">
          <iframe
            src={embedUrl}
            title="Live stream"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : (
        <a
          href={eventLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-3 rounded-brand border border-dashed border-line py-16 text-center transition-colors hover:border-brand-red hover:bg-paper-2"
        >
          <Radio size={22} className="text-slate" />
          <p className="text-sm text-slate">{t("liveExternalOnly")}</p>
        </a>
      )}
    </div>
  );
}
