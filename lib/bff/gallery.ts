import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { EventGalleryItem } from "./index";

export interface AllGalleryItem extends EventGalleryItem {
  eventId: string;
}

/** Every published gallery item across ALL events, for the general
 * /galeria page (2026-11-11) — same rows the per-event Gallery tab reads,
 * just not scoped to one event_id. Same graceful empty fallback. */
export async function getAllGallery(): Promise<AllGalleryItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gallery_media")
      .select("id, event_id, type, storage_url, external_video_url, caption, day_or_session")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      eventId: row.event_id,
      type: row.type,
      storageUrl: row.storage_url,
      externalVideoUrl: row.external_video_url,
      caption: row.caption,
      dayOrSession: row.day_or_session,
    }));
  } catch {
    return [];
  }
}
