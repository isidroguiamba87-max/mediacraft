import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/config/i18n";
import { buildMetadata } from "@/lib/seo";
import { personSchema, servicesSchema } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { services } from "@/content/services";
import { team } from "@/content/team";
import { getPublicEvents } from "@/lib/pulse/endpoints";
import { getEventPlacements } from "@/lib/bff";
import { earliestScheduleDate } from "@/lib/utils";
import type { PulseEvent } from "@/lib/pulse/types";
import { ScrollThread } from "@/components/showcase/ScrollThread";
import { ThreadStation } from "@/components/showcase/ThreadStation";
import { ShowcaseHero } from "@/components/showcase/ShowcaseHero";
import { NumbersStation } from "@/components/showcase/NumbersStation";
import { ServicesOrbit } from "@/components/showcase/ServicesOrbit";
import { HomeEventsGrid } from "@/components/onepage/HomeEventsGrid";
import Image from "next/image";
import { Intro } from "@/components/about/Intro";
import { MissionVision } from "@/components/about/MissionVision";
import { History } from "@/components/about/History";
import { Team } from "@/components/about/Team";
import { GallerySection } from "@/components/onepage/GallerySection";
import { ContactSection } from "@/components/onepage/ContactSection";
import { Partners } from "@/components/home/Partners";
import { CTA } from "@/components/home/CTA";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  return buildMetadata({
    locale: locale as Locale,
    path: "",
    title: t("title"),
    description: t("description"),
  });
}

/** Start date for ordering / the year filter (falls back to createdAt —
 * Pulse drops past schedule dates). Same rule as the /eventos page. */
function startTime(e: PulseEvent) {
  return new Date(earliestScheduleDate(e.scheduleDates) ?? e.createdAt);
}

/** "Recentes": upcoming soonest-first, then past most-recent-first. */
function byRecent(events: PulseEvent[]): PulseEvent[] {
  const now = Date.now();
  return [...events].sort((a, b) => {
    const at = startTime(a).getTime();
    const bt = startTime(b).getTime();
    const au = at >= now;
    const bu = bt >= now;
    if (au !== bu) return au ? -1 : 1;
    return au ? at - bt : bt - at;
  });
}

/** Wrapper giving each screen its anchor id + the sticky header offset. */
function Anchor({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-20 ${className ?? ""}`}>
      {children}
    </section>
  );
}

/**
 * The whole site on one scrolling page (2026-11-11 brief). Order:
 * #inicio hero → #impacto numbers → #o-que-fazemos → #eventos →
 * #sobre-nos (intro, missão/visão/valores, história) → #equipa →
 * #galeria → #contacto → parceiros + CTA → footer (layout).
 * Hero and "O que fazemos" change state on their own, in place; scroll only
 * ever moves between screens and is never held.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tServices, tMembers] = await Promise.all([
    getTranslations({ locale, namespace: "services.items" }),
    getTranslations({ locale, namespace: "team.members" }),
  ]);
  const serviceList = services.map((s) => ({
    title: tServices(`${s.id}.title`),
    description: tServices(`${s.id}.description`),
  }));

  const { events } = await getPublicEvents({});
  const placements = await getEventPlacements(events.map((e) => e.id));
  const all = byRecent(events).map((event) => ({
    event,
    year: startTime(event).getFullYear(),
    channels: placements.get(event.id)?.channels ?? null,
    isCommunication: placements.get(event.id)?.category === "comunicacao",
  }));
  // Eventos vs Comunicação is set per event in the admin ("Visual do Evento").
  const ordered = all.filter((e) => !e.isCommunication);
  const communication = all.filter((e) => e.isCommunication);
  const thisYear = new Date().getFullYear();
  const yearsFor = (list: { year: number }[]) =>
    [...new Set([thisYear, thisYear - 1, thisYear - 2, thisYear - 3, ...list.map((e) => e.year)])].sort(
      (a, b) => b - a,
    );
  const years = yearsFor(ordered);

  return (
    <ScrollThread>
      <JsonLd data={servicesSchema(serviceList)} />
      {team.map((member) => (
        <JsonLd key={member.id} data={personSchema(member, tMembers(`${member.id}.role`))} />
      ))}

      <Anchor id="inicio">
        <ThreadStation>
          <ShowcaseHero />
        </ThreadStation>
      </Anchor>

      <Anchor id="impacto">
        <ThreadStation>
          <NumbersStation />
        </ThreadStation>
      </Anchor>

      <Anchor id="o-que-fazemos">
        <ThreadStation>
          <ServicesOrbit />
        </ThreadStation>
      </Anchor>

      <Anchor id="eventos" className="bg-white lg:flex lg:min-h-[calc(100svh-5rem)] lg:items-center">
        <HomeEventsGrid
          events={ordered}
          years={years}
          communication={communication}
          communicationYears={yearsFor(communication)}
        />
      </Anchor>

      <Anchor id="sobre-nos">
        {/* Client mock 2026-11-19: "Sobre nós" + Missão/Visão/Valores sit on
            the event group photo under a deep navy veil. */}
        <div className="relative isolate overflow-hidden bg-[#1f2340]">
          <Image
            src="/images/about/intro-evento.png"
            alt=""
            fill
            sizes="100vw"
            // the PNG has white rounded corners baked in — scale past them
            className="-z-10 scale-110 object-cover"
          />
          <span aria-hidden className="absolute inset-0 -z-10 bg-[#1f2340]/[0.88]" />
          <Intro />
          <MissionVision />
        </div>
        <History />
      </Anchor>

      <Anchor id="equipa">
        <Team />
      </Anchor>

      <Anchor id="galeria" className="bg-white">
        <GallerySection />
      </Anchor>

      <Anchor id="contacto" className="bg-white">
        <ContactSection />
      </Anchor>

      <Partners />
      <CTA />
    </ScrollThread>
  );
}
