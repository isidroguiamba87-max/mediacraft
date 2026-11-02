"use client";

import { useState } from "react";
import { Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectModal } from "./ConnectModal";
import type { NetworkingSource, SpeakerChannel } from "@/lib/networking/types";

export interface ConnectButtonSpeaker {
  name: string;
  company: string;
  channels: SpeakerChannel[];
}

/**
 * The single entry point into the networking funnel (2026-10-12 spec).
 * Two rules enforced here, not left to callers:
 *
 * - Renders nothing — not a disabled button — when the speaker has no
 *   channels. A disabled "Conectar" would promise something that isn't
 *   there.
 * - `sessionId` is required whenever `source === "session"`; this is the
 *   field most likely to get silently dropped when ConnectButton is
 *   reused across components (SessionSpeakerList, the Oradores tab, the
 *   speaker profile page), and a dropped `sessionId` quietly corrupts the
 *   organizer's "which sessions drove networking" metric. Thrown in dev
 *   only, so it's caught while wiring a new call site, not shipped as a
 *   crash.
 */
export function ConnectButton({
  speaker,
  eventId,
  isFree,
  source,
  sessionId,
  variant = "primary",
}: {
  speaker: ConnectButtonSpeaker;
  eventId: string;
  /** Decides which identity step ConnectModal shows — ticket QR code for
   * a paid event, a quick name+email capture for a free one (this site
   * has no participant login; see lib/networking/attendeeIdentity.ts). */
  isFree: boolean;
  source: NetworkingSource;
  sessionId?: string;
  variant?: "primary" | "compact";
}) {
  const [open, setOpen] = useState(false);

  if (process.env.NODE_ENV !== "production" && source === "session" && !sessionId) {
    throw new Error(
      'ConnectButton: sessionId is required when source is "session" — without it, the organizer\'s ' +
        "per-session networking metric silently breaks.",
    );
  }

  if (speaker.channels.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full font-medium transition-colors",
          variant === "primary"
            ? "bg-brand-red px-5 py-2.5 text-sm text-white hover:bg-brand-red-deep"
            : "border border-brand-red px-3.5 py-1.5 text-xs text-brand-red hover:bg-brand-red/10",
        )}
      >
        <Handshake size={variant === "primary" ? 16 : 13} />
        Conectar
      </button>

      <ConnectModal
        open={open}
        onClose={() => setOpen(false)}
        speaker={speaker}
        eventId={eventId}
        isFree={isFree}
        source={source}
        sessionId={sessionId ?? null}
      />
    </>
  );
}
