import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/config/i18n";
import { getEvent } from "@/lib/pulse/endpoints";
import { buildSpeakerDirectory } from "@/lib/pulse/panels";
import { isEventFree } from "@/lib/utils";
import { Avatar } from "@/components/events/tabs/Program";
import { ConnectButton } from "@/components/networking/ConnectButton";
import { withResolvedChannels } from "@/lib/networking/parseChannels";

interface SpeakerPageProps {
  params: Promise<{ locale: string; eventId: string; speakerKey: string }>;
}

export async function generateMetadata({ params }: SpeakerPageProps): Promise<Metadata> {
  const { eventId, speakerKey } = await params;
  const { event } = await getEvent(eventId);
  const speaker = event
    ? buildSpeakerDirectory(event.speakers, event.sections).find((s) => s.slug === speakerKey)
    : null;
  return { title: speaker ? `${speaker.name} — ${event?.title}` : undefined };
}

/**
 * Speaker profile — the `speakers_directory` funnel path's landing page
 * (2026-10-12, Networking), reached from the Oradores tab. Same break-out
 * pattern as the panel/session detail page (own navy hero, outside
 * EventShell's fixed frame) rather than a tab, since it's a drill-down
 * from one, not a primary section itself.
 *
 * No `bio` field exists on Pulse's speaker objects — shows what's
 * actually there (occupation, company, photo, the sessions they're in)
 * instead of a placeholder for data that was never promised.
 */
export default async function SpeakerProfilePage({ params }: SpeakerPageProps) {
  const { locale, eventId, speakerKey } = await params;
  setRequestLocale(locale);

  const { event } = await getEvent(eventId);
  if (!event) notFound();

  const speaker = buildSpeakerDirectory(event.speakers, event.sections).find((s) => s.slug === speakerKey);
  if (!speaker) notFound();

  const t = await getTranslations("speakerProfile");

  return (
    <div>
      <section className="bg-brand-navy text-white">
        <div className="mx-auto max-w-container px-6 py-14 lg:px-10 lg:py-20">
          <Link
            href={`/eventos/${eventId}?tab=speakers`}
            className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft size={15} />
            {t("back")}
          </Link>

          <div className="mt-6 flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <Avatar photoUrl={speaker.photoUrl} name={speaker.name} size={96} />
            <div>
              <h1 className="font-display text-3xl leading-snug sm:text-4xl">{speaker.name}</h1>
              {(speaker.occupation || speaker.company) && (
                <p className="mt-1.5 text-sm text-white/75">
                  {[speaker.occupation, speaker.company].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-container px-6 py-14 lg:px-10">
        <div className="flex justify-center sm:justify-start">
          <ConnectButton
            speaker={withResolvedChannels(speaker)}
            eventId={eventId}
            isFree={isEventFree(event)}
            source="speakers_directory"
          />
        </div>

        {speaker.sessions.length > 0 && (
          <div className="mt-10">
            <p className="text-xs font-semibold tracking-wide text-slate uppercase">{t("sessions")}</p>
            <ul className="mt-4 flex flex-col gap-2">
              {speaker.sessions.map((s) => (
                <li key={s.key}>
                  <Link
                    href={`/eventos/${eventId}/paineis/${s.key}`}
                    className="block rounded-brand border border-line p-4 text-sm text-ink transition-colors hover:border-brand-red hover:text-brand-red"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
