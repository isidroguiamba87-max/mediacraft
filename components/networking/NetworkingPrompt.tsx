"use client";

import { useEffect, useState } from "react";
import { Handshake, X } from "lucide-react";
import { isEventOngoing } from "@/lib/utils";

const SHOW_DELAY_MS = 2000;

function storageKey(eventId: string) {
  return `pulse:networking_prompt:${eventId}`;
}

/**
 * Discovery pop-up for the networking funnel (2026-10-12 spec) — copy is
 * exact, not to be reworded. A toast-style card, not a full-screen
 * takeover like RatingPopup: the spec is explicit that this "não deve
 * bloquear a utilização da plataforma", so there's no backdrop and
 * nothing behind it is blocked from scrolling or clicking.
 *
 * Shown once per device+event, the moment it's displayed (not on close,
 * so closing it immediately still counts — it must never reappear just
 * because someone dismissed it fast) — only while `isEventOngoing` is
 * true, recomputed client-side on mount rather than trusted from a
 * server-rendered boolean, since a cached page shouldn't show this with
 * a stale "ongoing" verdict from whenever it was last rendered.
 */
export function NetworkingPrompt({
  eventId,
  scheduleDates,
  onGoToAgenda,
}: {
  eventId: string;
  scheduleDates: { date: string; timeFrom: string; timeTo: string }[];
  onGoToAgenda: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isEventOngoing(scheduleDates)) return;
    try {
      if (localStorage.getItem(storageKey(eventId))) return;
    } catch {
      // Private browsing / storage blocked — just show it; worst case it
      // can reappear on a later visit, same tradeoff RatingPopup makes.
    }

    const id = setTimeout(() => {
      setVisible(true);
      try {
        localStorage.setItem(storageKey(eventId), "1");
      } catch {
        // Nothing to do — it just might reappear next visit.
      }
      // No analytics pipeline exists in this project yet — logged here as
      // a clear placeholder for `networking_prompt_shown`, same approach
      // as the networking-intent mock. Flagged in the final deliverables
      // list: real event tracking needs to be wired in separately.
      console.info("[networking] networking_prompt_shown", { eventId });
    }, SHOW_DELAY_MS);

    return () => clearTimeout(id);
  }, [eventId, scheduleDates]);

  if (!visible) return null;

  function onCtaClick() {
    console.info("[networking] networking_prompt_clicked", { eventId });
    setVisible(false);
    onGoToAgenda();
  }

  return (
    // top-right, not bottom — the mobile hamburger FAB (EventShell) and
    // the site's bottom nav bar already crowd the bottom of the screen.
    <div className="fixed top-20 right-4 z-40 w-[calc(100%-2rem)] max-w-sm">
      <div className="relative rounded-2xl border border-line bg-paper p-5 shadow-brand">
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Fechar"
          className="absolute top-3 right-3 rounded-full p-1 text-slate hover:bg-paper-2 hover:text-ink"
        >
          <X size={16} />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
          <Handshake size={17} />
        </div>
        <p className="mt-3 pr-5 font-display text-base text-brand-navy">Conecte-se com os oradores</p>
        <p className="mt-1.5 text-xs text-slate">
          Veja quem está a participar nas sessões e continue a conversa com os oradores através dos seus
          canais profissionais.
        </p>
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-4 w-full rounded-full bg-brand-red px-4 py-2.5 text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:bg-brand-red-deep"
        >
          Ver agenda e oradores
        </button>
      </div>
    </div>
  );
}
