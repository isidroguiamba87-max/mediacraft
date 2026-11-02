"use client";

import { Avatar } from "@/components/events/tabs/Program";
import { withResolvedChannels } from "@/lib/networking/parseChannels";
import type { PulseSpeakerLink } from "@/lib/pulse/types";
import { ConnectButton } from "./ConnectButton";

/**
 * Renders a session's speaker grid and injects `sessionId` into every
 * `ConnectButton` it creates — the safest way to guarantee that context
 * never gets lost (2026-10-12 spec: `session_id` is the field "most
 * likely to get dropped", and a dropped one silently breaks the
 * organizer's per-session metric). Callers never pass `sessionId` to a
 * `ConnectButton` directly for this discovery path; they pass it once,
 * here.
 */
export function SessionSpeakerList({
  eventId,
  sessionId,
  isFree,
  speakers,
}: {
  eventId: string;
  sessionId: string;
  isFree: boolean;
  speakers: {
    name: string;
    company: string;
    occupation: string;
    photoUrl: string | null;
    links?: PulseSpeakerLink[];
  }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {speakers.map((sp, i) => (
        <div key={i} className="flex flex-col items-center rounded-brand border border-line p-4 text-center">
          <Avatar photoUrl={sp.photoUrl} name={sp.name} size={88} />
          <p className="mt-3 w-full truncate font-display text-base text-brand-navy">{sp.name}</p>
          {(sp.occupation || sp.company) && (
            <p className="mt-1 w-full truncate text-xs text-slate">
              {[sp.occupation, sp.company].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="mt-3">
            <ConnectButton
              speaker={withResolvedChannels(sp)}
              eventId={eventId}
              isFree={isFree}
              source="session"
              sessionId={sessionId}
              variant="compact"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
