"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PillDropdown } from "@/components/ui/PillDropdown";
import { GalleryGrid } from "@/components/events/tabs/GalleryGrid";
import type { AllGalleryItem } from "@/lib/bff/gallery";

const ALL = "";

export interface GalleryEventOption {
  id: string;
  title: string;
  /** The event's own section names, in its order (Pulse agenda sections). */
  sections: string[];
}

/**
 * The general gallery (2026-11-11): every event's published photos in one
 * place. First red pill = which event ("Todos os eventos" or one); the
 * second (inside GalleryGrid) = which section of it ("Todos os dias",
 * Painel, Sessões… — whatever sections the photos were filed under), plus
 * Vídeos when there are any. Changing event remounts the grid so its
 * section filter resets.
 */
export function GlobalGallery({
  items,
  events,
}: {
  items: AllGalleryItem[];
  events: GalleryEventOption[];
}) {
  const t = useTranslations("galeria");
  const [eventId, setEventId] = useState(ALL);

  const shown = eventId === ALL ? items : items.filter((i) => i.eventId === eventId);
  const selected = events.find((e) => e.id === eventId);

  const eventPicker =
    events.length > 1 ? (
      <PillDropdown
        ariaLabel={t("eventFilter")}
        align="left"
        size="md"
        value={eventId}
        onChange={setEventId}
        options={[
          { value: ALL, label: t("allEvents") },
          ...events.map((e) => ({ value: e.id, label: e.title })),
        ]}
      />
    ) : undefined;

  if (items.length === 0) {
    return <p className="text-sm text-slate">{t("empty")}</p>;
  }

  return (
    <GalleryGrid
      key={eventId}
      items={shown}
      leading={eventPicker}
      sectionOrder={selected?.sections}
    />
  );
}
