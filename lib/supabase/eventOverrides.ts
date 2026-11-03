import { createClient } from "./server";
import { finalizeImageUpload } from "./mediaUpload";
import { logAdminAction } from "./auditLog";

export interface AdminEventOverride {
  eventId: string;
  coverImageUrl: string | null;
  accentColor: string | null;
  qaEnabled: boolean;
  updatedAt: string;
}

interface EventOverrideRow {
  event_id: string;
  cover_image_url: string | null;
  accent_color: string | null;
  qa_enabled: boolean | null;
  updated_at: string;
}

function mapRow(row: EventOverrideRow): AdminEventOverride {
  return {
    eventId: row.event_id,
    coverImageUrl: row.cover_image_url,
    accentColor: row.accent_color,
    qaEnabled: row.qa_enabled ?? false,
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

/** Kept separate from `saveEventOverride`: toggled from the admin's
 * Perguntas screen rather than the event's visual-override form, and an
 * upsert with only `qa_enabled` in the payload leaves cover/accent
 * columns untouched on an existing row (Postgrest only SETs the columns
 * it's given on conflict). */
export async function setQaEnabled(eventId: string, enabled: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_overrides")
    .upsert(
      { event_id: eventId, qa_enabled: enabled, updated_at: new Date().toISOString() },
      { onConflict: "event_id" },
    );
  if (error) throw error;
  await logAdminAction("event_override.set_qa_enabled", `event_overrides:${eventId}`, { enabled });
}

/** `tempPath` already holds the raw file, uploaded directly from the
 * browser — see lib/supabase/clientUpload.ts and finalizeImageUpload. */
export async function uploadEventCover(tempPath: string): Promise<string> {
  const supabase = await createClient();
  return finalizeImageUpload(supabase, tempPath, "events");
}
