import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getEvent } from "@/lib/pulse/endpoints";
import { getActiveRatingForm, getEventOverride } from "@/lib/bff";
import { buildSpeakerDirectory } from "@/lib/pulse/panels";
import { stripHtml, darkenHex, isEventFree } from "@/lib/utils";
import type { Locale } from "@/config/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema, eventSchema } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { EventShell, type EventSectionDef } from "@/components/events/EventShell";
import { EVENT_TAB_DISPLAY_ORDER, EVENT_TAB_KEYS, type EventTabKey } from "@/lib/events/tabs";
import { RatingPopup } from "@/components/events/RatingPopup";
import { EventDetails } from "@/components/events/tabs/EventDetails";
import { News } from "@/components/events/tabs/News";
import { Live } from "@/components/events/tabs/Live";
import { Program } from "@/components/events/tabs/Program";
import { Oradores } from "@/components/events/tabs/Oradores";
import { Gallery } from "@/components/events/tabs/Gallery";
import { Organizer } from "@/components/events/tabs/Organizer";
import { QA } from "@/components/events/tabs/QA";
import { Tickets } from "@/components/events/tabs/Tickets";

interface EventPageProps {
  params: Promise<{ locale: string; eventId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { locale, eventId } = await params;
  const { event } = await getEvent(eventId);
  return buildMetadata({
    locale: locale as Locale,
    path: `/eventos/${eventId}`,
    title: event?.title,
    description: event?.details ? stripHtml(event.details) : undefined,
    image: event?.coverUrl ?? undefined,
  });
}

export default async function EventPage({ params, searchParams }: EventPageProps) {
  const { locale, eventId } = await params;
  const { tab } = await searchParams;
  setRequestLocale(locale);

  const { event } = await getEvent(eventId);
  if (!event) notFound();

  const [ratingForm, override, tNav] = await Promise.all([
    getActiveRatingForm(event.id),
    getEventOverride(event.id),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  // Sections that only make sense with real data behind them stay hidden
  // until that data exists: "Ao Vivo" needs a live link set in Pulse,
  // "Perguntas" needs the admin to turn it on for this event (toggle on
  // the admin's Perguntas screen, 2026-10-10) — off by default so a new
  // event doesn't show an empty Q&A section before anyone's opted in.
  const hiddenTabs: EventTabKey[] = [
    ...(override?.qaEnabled ? [] : (["qa"] as const)),
    ...(event.location.eventLink ? [] : (["live"] as const)),
  ];
  const visibleKeys = EVENT_TAB_DISPLAY_ORDER.filter((key) => !hiddenTabs.includes(key));

  // `?tab=` only picks which slide EventShell opens on (e.g. the "Voltar"
  // link from a panel's own detail page) — there's no more continuous
  // URL-syncing while flipping through slides, since that's all client
  // state now (see EventShell).
  const initialKey: EventTabKey | undefined =
    EVENT_TAB_KEYS.includes(tab as EventTabKey) && visibleKeys.includes(tab as EventTabKey)
      ? (tab as EventTabKey)
      : undefined;

  // Visual override is presentation-only — a layer the admin panel sets
  // in Supabase, applied here on top of what Pulse returns. Pulse itself
  // is never written to; with no override this is a no-op either way.
  const displayEvent = override?.coverImageUrl ? { ...event, coverUrl: override.coverImageUrl } : event;
  const accentStyle = override?.accentColor
    ? ({
        "--brand-red": override.accentColor,
        "--brand-red-deep": darkenHex(override.accentColor),
      } as React.CSSProperties)
    : undefined;

  function sectionNode(event: NonNullable<Awaited<ReturnType<typeof getEvent>>["event"]>, key: EventTabKey): React.ReactNode {
    switch (key) {
      case "details":
        return <EventDetails event={event} />;
      case "news":
        return <News eventId={event.id} />;
      case "live":
        return <Live eventLink={event.location.eventLink} scheduleDates={event.scheduleDates} />;
      case "program":
        return <Program eventId={event.id} sections={event.sections} speakers={event.speakers} />;
      case "speakers":
        return (
          <Oradores
            eventId={event.id}
            isFree={isEventFree(event)}
            speakers={buildSpeakerDirectory(event.speakers, event.sections)}
          />
        );
      case "gallery":
        return <Gallery eventId={event.id} isMaterialPublic={event.isMaterialPublic} />;
      case "organizer":
        return (
          <Organizer organizedBy={event.organizedBy} partnershipSections={event.partnershipSections} />
        );
      case "qa":
        return <QA eventId={event.id} sections={event.sections} />;
      case "tickets":
        return (
          <Tickets
            eventId={event.id}
            tickets={event.tickets}
            scheduleDates={event.scheduleDates}
            form={event.form}
          />
        );
    }
  }

  const sections: EventSectionDef[] = visibleKeys.map((key) => ({ key, node: sectionNode(event, key) }));

  return (
    <div style={accentStyle}>
      <JsonLd
        data={breadcrumbSchema(locale as Locale, [
          { name: tNav("events"), path: "/eventos" },
          { name: event.title, path: `/eventos/${eventId}` },
        ])}
      />
      <JsonLd data={eventSchema(event, eventId, locale as Locale, stripHtml(event.details, 500))} />
      {ratingForm && <RatingPopup eventId={event.id} form={ratingForm} coverUrl={displayEvent.coverUrl} />}
      <EventShell event={displayEvent} sections={sections} initialKey={initialKey} />
    </div>
  );
}
