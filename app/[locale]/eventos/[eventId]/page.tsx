import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getEvent } from "@/lib/pulse/endpoints";
import { getActiveRatingForm, getEventOverride } from "@/lib/bff";
import { buildPanels, buildSpeakerDirectory, speakerSlug } from "@/lib/pulse/panels";
import { stripHtml, darkenHex, formatDateRange, formatEventLocation, scheduleDateRange } from "@/lib/utils";
import type { Locale } from "@/config/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema, eventSchema } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { EventShell, type EventSectionDef } from "@/components/events/EventShell";
import { PanelPosters, type PosterPanel } from "@/components/events/tabs/PanelPosters";
import { formatEventDays } from "@/lib/events/dates";
import { EVENT_TAB_DISPLAY_ORDER, EVENT_TAB_KEYS, type EventTabKey } from "@/lib/events/tabs";
import { RatingPopup } from "@/components/events/RatingPopup";
import { EventDetails } from "@/components/events/tabs/EventDetails";
import { Live } from "@/components/events/tabs/Live";
import { Program } from "@/components/events/tabs/Program";
import { Gallery } from "@/components/events/tabs/Gallery";
import { Organizer } from "@/components/events/tabs/Organizer";
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

  const [ratingForm, override, tNav, tSpeakers, tTabs] = await Promise.all([
    getActiveRatingForm(event.id),
    getEventOverride(event.id),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "speakersDirectory" }),
    getTranslations({ locale, namespace: "eventTabs" }),
  ]);

  // Sections that only make sense with real data behind them stay hidden
  // until that data exists: "Ao Vivo" needs a live link (Pulse or admin).
  const speakerDirectory = buildSpeakerDirectory(event.speakers, event.sections);
  // No speakers at all → no "Oradores"/"Painéis" section (nothing to show).
  const hiddenTabs: EventTabKey[] = [
    ...(speakerDirectory.length > 0 ? [] : (["speakers"] as const)),
    ...(event.location.eventLink || override?.liveInfo?.joinUrl ? [] : (["live"] as const)),
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
  const accentStyle =
    override?.accentColor || override?.overlayColor
      ? ({
          ...(override.accentColor
            ? { "--brand-red": override.accentColor, "--brand-red-deep": darkenHex(override.accentColor) }
            : {}),
          // the shadow over the event's cover (EventHero), set in the admin
          // "#rrggbbaa" or "#a,#b" for a left→right gradient
          ...(override.overlayColor
            ? {
                "--event-overlay": override.overlayColor.includes(",")
                  ? `linear-gradient(100deg, ${override.overlayColor.split(",").join(", ")})`
                  : override.overlayColor,
              }
            : {}),
        } as React.CSSProperties)
      : undefined;

  function sectionNode(event: NonNullable<Awaited<ReturnType<typeof getEvent>>["event"]>, key: EventTabKey): React.ReactNode {
    switch (key) {
      case "details":
        return <EventDetails event={event} />;
      case "live":
        return (
          <Live
            eventLink={event.location.eventLink}
            scheduleDates={event.scheduleDates}
            coverUrl={override?.coverImageUrl ?? event.coverUrl}
            liveInfo={override?.liveInfo ?? null}
          />
        );
      case "program":
        return (
          <Program
            eventId={event.id}
            sections={event.sections}
            speakers={event.speakers}
            eventTitle={event.title}
            logoUrl={override?.logoUrl ?? null}
          />
        );
      case "speakers": {
        // "Painéis & Sessões" as posters (2026-11-13): one slide per panel
        // with speakers, plus "Outros oradores" for anyone on no session.
        const withSpeakers = buildPanels(event.sections).filter((p) => p.speakers.length > 0);
        const posterPanels: PosterPanel[] = withSpeakers.map((p, i) => ({
          key: p.key,
          label: tSpeakers("panelLabel", { n: i + 1 }),
          title: p.title,
          speakers: p.speakers.map((sp) => ({
            slug: speakerSlug(sp.name, sp.company),
            name: sp.name,
            role: [sp.occupation, sp.company].filter(Boolean).join(", "),
            occupation: sp.occupation || undefined,
            company: sp.company || undefined,
            photoUrl: sp.photoUrl,
          })),
        }));
        const unassigned = speakerDirectory.filter((sp) => sp.sessions.length === 0);
        if (unassigned.length > 0) {
          posterPanels.push({
            key: "__others",
            label: tSpeakers("others"),
            title: tSpeakers("othersTitle"),
            speakers: unassigned.map((sp) => ({
              slug: sp.slug,
              name: sp.name,
              role: [sp.occupation, sp.company].filter(Boolean).join(", "),
              occupation: sp.occupation || undefined,
              company: sp.company || undefined,
              photoUrl: sp.photoUrl,
            })),
          });
        }
        const days = formatEventDays(
          event.scheduleDates.map((d) => d.date),
          locale,
        );
        const range = scheduleDateRange(event.scheduleDates);
        return (
          <PanelPosters
            eventId={eventId}
            eventTitle={event.title}
            logoUrl={override?.logoUrl ?? null}
            coverUrl={override?.coverImageUrl ?? event.coverUrl}
            dateLabel={
              days
                ? `${days.days}, ${days.month}, ${days.year}`
                : range
                  ? formatDateRange(range.start, range.end, locale)
                  : null
            }
            venueLabel={event.location?.name ? formatEventLocation(event.location) : null}
            panels={posterPanels}
            partners={(event.partnershipSections ?? []).flatMap((s) =>
              s.partnerships
                .filter((p) => p.logoUrl)
                .map((p) => ({ name: p.name, logoUrl: p.logoUrl, link: p.link })),
            )}
          />
        );
      }
      case "gallery":
        return <Gallery eventId={event.id} isMaterialPublic={event.isMaterialPublic} />;
      case "organizer":
        return (
          <Organizer event={event} />
        );
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

  const sections: EventSectionDef[] = visibleKeys.map((key) => ({
    key,
    node: sectionNode(event, key),
    // Speakers are organised by panel, so that section is headed "Painéis".
    title:
      key === "speakers"
        ? tSpeakers("panelsTitle")
        : key === "organizer"
          ? tTabs("partnersSupport")
          : undefined,
    keepTitleCase: false,
  }));

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
      <EventShell
        event={displayEvent}
        sections={sections}
        initialKey={initialKey}
        logoUrl={override?.logoUrl ?? null}
        tagline={override?.tagline ?? null}
      />
    </div>
  );
}
