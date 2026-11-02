"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Menu,
  Mic,
  Newspaper,
  Radio,
  Ticket,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { EventHero } from "./EventHero";
import { EventFooter } from "./EventFooter";
import { NetworkingPrompt } from "@/components/networking/NetworkingPrompt";
import type { EventTabKey } from "@/lib/events/tabs";
import type { PulseEventDetail } from "@/lib/pulse/types";

const TAB_ICONS: Record<EventTabKey, LucideIcon> = {
  details: Info,
  news: Newspaper,
  live: Radio,
  program: CalendarDays,
  speakers: Mic,
  gallery: ImageIcon,
  organizer: Users,
  qa: HelpCircle,
  tickets: Ticket,
};

export interface EventSectionDef {
  key: EventTabKey;
  node: React.ReactNode;
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
        "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap shadow-sm transition-colors",
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
}: {
  event: PulseEventDetail;
  sections: EventSectionDef[];
  initialKey?: EventTabKey;
}) {
  const t = useTranslations("eventTabs");
  const initialIndex = initialKey ? sections.findIndex((s) => s.key === initialKey) : -1;
  const [index, setIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const active = sections[index];

  const goTo = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(sections.length - 1, next)));
    },
    [sections.length],
  );

  return (
    <div className="flex flex-col">
      <EventHero
        event={event}
        onTicketsClick={() => goTo(sections.findIndex((s) => s.key === "tickets"))}
      />

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

      <div className="relative flex flex-col md:flex-row-reverse">
        <nav
          className="hidden shrink-0 gap-2 overflow-x-auto px-4 py-3 md:sticky md:top-24 md:flex md:w-56 md:flex-col md:self-start md:overflow-x-visible md:px-4 md:py-6 lg:w-64"
          aria-label="Event sections"
        >
          {sections.map((s, i) => (
            <TabPill key={s.key} tabKey={s.key} label={t(s.key)} isActive={i === index} onSelect={() => goTo(i)} />
          ))}
        </nav>

        <div className="min-w-0 flex-1 px-4 pb-4 md:px-6 md:pb-6">
          <div className="relative min-h-[240px] bg-paper">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: TRANSITION_MS / 1000, ease: "easeOut" }}
              >
                <div className="p-6 sm:p-8 lg:p-10">
                  <h2 className="font-display text-2xl text-brand-navy sm:text-3xl">{t(active.key)}</h2>
                  <div className="mt-6">{active.node}</div>
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
