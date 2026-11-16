import { randomBytes } from "node:crypto";
import { createClient } from "./server";
import { createServiceClient } from "./service";
import { logAdminAction } from "./auditLog";

/**
 * Panelists' interaction space (2026-11-13) — replaces the public Q&A. One
 * private link per event (`event_overrides.panel_token`); whoever has it
 * can read and post in `panel_messages`. Admin-side helpers use the admin
 * session (RLS); the public side uses the service client, and only after
 * the token has been checked against the event.
 */

export interface PanelMessage {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

const newToken = () => randomBytes(18).toString("base64url");

/** Admin: the event's link token, or null when none was generated yet. */
export async function getPanelToken(eventId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_overrides")
    .select("panel_token")
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) throw error;
  return (data?.panel_token as string | null) ?? null;
}

/** Admin: creates the token (or a new one, which revokes the old link). An
 * upsert with only these columns leaves the event's other visual settings
 * untouched. */
export async function setNewPanelToken(eventId: string): Promise<string> {
  const supabase = await createClient();
  const token = newToken();
  const { error } = await supabase
    .from("event_overrides")
    .upsert({ event_id: eventId, panel_token: token, updated_at: new Date().toISOString() }, { onConflict: "event_id" });
  if (error) throw error;
  await logAdminAction("panel_room.new_link", `event_overrides:${eventId}`);
  return token;
}

/** Admin: every message for one event, newest first. */
export async function listPanelMessagesAdmin(eventId: string): Promise<PanelMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("panel_messages")
    .select("id, name, message, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, message: r.message, createdAt: r.created_at }));
}

export async function deletePanelMessage(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("panel_messages").delete().eq("id", id);
  if (error) throw error;
  await logAdminAction("panel_room.delete_message", `panel_messages:${id}`);
}

/** Public: does this token open this event's space? */
export async function isValidPanelToken(eventId: string, token: string): Promise<boolean> {
  if (!token || token.length < 16) return false;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("event_overrides")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("panel_token", token)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/** Public (token already checked): messages, oldest first, last 300. */
export async function listPanelMessages(eventId: string): Promise<PanelMessage[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("panel_messages")
    .select("id, name, message, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? [])
    .map((r) => ({ id: r.id, name: r.name, message: r.message, createdAt: r.created_at }))
    .reverse();
}

/** Public (token already checked). */
export async function addPanelMessage(eventId: string, name: string, message: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("panel_messages")
    .insert({ event_id: eventId, name: name.slice(0, 80), message: message.slice(0, 2000) });
  if (error) throw error;
}
