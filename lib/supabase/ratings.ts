import { createClient } from "./server";
import { getEvent } from "@/lib/pulse/endpoints";
import { latestScheduleEnd } from "@/lib/utils";

export type RatingQuestionType = "single_choice" | "multi_choice" | "text" | "scale";

export interface RatingFormQuestionOption {
  value: string;
  label: string;
}

export interface AdminRatingFormQuestion {
  id: string;
  formId: string;
  type: RatingQuestionType;
  label: string;
  options: RatingFormQuestionOption[] | null;
  required: boolean;
  sortOrder: number;
}

export interface AdminRatingForm {
  id: string;
  eventId: string;
  isActive: boolean;
  windowStart: string | null;
  windowEnd: string | null;
  questions: AdminRatingFormQuestion[];
}

interface FormRow {
  id: string;
  event_id: string;
  is_active: boolean;
  window_start: string | null;
  window_end: string | null;
}

interface QuestionRow {
  id: string;
  form_id: string;
  type: RatingQuestionType;
  label: string;
  options: RatingFormQuestionOption[] | null;
  required: boolean;
  sort_order: number;
}

function mapQuestion(row: QuestionRow): AdminRatingFormQuestion {
  return {
    id: row.id,
    formId: row.form_id,
    type: row.type,
    label: row.label,
    options: row.options,
    required: row.required,
    sortOrder: row.sort_order,
  };
}

/** One form per event (`rating_forms.event_id` is unique) — auto-created
 * with sensible defaults (active, window opening an hour before the
 * event's own last session ends) the first time anyone looks, same as
 * the public getActiveRatingForm in lib/bff — so this always shows the
 * row that's actually governing the pop-up, not a separate "nothing
 * configured yet" blank state (2026-10-09: ratings are on by default, not
 * an opt-in an admin has to remember per event). */
export async function getRatingForm(eventId: string): Promise<AdminRatingForm | null> {
  const supabase = await createClient();
  const { data: existingForm, error } = await supabase
    .from("rating_forms")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw error;
  let form = existingForm;

  if (!form) {
    const { event } = await getEvent(eventId);
    const windowStart = event ? latestScheduleEnd(event.scheduleDates) : null;
    const defaultWindowStart = windowStart
      ? new Date(new Date(windowStart).getTime() - 60 * 60 * 1000).toISOString()
      : null;

    const { data: created, error: insertError } = await supabase
      .from("rating_forms")
      .insert({ event_id: eventId, is_active: true, window_start: defaultWindowStart, window_end: null })
      .select("*")
      .single();
    if (insertError) throw insertError;
    form = created;
  }

  const { data: questions, error: qError } = await supabase
    .from("rating_form_questions")
    .select("*")
    .eq("form_id", form.id)
    .order("sort_order", { ascending: true });

  if (qError) throw qError;

  const row = form as FormRow;
  return {
    id: row.id,
    eventId: row.event_id,
    isActive: row.is_active,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    questions: (questions as QuestionRow[]).map(mapQuestion),
  };
}

export interface FormSettingsInput {
  isActive: boolean;
  windowStart: string | null;
  windowEnd: string | null;
}

/** Creates the event's form on first save, updates it after — `event_id`
 * is unique so this is a plain upsert. */
export async function saveFormSettings(eventId: string, input: FormSettingsInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rating_forms")
    .upsert(
      {
        event_id: eventId,
        is_active: input.isActive,
        window_start: input.windowStart,
        window_end: input.windowEnd,
      },
      { onConflict: "event_id" },
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export interface QuestionInput {
  type: RatingQuestionType;
  label: string;
  options: RatingFormQuestionOption[] | null;
  required: boolean;
  sortOrder: number;
}

export async function addFormQuestion(formId: string, input: QuestionInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("rating_form_questions").insert({
    form_id: formId,
    type: input.type,
    label: input.label,
    options: input.options,
    required: input.required,
    sort_order: input.sortOrder,
  });
  if (error) throw error;
}

export async function deleteFormQuestion(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("rating_form_questions").delete().eq("id", id);
  if (error) throw error;
}

export interface RatingSummary {
  id: string;
  stars: number;
  comment: string | null;
  createdAt: string;
  /** Panel `key` this rating was submitted against, or `null` for the
   * event-wide pop-up (see lib/pulse/panels.ts for what a `key` is). */
  sessionId: string | null;
}

/** For the Avaliação admin page's quick preview of what's come in so far
 * — the full dashboard/ranking is a later phase. */
export async function listRatingsForEvent(eventId: string): Promise<RatingSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ratings")
    .select("id, stars, comment, created_at, session_id")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map((r) => ({
    id: r.id,
    stars: r.stars,
    comment: r.comment,
    createdAt: r.created_at,
    sessionId: r.session_id,
  }));
}

export interface PanelRatingAggregate {
  sessionId: string;
  count: number;
  averageStars: number;
}

/** Per-panel breakdown for the admin page's "avaliação por painel" table
 * — grouped here rather than left to the page, same reasoning as
 * lib/supabase/networkingIntents.ts's getNetworkingBySpeaker (a raw
 * aggregate keyed by the stable panel `key`; display titles are resolved
 * by the caller against live Pulse data, since panel titles can change). */
export async function getRatingsBySession(eventId: string): Promise<PanelRatingAggregate[]> {
  const ratings = await listRatingsForEvent(eventId);
  const bySession = new Map<string, number[]>();
  for (const r of ratings) {
    if (!r.sessionId) continue;
    if (!bySession.has(r.sessionId)) bySession.set(r.sessionId, []);
    bySession.get(r.sessionId)!.push(r.stars);
  }
  return [...bySession.entries()].map(([sessionId, stars]) => ({
    sessionId,
    count: stars.length,
    averageStars: stars.reduce((a, b) => a + b, 0) / stars.length,
  }));
}
