import { createClient } from "./server";
import { finalizeImageUpload, finalizeVideoUpload } from "./mediaUpload";
import { logAdminAction } from "./auditLog";

export type GalleryMediaType = "image" | "video";

export interface AdminGalleryItem {
  id: string;
  eventId: string;
  type: GalleryMediaType;
  storageUrl: string | null;
  externalVideoUrl: string | null;
  caption: string | null;
  dayOrSession: string | null;
  sortOrder: number;
  published: boolean;
  /** The event album's cover photo (one per event). */
  isCover: boolean;
  createdAt: string;
}

interface GalleryRow {
  id: string;
  event_id: string;
  type: GalleryMediaType;
  storage_url: string | null;
  external_video_url: string | null;
  caption: string | null;
  day_or_session: string | null;
  sort_order: number;
  published: boolean;
  /** Absent until supabase/migrations/2026-11-20_gallery_album_cover.sql runs. */
  is_cover?: boolean | null;
  created_at: string;
}

function mapRow(row: GalleryRow): AdminGalleryItem {
  return {
    id: row.id,
    eventId: row.event_id,
    type: row.type,
    storageUrl: row.storage_url,
    externalVideoUrl: row.external_video_url,
    caption: row.caption,
    dayOrSession: row.day_or_session,
    sortOrder: row.sort_order,
    published: row.published,
    isCover: row.is_cover ?? false,
    createdAt: row.created_at,
  };
}

export async function listGallery(): Promise<AdminGalleryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_media")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as GalleryRow[]).map(mapRow);
}

export interface GalleryImageInput {
  eventId: string;
  caption: string;
  dayOrSession: string;
  /** Temp Storage path from lib/supabase/clientUpload.ts's
   * uploadToTempStorage — not the raw file (see finalizeImageUpload for
   * why: a Vercel Function's request body is capped well below what a
   * real photo needs). */
  tempPath: string;
}

/** Uploads one image to Storage and creates its row — called once per
 * file for a multi-file upload, so one bad file never blocks the rest. */
export async function addGalleryImage(input: GalleryImageInput): Promise<AdminGalleryItem> {
  const supabase = await createClient();
  const publicUrl = await finalizeImageUpload(supabase, input.tempPath, "gallery");

  const { data, error } = await supabase
    .from("gallery_media")
    .insert({
      event_id: input.eventId,
      type: "image",
      storage_url: publicUrl,
      caption: input.caption || null,
      day_or_session: input.dayOrSession || null,
      published: true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as GalleryRow);
}

export interface GalleryVideoInput {
  eventId: string;
  caption: string;
  dayOrSession: string;
  externalVideoUrl: string | null;
  /** Temp Storage path, or null when only `externalVideoUrl` was given
   * — see GalleryImageInput.tempPath. */
  tempPath: string | null;
}

export async function addGalleryVideo(input: GalleryVideoInput): Promise<AdminGalleryItem> {
  const supabase = await createClient();
  const storageUrl = input.tempPath ? await finalizeVideoUpload(supabase, input.tempPath, "gallery") : null;

  const { data, error } = await supabase
    .from("gallery_media")
    .insert({
      event_id: input.eventId,
      type: "video",
      storage_url: storageUrl,
      external_video_url: input.externalVideoUrl || null,
      caption: input.caption || null,
      day_or_session: input.dayOrSession || null,
      published: true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as GalleryRow);
}

export async function updateGalleryItem(
  id: string,
  input: { caption: string; dayOrSession: string; sortOrder: number; published: boolean },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_media")
    .update({
      caption: input.caption || null,
      day_or_session: input.dayOrSession || null,
      sort_order: input.sortOrder,
      published: input.published,
    })
    .eq("id", id);

  if (error) throw error;
}

/** Makes this photo the cover of its event's album — clears the previous
 * cover first (the database allows only one per event). */
export async function setGalleryCover(id: string, eventId: string): Promise<void> {
  const supabase = await createClient();
  const { error: clearError } = await supabase
    .from("gallery_media")
    .update({ is_cover: false })
    .eq("event_id", eventId)
    .eq("is_cover", true);
  if (clearError) throw clearError;
  const { error } = await supabase.from("gallery_media").update({ is_cover: true }).eq("id", id);
  if (error) throw error;
  await logAdminAction("gallery.cover", `gallery_media:${id}`, { eventId });
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("gallery_media").delete().eq("id", id);
  if (error) throw error;
  await logAdminAction("gallery.delete", `gallery_media:${id}`);
}
