import { getLocale, getTranslations } from "next-intl/server";
import { ExternalLink, Radio } from "lucide-react";
import { formatDate, isEventLiveNow, youtubeEmbedUrl } from "@/lib/utils";
import { livePlatform, zoomMeetingId, type EventLiveInfo } from "@/lib/events/liveInfo";
import type { PulseScheduleDate } from "@/lib/pulse/types";
import { LiveZoomCard } from "./LiveZoomCard";

/**
 * "Ao Vivo". The link comes from Pulse (`location.eventLink`) or, when set,
 * the admin's own (`live_info.joinUrl`). A YouTube link keeps the embedded
 * player; anything else (Zoom) gets the client's design (2026-11-13): the
 * event cover under its shadow colour with a white card — "Participe também
 * pelo Zoom", join / chat / instructions, meeting ID and passcode (admin's
 * "Visual do Evento" → "Ao Vivo (Zoom)"; the ID is read off a zoom.us/j/…
 * link when not filled in).
 */
const PLATFORM_NAMES = { zoom: "Zoom", meet: "Google Meet", teams: "Microsoft Teams", other: null } as const;

export async function Live({
  eventLink,
  scheduleDates,
  coverUrl = null,
  liveInfo = null,
}: {
  eventLink: string | null;
  scheduleDates: PulseScheduleDate[];
  coverUrl?: string | null;
  liveInfo?: EventLiveInfo | null;
}) {
  const t = await getTranslations("eventTabs");
  const link = liveInfo?.joinUrl ?? eventLink;

  if (!link) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-brand border border-dashed border-line py-16 text-center">
        <Radio size={22} className="text-slate" />
        <p className="text-sm text-slate">{t("liveOffline")}</p>
      </div>
    );
  }

  const embedUrl = youtubeEmbedUrl(link);

  if (!embedUrl) {
    return (
      <div className="relative flex min-h-[28rem] items-center justify-center overflow-hidden rounded-[1.25rem] bg-brand-navy px-4 py-12 sm:min-h-[34rem] sm:rounded-[1.75rem] sm:px-10">
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- remote Pulse / Supabase media
          <img src={coverUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        )}
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ background: "var(--event-overlay, rgb(0 27 50 / 0.6))" }}
        />
        <div className="relative flex w-full justify-center">
          <LiveZoomCard
            joinUrl={link}
            platform={PLATFORM_NAMES[livePlatform(link)]}
            meetingId={zoomMeetingId(liveInfo, link)}
            passcode={liveInfo?.passcode ?? null}
            chatUrl={liveInfo?.chatUrl ?? null}
            instructions={liveInfo?.instructions ?? null}
          />
        </div>
      </div>
    );
  }

  const locale = await getLocale();
  const live = isEventLiveNow(scheduleDates);
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
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-red hover:underline"
        >
          {t("liveWatchLink")}
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="aspect-video w-full overflow-hidden rounded-brand bg-brand-navy">
        <iframe
          src={embedUrl}
          title="Live stream"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
