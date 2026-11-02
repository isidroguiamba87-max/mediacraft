import { createClient } from "./server";

export interface AdminAuditLogEntry {
  id: string;
  actorEmail: string;
  action: string;
  resource: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

/** Last N entries, newest first — for the admin's own "Atividade
 * recente" view (app/admin/seguranca). Admin-only via RLS, same as
 * every other read in this file's call sites. */
export async function listRecentAuditLog(limit = 20): Promise<AdminAuditLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("id, actor_email, action, resource, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as {
    id: string;
    actor_email: string;
    action: string;
    resource: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }[]).map((row) => ({
    id: row.id,
    actorEmail: row.actor_email,
    action: row.action,
    resource: row.resource,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}

/**
 * Records one admin action — who, what, when (from, implicitly, is the
 * `created_at`/`actor_id` pair; see `admin_audit_log` in schema.sql,
 * append-only by RLS). Wired into the admin mutations that actually
 * change what the public site shows (news publish/update/delete, event
 * overrides, gallery removal) — not every single admin read or every
 * internal moderation toggle, which would be a much larger pass than
 * this one. Extend by calling this from any other mutation that deserves
 * the same accountability.
 *
 * Never throws: a logging failure must never block the actual admin
 * action it's recording. Failures go to the server console instead,
 * same as any other best-effort side effect in this codebase.
 */
export async function logAdminAction(
  action: string,
  resource: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("admin_audit_log").insert({
      actor_id: user.id,
      actor_email: user.email ?? "unknown",
      action,
      resource,
      metadata: metadata ?? null,
    });
    if (error) console.error("[audit] failed to record action:", action, resource, error);
  } catch (err) {
    console.error("[audit] failed to record action:", action, resource, err);
  }
}
