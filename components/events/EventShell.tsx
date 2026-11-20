"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Image as ImageIcon,
  Info,
  Menu,
  Mic,
  Radio,
  Ticket,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Link } from "@/config/i18n";
import { CommunicationChoice, EventHero, EventTopBar, type CommunicationHero } from "./EventHero";
import { requestSessionFocus } from "@/lib/events/liveSession";
import { EventFooter } from "./EventFooter";
import { NetworkingPrompt } from "@/components/networking/NetworkingPrompt";
import type { EventTabKey } from "@/lib/events/tabs";
import type { PulseEventDetail } from "@/lib/pulse/types";

const TAB_ICONS: Record<EventTabKey, LucideIcon> = {
  details: Info,
  live: Radio,
  program: CalendarDays,
  speakers: Mic,
  gallery: ImageIcon,
  organizer: Users,
  tickets: Ticket,
};

export interface EventSectionDef {
  key: EventTabKey;
  node: React.ReactNode;
  /** Heading override for the section body (the side button keeps the tab label). */
  title?: string;
  /** Render the heading as written ("Painéis") instead of in caps. */
  keepTitleCase?: boolean;
}

// How long one section-change's fade+slide transition takes.
const TRANSITION_MS = 320;

function TabPill({
  tabKey,
  label,
  isActive,
  onSelect,
}: {
  tabKey: EventTabKey;
  label: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  const Icon = TAB_ICONS[tabKey];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap shadow-sm transition-colors",
        isActive
          ? "border-brand-red bg-brand-red text-white"
          : "border-line bg-paper text-ink hover:border-brand-red hover:text-brand-red",
      )}
    >
      <Icon size={14} className="shrink-0" />
      {label}
    </button>
  );
}

/**
 * The event micro-site — a normal scrolling page on every breakpoint
 * (2026-10-23 revert: "quando uma pessoa faz o scroll não pode aceitar
 * mudar de tela... a pessoa deve apertar no botão... quando fizer o
 * scroll apenas irá funcionar nessa tela/página onde estiver" — an
 * earlier version turned desktop into a fixed-frame "slideshow" where a
 * wheel/trackpad/swipe gesture advanced to the next tab; that's gone,
 * scrolling only ever scrolls the page itself now). Tabs switch only by
 * clicking a TabPill — the desktop sidebar or, on mobile, the
 * hamburger-FAB menu.
 */
export function EventShell({
  event,
  sections,
  initialKey,
  logoUrl = null,
  tagline = null,
  communication = null,
}: {
  event: PulseEventDetail;
  sections: EventSectionDef[];
  initialKey?: EventTabKey;
  /** The event's own logo / theme line, from the admin's "Visual do Evento". */
  logoUrl?: string | null;
  tagline?: string | null;
  /** Set when the admin marked this event as Comunicação — its first
   * screen then shows dates | channels, the description and "Saiba mais". */
  communication?: CommunicationHero | null;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const choiceRef = useRef<HTMLDivElement>(null);
  const galleryIndex = sections.findIndex((s) => s.key === "gallery");
  const programIndex = sections.findIndex((s) => s.key === "program");
  const ticketsIndex = sections.findIndex((s) => s.key === "tickets");
  const t = useTranslations("eventTabs");
  const initialIndex = initialKey ? sections.findIndex((s) => s.key === initialKey) : -1;
  const [index, setIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Past the cover, the floating "Voltar" goes translucent so it never hides
  // the content under it (client, 2026-11-17).
  const [pastCover, setPastCover] = useState(false);
  useEffect(() => {
    const onScroll = () => setPastCover(window.scrollY > 160);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const active = sections[index];

  const goTo = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(sections.length - 1, next)));
    },
    [sections.length],
  );

  return (
    <div className="flex flex-col">
      {/* Floating "Voltar" (2026-11-17): always on screen, takes the visitor
          out of the event back to the events list on the home page. Top
          left, just under the event's top bar (client: "deve estar na parte
          de cima"). */}
      <Link
        href="/#eventos"
        className={cn(
          "fixed top-[5.75rem] left-7 z-40 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 font-body text-sm font-bold ring-1 backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-brand-red hover:opacity-100 hover:shadow-[0_8px_24px_rgba(0,27,50,0.25)] focus-visible:bg-white focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red sm:left-11 lg:left-[3.75rem]",
          pastCover
            ? "bg-white/25 text-brand-navy/70 opacity-80 shadow-none ring-brand-navy/10"
            : "bg-white/95 text-brand-navy shadow-[0_8px_24px_rgba(0,27,50,0.25)] ring-brand-navy/10",
        )}
      >
        <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={2.6} />
        {t("backToEvents")}
      </Link>
      <EventTopBar logoUrl={logoUrl} title={event.title} />
      <EventHero
        event={event}
        tagline={tagline}
        communication={communication}
        onMoreClick={() =>
          (choiceRef.current ?? contentRef.current)?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        onProgramClick={
          programIndex >= 0
            ? () => {
                goTo(programIndex);
                contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            : null
        }
        onTicketsClick={
          ticketsIndex >= 0
            ? () => {
                goTo(ticketsIndex);
                contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            : null
        }
        onSessionClick={
          programIndex >= 0
            ? (key) => {
                goTo(programIndex);
                contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                // ask the Programa to switch day, scroll to the session and
                // highlight it (picked up on mount if it isn't open yet)
                requestSessionFocus(key);
              }
            : null
        }
      />

      {communication && (
        <div ref={choiceRef} className="scroll-mt-[4.5rem]">
          <CommunicationChoice
            event={event}
            channels={communication.channels}
            onProgramsClick={
              programIndex >= 0
                ? () => {
                    goTo(programIndex);
                    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                : null
            }
            onGalleryClick={
              galleryIndex >= 0
                ? () => {
                    goTo(galleryIndex);
                    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                : null
            }
          />
        </div>
      )}

      <NetworkingPrompt
        eventId={event.id}
        scheduleDates={event.scheduleDates}
        onGoToAgenda={() => goTo(sections.findIndex((s) => s.key === "program"))}
      />

      {/* Mobile hamburger FAB — desktop keeps the sidebar nav below. */}
      <div className="md:hidden">
        {mobileNavOpen && (
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-30 bg-brand-navy/40 backdrop-blur-[1px]"
          />
        )}
        <div className="fixed right-4 bottom-20 z-40 flex flex-col-reverse items-end gap-2">
          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Event sections"
            aria-expanded={mobileNavOpen}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors",
              mobileNavOpen ? "bg-brand-navy text-white" : "bg-brand-red text-white",
            )}
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {mobileNavOpen && (
            <nav
              className="flex max-h-[60vh] flex-col-reverse items-end gap-2 overflow-y-auto"
              aria-label="Event sections"
            >
              {sections.map((s, i) => (
                <TabPill
                  key={s.key}
                  tabKey={s.key}
                  label={t(s.key)}
                  isActive={i === index}
                  onSelect={() => {
                    goTo(i);
                    setMobileNavOpen(false);
                  }}
                />
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* Same side gutters as the hero card above (px-4 / sm:px-6 / lg:px-10),
          so the content's left edge and the buttons' right edge line up with
          the photo; one gap between content and buttons, no stacked paddings
          (2026-11-17: "muito espaçamento sem ser usado"). */}
      <div
        ref={contentRef}
        className="relative flex scroll-mt-4 flex-col px-4 sm:px-6 md:flex-row-reverse md:gap-6 lg:gap-8 lg:px-10"
      >
        <nav
          className="hidden shrink-0 gap-2 md:sticky md:top-6 md:flex md:w-44 md:flex-col md:self-start md:pt-2 lg:w-48"
          aria-label="Event sections"
        >
          {sections.map((s, i) => (
            <TabPill key={s.key} tabKey={s.key} label={t(s.key)} isActive={i === index} onSelect={() => goTo(i)} />
          ))}
        </nav>

        <div className="min-w-0 flex-1 pb-6 md:pb-10">
          <div className="relative min-h-[240px] bg-paper">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: TRANSITION_MS / 1000, ease: "easeOut" }}
              >
                <div className="pt-2">
                  <h2
                    className={cn(
                      "inline-block border-b-[1.5px] border-brand-red pb-3 font-body text-3xl leading-none font-bold tracking-tight text-brand-navy sm:text-4xl lg:text-5xl",
                      // Tab names render in caps (GALERIA); a custom heading
                      // ("Painéis") keeps its own casing, with the rule
                      // running on past the word as in the mock-up.
                      active.keepTitleCase ? "pr-14" : "uppercase",
                    )}
                  >
                    {active.title ?? t(active.key)}
                  </h2>
                  <div className="mt-8">{active.node}</div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <EventFooter />
    </div>
  );
}
