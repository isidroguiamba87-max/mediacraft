"use client";

import { useState } from "react";
import { SpeakerPopup, type PopupSpeaker } from "./SpeakerPopup";

/**
 * Wraps any speaker avatar/name markup in a click target that opens the
 * shared {@link SpeakerPopup} — used both inside PanelPosters' own slides
 * and, since 2026-11-17, inside Programa's session cards. Those cards are
 * themselves a `<Link>` to the session's detail page, so the click here
 * stops it from also navigating.
 */
export function SpeakerButton({
  speaker,
  sessions,
  logoUrl,
  eventTitle,
  className,
  children,
}: {
  speaker: PopupSpeaker;
  sessions: { label: string; title: string }[];
  logoUrl: string | null;
  eventTitle: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        className={className}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {children}
      </button>
      {open && (
        <SpeakerPopup
          speaker={speaker}
          sessions={sessions}
          onClose={() => setOpen(false)}
          logoUrl={logoUrl}
          eventTitle={eventTitle}
        />
      )}
    </>
  );
}
