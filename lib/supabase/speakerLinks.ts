import { randomUUID } from "node:crypto";
import { createClient } from "./server";
import { createServiceClient } from "./service";

/** Admin-side: the token for one event+speaker, creating it on first
 * request. Idempotent on purpose — re-clicking "copiar link" must return
 * the same link every time rather than minting a new one and silently
 * breaking a copy already sent to the panelist. */
export async function getOrCreateSpeakerLink(eventId: string, speakerName: string): Promise<string> {
  const supabase = await createClient();
  const { data: existing, error: selectError } = await supabase
    .from("question_speaker_links")
    .select("token")
    .eq("event_id", eventId)
    .eq("speaker_name", speakerName)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return existing.token as string;

  const token = randomUUID().replace(/-/g, "");
  const { error: insertError } = await supabase
    .from("question_speaker_links")
    .insert({ event_id: eventId, speaker_name: speakerName, token });
  if (insertError) throw insertError;
  return token;
}

/** Public /responder/[token] side: resolves a token to the event+speaker
 * it's scoped to. Uses the service client — an anonymous panelist has no
 * admin session, and `question_speaker_links` is otherwise admin-only. */
export async function resolveSpeakerToken(
  token: string,
): Promise<{ eventId: string; speakerName: string } | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("question_speaker_links")
    .select("event_id, speaker_name")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  return data ? { eventId: data.event_id, speakerName: data.speaker_name } : null;
}
