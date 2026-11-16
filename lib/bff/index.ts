/**
 * "Backend for frontend" for features Pulse doesn't provide: event
 * Gallery and Ratings — all (2026-10-05) read from the admin panel's
 * own Supabase tables (see lib/supabase/*.ts for the admin-side CRUD).
 * Documents used to be one of these too, but moved to Pulse-only
 * (2026-10-10: "todos os documentos virão da plataforma Pulse") — see
 * lib/pulse/endpoints.ts's getEventMaterials instead.
 *
 * Exposed over HTTP for client polling via app/api/bff/** route handlers
 * (see components/events/tabs/QA.tsx for the client that polls it).
 */
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getEvent } from "@/lib/pulse/endpoints";
import { latestScheduleEnd } from "@/lib/utils";
import { cleanLiveInfo, type EventLiveInfo } from "@/lib/events/liveInfo";

export interface EventOverride {
  coverImageUrl: string | null;
  accentColor: string | null;
  /** Cover overlay "#rrggbbaa", null = default. */
  overlayColor: string | null;
  logoUrl: string | null;
  tagline: string | null;
  liveInfo: EventLiveInfo | null;
  qaEnabled: boolean;
}

export interface EventGalleryItem {
  id: string;
  type: "image" | "video";
  storageUrl: string | null;
  externalVideoUrl: string | null;
  caption: string | null;
  dayOrSession: string | null;
}

export interface RatingFormQuestion {
  id: string;
  type: "single_choice" | "multi_choice" | "text" | "scale";
  label: string;
  options: { value: string; label: string }[] | null;
  required: boolean;
}

export interface ActiveRatingForm {
  formId: string;
  questions: RatingFormQuestion[];
}

/** The admin's visual override for one Pulse event (cover photo, accent
 * color) — null if nothing was ever set, in which case the page just
 * shows exactly what Pulse has, unchanged. */
export async function getEventOverride(eventId: string): Promise<EventOverride | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("event_overrides")
      // "*" rather than a column list so a database that hasn't run the
      // overlay_color migration yet still returns the other fields.
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      coverImageUrl: data.cover_image_url,
      accentColor: data.accent_color,
      overlayColor: data.overlay_color ?? null,
      logoUrl: data.logo_url ?? null,
      tagline: data.tagline ?? null,
      liveInfo: cleanLiveInfo(data.live_info),
      qaEnabled: data.qa_enabled ?? false,
    };
  } catch {
    return null;
  }
}

/** Published gallery items for one event (images and videos together,
 * sorted the way the admin ordered them) — falls back to an empty list
 * rather than crashing, same reasoning as getEventNews. */
export async function getEventGallery(eventId: string): Promise<EventGalleryItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gallery_media")
      .select("id, type, storage_url, external_video_url, caption, day_or_session")
      .eq("event_id", eventId)
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
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

/** A participant registering a networking intent (2026-10-12) — our own
 * durable record, independent of whether Pulse's own networking-intents
 * endpoint exists (it doesn't yet). This is what makes the admin's
 * Networking metrics page show real, accumulating numbers instead of the
 * static example data it shipped with ("esses dados aí estão falsos...
 * podes usar dados reais"). anon can INSERT but not SELECT — see
 * lib/supabase/networkingIntents.ts for the admin-only aggregation reads. */
export async function addNetworkingIntent(input: {
  eventId: string;
  speakerId: string;
  sessionId: string | null;
  source: "session" | "speakers_directory";
  connectionReason: string;
  channel: string;
  attendeeId: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("networking_intents").insert({
    event_id: input.eventId,
    speaker_id: input.speakerId,
    session_id: input.sessionId,
    source: input.source,
    connection_reason: input.connectionReason,
    channel: input.channel,
    attendee_id: input.attendeeId,
  });
  if (error) throw error;
}

/** The event's rating form, but only when it's actually meant to be shown
 * right now: activated AND (if set) within window_start/window_end.
 * Returns null otherwise — the pop-up just doesn't render, no distinction
 * needed between "no form" and "not in window" on the public side.
 *
 * Rating collection is on by default (2026-10-09: "deve ser por
 * definição... sempre que um evento terminar deve aparecer esse pop-up"),
 * not something an admin has to opt into per event — so when there's no
 * `rating_forms` row yet, one is auto-provisioned here, active, with
 * `window_start` set to an hour before the event's own last session ends
 * (computed from its real Pulse schedule) and no `window_end`. An admin
 * who later opens "Avaliação" sees this row and can override the window,
 * turn it off, or add extra questions — the row existing is what lets a
 * rating actually be submitted against it (`rating_forms.id` is a real FK
 * for `ratings`), not just a computed default with nothing behind it. */
interface RatingFormRow {
  id: string;
  is_active: boolean;
  window_start: string | null;
  window_end: string | null;
}

async function getOrCreateRatingFormRow(eventId: string): Promise<RatingFormRow> {
  const supabase = await createClient();
  const { data: existingForm, error } = await supabase
    .from("rating_forms")
    .select("id, is_active, window_start, window_end")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw error;
  if (existingForm) return existingForm;

  const { event } = await getEvent(eventId);
  const windowStart = event ? latestScheduleEnd(event.scheduleDates) : null;
  const defaultWindowStart = windowStart ? new Date(new Date(windowStart).getTime() - 60 * 60 * 1000).toISOString() : null;

  const { data: created, error: insertError } = await supabase
    .from("rating_forms")
    .insert({ event_id: eventId, is_active: true, window_start: defaultWindowStart, window_end: null })
    .select("id, is_active, window_start, window_end")
    .single();
  if (insertError) throw insertError;
  return created;
}

async function getRatingFormQuestions(formId: string): Promise<RatingFormQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rating_form_questions")
    .select("id, type, label, options, required")
    .eq("form_id", formId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data as RatingFormQuestion[];
}

export async function getActiveRatingForm(eventId: string): Promise<ActiveRatingForm | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const nowIso = new Date().toISOString();
    const form = await getOrCreateRatingFormRow(eventId);

    if (!form.is_active) return null;
    if (form.window_start && form.window_start > nowIso) return null;
    if (form.window_end && form.window_end < nowIso) return null;

    const questions = await getRatingFormQuestions(form.id);
    return { formId: form.id, questions };
  } catch {
    return null;
  }
}

/**
 * Per-panel counterpart (2026-10-15: "a ideia é esse botão aparecer assim
 * que o tempo estipulado para o painel terminar... já no final é que
 * aparece esse de classificar o evento todo" — the per-panel button
 * should appear the moment THAT panel ends; only the event-wide pop-up
 * waits for the whole event to end). `window_start`/`window_end` are
 * specifically what times the event-wide pop-up (`getActiveRatingForm`)
 * — a per-panel button's timing comes from the panel's own schedule
 * instead (see PanelRatingButton's `hasEnded` check), so this only
 * respects the admin's on/off switch, not the window. Same form/questions
 * either way — no separate admin config per panel. */
export async function getPanelRatingForm(eventId: string): Promise<ActiveRatingForm | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const form = await getOrCreateRatingFormRow(eventId);
    if (!form.is_active) return null;

    const questions = await getRatingFormQuestions(form.id);
    return { formId: form.id, questions };
  } catch {
    return null;
  }
}

export interface SubmitRatingInput {
  eventId: string;
  formId: string;
  stars: number;
  comment?: string;
  answers?: { questionId: string; value: unknown }[];
  /** Panel/session `key` (see lib/pulse/panels.ts), when this rating was
   * submitted from a specific panel's page rather than the event-wide
   * pop-up (2026-10-14: "deve ser possível fazer avaliação por painel").
   * Same form, same questions — only the attribution differs, so no
   * separate `rating_forms` row or admin config is needed per panel. */
  sessionId?: string | null;
}

/** Public submission — relies on the `public insert ratings`/`public
 * insert rating answers` RLS policies (anon can insert, never read back
 * other people's rows). Throws on failure; the caller decides how to
 * surface that (see RatingPopup.tsx). */
export async function submitRating(input: SubmitRatingInput): Promise<void> {
  const supabase = await createClient();

  // Generated here rather than read back via `.select()` after insert:
  // anon can INSERT into `ratings` (RLS allows it), but there's
  // deliberately no public SELECT policy on it (visitors shouldn't be
  // able to read other people's ratings) — and PostgREST's "return the
  // inserted row" needs a SELECT grant too, so `.insert().select()`
  // always fails here with an RLS error even though the insert itself
  // would have succeeded. Supplying our own id sidesteps that entirely.
  const ratingId = crypto.randomUUID();
  const { error } = await supabase.from("ratings").insert({
    id: ratingId,
    event_id: input.eventId,
    form_id: input.formId,
    session_id: input.sessionId ?? null,
    stars: Math.min(5, Math.max(1, Math.round(input.stars))),
    comment: input.comment?.slice(0, 1000) || null,
  });

  if (error) throw error;

  if (input.answers && input.answers.length > 0) {
    const { error: answersError } = await supabase.from("rating_answers").insert(
      input.answers.map((a) => ({
        rating_id: ratingId,
        question_id: a.questionId,
        value: a.value,
      })),
    );
    if (answersError) throw answersError;
  }
}
