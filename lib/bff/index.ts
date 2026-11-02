/**
 * "Backend for frontend" for features Pulse doesn't provide: event News,
 * Gallery, Q&A and Ratings — all (2026-10-05) read from the admin panel's
 * own Supabase tables (see lib/supabase/*.ts for the admin-side CRUD).
 * Documents used to be one of these too, but moved to Pulse-only
 * (2026-10-10: "todos os documentos virão da plataforma Pulse") — see
 * lib/pulse/endpoints.ts's getEventMaterials instead.
 *
 * Exposed over HTTP for client polling via app/api/bff/** route handlers
 * (see components/events/tabs/QA.tsx for the client that polls it).
 */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getEvent } from "@/lib/pulse/endpoints";
import { latestScheduleEnd } from "@/lib/utils";

export interface EventNewsItem {
  id: string;
  eventId: string | null;
  title: string;
  summary: string | null;
  body: string;
  coverUrl: string | null;
  featured: boolean;
  publishedAt: string;
}

export interface NewsMediaItem {
  id: string;
  type: "image" | "video";
  storageUrl: string | null;
  externalVideoUrl: string | null;
  caption: string | null;
}

export interface EventOverride {
  coverImageUrl: string | null;
  accentColor: string | null;
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

export interface EventQuestion {
  id: string;
  eventId: string;
  name: string;
  question: string;
  /** Free-text snapshots of the panel/speaker the asker targeted at
   * submission time (2026-10-09) — not a foreign key into Pulse's
   * sections/speakers, same reasoning as gallery's `dayOrSession`: a
   * session's own `id` is confirmed unreliable (see lib/pulse/panels.ts),
   * so there's nothing stable to reference. Both optional; most questions
   * aren't directed at anyone in particular. */
  panelTitle: string | null;
  speakerName: string | null;
  answer: string | null;
  helpfulCount: number;
  unhelpfulCount: number;
  createdAt: string;
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

/** Published news for one event, newest-published first. Falls back to an
 * empty list (not a crash) if Supabase isn't configured yet or the query
 * fails — this is public-site code, it has to stay up either way. */
export async function getEventNews(eventId: string): Promise<EventNewsItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("news")
      .select("id, event_id, title, summary, body, cover_url, featured, published_at")
      .eq("event_id", eventId)
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      eventId: row.event_id,
      title: row.title,
      summary: row.summary,
      body: row.body ?? "",
      coverUrl: row.cover_url,
      featured: row.featured,
      publishedAt: row.published_at,
    }));
  } catch {
    return [];
  }
}

/** Every published news item, site-wide, newest-published first — backs
 * the standalone `/novidades` section (not scoped to any one event; an
 * item only has an `eventId` when the admin explicitly linked it to an
 * upcoming/ongoing event). Falls back to an empty list, same reasoning
 * as the rest of this file. */
export async function getPublishedNews(limit?: number): Promise<EventNewsItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    let query = supabase
      .from("news")
      .select("id, event_id, title, summary, body, cover_url, featured, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      eventId: row.event_id,
      title: row.title,
      summary: row.summary,
      body: row.body ?? "",
      coverUrl: row.cover_url,
      featured: row.featured,
      publishedAt: row.published_at,
    }));
  } catch {
    return [];
  }
}

/** One published news item by id, for the `/novidades/[id]` detail page —
 * returns null for drafts/scheduled items too (same as "not found"), not
 * just missing ids, so an unpublished article can never leak via a
 * guessed URL. */
export async function getPublishedNewsById(id: string): Promise<EventNewsItem | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("news")
      .select("id, event_id, title, summary, body, cover_url, featured, published_at")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      eventId: data.event_id,
      title: data.title,
      summary: data.summary,
      body: data.body ?? "",
      coverUrl: data.cover_url,
      featured: data.featured,
      publishedAt: data.published_at,
    };
  } catch {
    return null;
  }
}

/** Extra photos/video attached to one news item, in admin-set order. */
export async function getNewsMedia(newsId: string): Promise<NewsMediaItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("news_media")
      .select("id, type, storage_url, external_video_url, caption")
      .eq("news_id", newsId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      type: row.type,
      storageUrl: row.storage_url,
      externalVideoUrl: row.external_video_url,
      caption: row.caption,
    }));
  } catch {
    return [];
  }
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
      .select("cover_image_url, accent_color, qa_enabled")
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return { coverImageUrl: data.cover_image_url, accentColor: data.accent_color, qaEnabled: data.qa_enabled ?? false };
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

/** Only questions the admin has marked `is_relevant` — moderation happens
 * in the panel (see lib/supabase/questions.ts), a newly submitted question
 * is never shown back to visitors until approved. Falls back to an empty
 * list rather than crashing, same reasoning as getEventNews. */
export async function getEventQuestions(eventId: string): Promise<EventQuestion[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("questions")
      .select("id, event_id, name, question, panel_title, speaker_name, answer, helpful_count, unhelpful_count, created_at")
      .eq("event_id", eventId)
      .eq("is_relevant", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      eventId: row.event_id,
      name: row.name,
      question: row.question,
      panelTitle: row.panel_title,
      speakerName: row.speaker_name,
      answer: row.answer,
      helpfulCount: row.helpful_count,
      unhelpfulCount: row.unhelpful_count,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

export async function addQuestion(
  eventId: string,
  input: { name: string; question: string; panelTitle?: string; speakerName?: string },
): Promise<void> {
  const supabase = await createClient();
  // No `.select()` after this insert — same RLS pitfall as submitRating:
  // anon can INSERT but there's no public SELECT policy (only
  // `is_relevant = true` rows are readable), and PostgREST's "return the
  // inserted row" needs a SELECT grant too, so chaining `.select()` here
  // would fail even though the insert itself succeeds.
  const { error } = await supabase.from("questions").insert({
    event_id: eventId,
    name: input.name.slice(0, 80),
    question: input.question.slice(0, 500),
    panel_title: input.panelTitle?.slice(0, 200) || null,
    speaker_name: input.speakerName?.slice(0, 120) || null,
  });
  if (error) throw error;
}

/** A participant registering a networking intent (2026-10-12) — our own
 * durable record, independent of whether Pulse's own networking-intents
 * endpoint exists (it doesn't yet). This is what makes the admin's
 * Networking metrics page show real, accumulating numbers instead of the
 * static example data it shipped with ("esses dados aí estão falsos...
 * podes usar dados reais"). Same anon-can-INSERT-but-not-SELECT shape as
 * `addQuestion` — see lib/supabase/networkingIntents.ts for the
 * admin-only aggregation reads. */
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

/** A visitor rating one answer helpful/unhelpful, or undoing a vote they
 * just cast by mistake (2026-10-10: "se a pessoa já tiver clicado... e
 * quer desfazer basta clicar novamente") — a plain read-then-increment
 * (or decrement) on the service client rather than a public RLS policy or
 * a Postgres function, same "accept the tiny race" tradeoff already made
 * for rating_forms auto-provisioning: two votes landing in the exact same
 * instant losing one increment is a cosmetic, extremely low-stakes edge
 * case, not worth a stored procedure. `Math.max(0, …)` on undo guards
 * against a count ever going negative (e.g. two tabs undoing the same
 * vote). Dedup against a visitor re-voting, and remembering whether
 * there's a vote to undo, is entirely client-side (localStorage) — there's
 * no visitor identity to check server-side here, same as everywhere else
 * on this anonymous, no-login public site. */
export async function voteQuestionFeedback(
  questionId: string,
  type: "helpful" | "unhelpful",
  action: "vote" | "undo" = "vote",
): Promise<void> {
  const column = type === "helpful" ? "helpful_count" : "unhelpful_count";
  const supabase = createServiceClient();
  const { data, error: selectError } = await supabase
    .from("questions")
    .select(column)
    .eq("id", questionId)
    .maybeSingle();
  if (selectError) throw selectError;
  if (!data) return;

  const current = (data as Record<string, number>)[column] ?? 0;
  const next = action === "undo" ? Math.max(0, current - 1) : current + 1;
  const { error: updateError } = await supabase
    .from("questions")
    .update({ [column]: next })
    .eq("id", questionId);
  if (updateError) throw updateError;
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
