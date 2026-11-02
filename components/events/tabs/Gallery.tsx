import { getEventGallery } from "@/lib/bff";
import { getEventMaterials } from "@/lib/pulse/endpoints";
import { GalleryGrid } from "./GalleryGrid";
import { Library } from "./Library";

/** Real gallery (2026-10-01) — reads published images/videos for this
 * event from the admin panel's Supabase tables (see lib/supabase/gallery.ts
 * for the admin CRUD).
 *
 * "Documentos" (2026-10-09) is a third category alongside Fotos/Vídeos,
 * part of the Gallery's own top switcher — shows Library, i.e. Pulse's
 * ticket-gated materials (2026-10-10: admin-uploaded documents retired,
 * "todos os documentos virão da plataforma Pulse"). */
export async function Gallery({ eventId, isMaterialPublic }: { eventId: string; isMaterialPublic: boolean }) {
  const [items, { materials, locked }] = await Promise.all([
    getEventGallery(eventId),
    getEventMaterials(eventId),
  ]);

  return (
    <GalleryGrid
      items={items}
      documentsSlot={
        <Library eventId={eventId} initialMaterials={materials} initialLocked={locked} isPublic={isMaterialPublic} />
      }
    />
  );
}
