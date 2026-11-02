import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Clock, MapPin, Tag } from "lucide-react";
import { Link } from "@/config/i18n";
import { getEvent } from "@/lib/pulse/endpoints";
import { buildPanels } from "@/lib/pulse/panels";
import { getPanelRatingForm } from "@/lib/bff";
import { SafeHtml } from "@/components/ui/SafeHtml";
import { SessionSpeakerList } from "@/components/networking/SessionSpeakerList";
import { PanelRatingButton } from "@/components/events/PanelRatingButton";
import { isEventFree, stripHtml } from "@/lib/utils";

interface PanelPageProps {
  params: Promise<{ locale: string; eventId: string; panelId: string }>;
}

export async function generateMetadata({ params }: PanelPageProps): Promise<Metadata> {
  const { eventId, panelId } = await params;
  const { event } = await getEvent(eventId);
  const panel = event ? buildPanels(event.sections).find((p) => p.key === panelId) : null;
  return {
    title: panel ? `${panel.title} — ${event?.title}` : undefined,
    description: panel?.description ? stripHtml(panel.description) : undefined,
  };
}

export default async function PanelPage({ params }: PanelPageProps) {
  const { locale, eventId, panelId } = await params;
  setRequestLocale(locale);

  const { event } = await getEvent(eventId);
  if (!event) notFound();

  const panel = buildPanels(event.sections).find((p) => p.key === panelId);
  if (!panel) notFound();

  const t = await getTranslations("panel");
  const ratingForm = await getPanelRatingForm(event.id);

  return (
    <div>
      <section className="bg-brand-navy text-white">
        <div className="mx-auto max-w-container px-6 py-14 lg:px-10 lg:py-20">
          <Link
            href={`/eventos/${eventId}?tab=program`}
            className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft size={15} />
            {t("back")}
          </Link>

          <p className="mt-6 font-mono text-[11px] font-semibold tracking-[0.14em] text-brand-red uppercase">
            {panel.sectionTitle}
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-3xl leading-snug sm:text-4xl">
            {panel.title}
          </h1>
        </div>
      </section>

      <div className="mx-auto grid max-w-container gap-12 px-6 py-14 lg:grid-cols-[340px_1fr] lg:px-10">
        <div>
          {/* Repeats the hero's quick facts as a scannable card — the
              description alone left this column reading mostly empty for
              the common case of a one-line "about" (2026-10-09: "os dados
              estão a faltar... não estás a fazer bom uso do espaço"). */}
          <div className="rounded-brand border border-line bg-paper-2 p-5">
            <p className="text-xs font-semibold tracking-wide text-slate uppercase">{t("details")}</p>
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-sm text-ink">
                <Tag size={15} className="shrink-0 text-brand-red" />
                {panel.sectionTitle}
              </div>
              {(panel.timeFrom || panel.timeTo) && (
                <div className="flex items-center gap-2.5 text-sm text-ink">
                  <Clock size={15} className="shrink-0 text-brand-red" />
                  {t("schedule")}: {panel.timeFrom}–{panel.timeTo}
                </div>
              )}
              {panel.rooms.map((room, i) => (
                <div key={room.id ?? `${room.title}-${i}`} className="flex items-center gap-2.5 text-sm text-ink">
                  <MapPin size={15} className="shrink-0 text-brand-red" />
                  {t("room")}: {room.title}
                </div>
              ))}
            </div>
          </div>

          {panel.description && (
            <>
              <p className="mt-8 text-xs font-semibold tracking-wide text-slate uppercase">
                {t("about")}
              </p>
              <SafeHtml html={panel.description} className="mt-4 text-sm text-ink" />
            </>
          )}

          {ratingForm && (
            <div className="mt-8">
              <PanelRatingButton
                eventId={event.id}
                sessionId={panel.key}
                date={panel.date}
                timeTo={panel.timeTo}
                form={ratingForm}
              />
            </div>
          )}
        </div>

        {panel.speakers.length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate uppercase">
              {t("speakers")}
            </p>
            {/* Photo centered and big enough to actually read, not a small
                circle crammed next to the name — same idea as the team
                cards on Sobre Nós. Three columns once the column itself
                has room (freed up by capping the "Sobre" column at a
                readable width instead of letting it stretch to `1fr`). */}
            <div className="mt-4">
              <SessionSpeakerList
                eventId={eventId}
                sessionId={panel.key}
                isFree={isEventFree(event)}
                speakers={panel.speakers}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
