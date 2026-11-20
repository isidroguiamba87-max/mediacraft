import { createClient } from "./server";
import { finalizeImageUpload } from "./mediaUpload";
import { logAdminAction } from "./auditLog";
import { cleanLiveInfo, type EventLiveInfo } from "@/lib/events/liveInfo";

export interface AdminEventOverride {
  eventId: string;
  coverImageUrl: string | null;
  accentColor: string | null;
  /** Cover overlay colour + strength, "#rrggbbaa" (null = default navy 60%). */
  overlayColor: string | null;
  /** The event's own logo, shown in the event page's top bar. */
  logoUrl: string | null;
  /** Theme / subtitle line under the event name on its first screen. */
  tagline: string | null;
  liveInfo: EventLiveInfo | null;
  /** The programme PDF (public Storage URL) and when it was last replaced. */
  programPdfUrl: string | null;
  programPdfUpdatedAt: string | null;
  qaEnabled: boolean;
  /** Which home-page section lists it: "Eventos" (default) or "Comunicação". */
  category: EventCategory;
  /** Comunicação only: where it aired, e.g. "TVM, YouTube, Redes Sociais". */
  channels: string | null;
  updatedAt: string;
}

export type EventCategory = "evento" | "comunicacao";

interface EventOverrideRow {
  event_id: string;
  cover_image_url: string | null;
  accent_color: string | null;
  /** Absent until supabase/migrations/2026-11-13_event_overlay_color.sql runs. */
  overlay_color?: string | null;
  /** Absent until supabase/migrations/2026-11-13_event_logo_tagline.sql runs. */
  logo_url?: string | null;
  tagline?: string | null;
  /** Absent until supabase/migrations/2026-11-13_event_live_info.sql runs. */
  live_info?: unknown;
  /** Absent until supabase/migrations/2026-11-19_event_program_pdf.sql runs. */
  program_pdf_url?: string | null;
  program_pdf_updated_at?: string | null;
  qa_enabled: boolean | null;
  /** Absent until supabase/migrations/2026-11-19_event_category.sql runs. */
  category?: string | null;
  channels?: string | null;
  updated_at: string;
}

function mapRow(row: EventOverrideRow): AdminEventOverride {
  return {
    eventId: row.event_id,
    coverImageUrl: row.cover_image_url,
    accentColor: row.accent_color,
    overlayColor: row.overlay_color ?? null,
    logoUrl: row.logo_url ?? null,
    tagline: row.tagline ?? null,
    liveInfo: cleanLiveInfo(row.live_info),
    programPdfUrl: row.program_pdf_url ?? null,
    programPdfUpdatedAt: row.program_pdf_updated_at ?? null,
    qaEnabled: row.qa_enabled ?? false,
    category: row.category === "comunicacao" ? "comunicacao" : "evento",
    channels: row.channels ?? null,
    updatedAt: row.updated_at,
  };
}

export async function getEventOverride(eventId: string): Promise<AdminEventOverride | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_overrides")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as EventOverrideRow) : null;
}

/** Bulk lookup for screens that list several events at once (e.g. the
 * admin's Perguntas page) — one query instead of N. Events with no
 * override row just aren't in the returned map; callers treat that the
 * same as `qaEnabled: false`. */
export async function listEventOverrides(eventIds: string[]): Promise<Map<string, AdminEventOverride>> {
  if (eventIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase.from("event_overrides").select("*").in("event_id", eventIds);

  if (error) throw error;
  return new Map((data as EventOverrideRow[]).map((row) => [row.event_id, mapRow(row)]));
}

export interface EventOverrideInput {
  coverImageUrl: string | null;
  accentColor: string | null;
  /** undefined = leave as is, null = back to the default shadow. */
  overlayColor?: string | null;
  /** undefined = leave as is (also keeps saving working before the
   * logo/tagline migration has run), null = clear. */
  logoUrl?: string | null;
  tagline?: string | null;
  liveInfo?: EventLiveInfo | null;
  /** undefined = leave as is; null = remove. Setting it stamps the date. */
  programPdfUrl?: string | null;
  /** undefined = leave as is (keeps saving working before the category
   * migration has run). */
  category?: EventCategory;
  channels?: string | null;
}

/** Upsert on `event_id` — there's at most one override row per Pulse
 * event, created the first time the admin changes anything. */
export async function saveEventOverride(
  eventId: string,
  input: EventOverrideInput,
): Promise<AdminEventOverride> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_overrides")
    .upsert(
      {
        event_id: eventId,
        cover_image_url: input.coverImageUrl,
        accent_color: input.accentColor,
        // Only sent when set, so saving cover/accent still works on a
        // database where the overlay_color migration hasn't run yet.
        ...(input.overlayColor !== undefined ? { overlay_color: input.overlayColor } : {}),
        ...(input.logoUrl !== undefined ? { logo_url: input.logoUrl } : {}),
        ...(input.tagline !== undefined ? { tagline: input.tagline } : {}),
        ...(input.liveInfo !== undefined ? { live_info: input.liveInfo } : {}),
        ...(input.programPdfUrl !== undefined
          ? {
              program_pdf_url: input.programPdfUrl,
              program_pdf_updated_at: input.programPdfUrl ? new Date().toISOString() : null,
            }
          : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.channels !== undefined ? { channels: input.channels } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  const saved = mapRow(data as EventOverrideRow);
  await logAdminAction("event_override.save", `event_overrides:${eventId}`, {
    coverImageUrl: saved.coverImageUrl,
    accentColor: saved.accentColor,
    overlayColor: saved.overlayColor,
  });
  return saved;
}

/** Drops the override entirely — the event goes back to showing exactly
 * what Pulse has, with nothing left behind. */
export async function clearEventOverride(eventId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("event_overrides").delete().eq("event_id", eventId);
  if (error) throw error;
  await logAdminAction("event_override.clear", `event_overrides:${eventId}`);
}


/** `tempPath` already holds the raw file, uploaded directly from the
 * browser — see lib/supabase/clientUpload.ts and finalizeImageUpload. */
export async function uploadEventCover(tempPath: string): Promise<string> {
  const supabase = await createClient();
  return finalizeImageUpload(supabase, tempPath, "events");
}
