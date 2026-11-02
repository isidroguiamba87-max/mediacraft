import { createClient } from "./server";
import { createServiceClient } from "./service";

export type QuestionStatus = "new" | "reviewed" | "archived";

export interface AdminQuestion {
  id: string;
  eventId: string;
  name: string;
  question: string;
  status: QuestionStatus;
  isRelevant: boolean;
  answer: string | null;
  panelTitle: string | null;
  speakerName: string | null;
  helpfulCount: number;
  unhelpfulCount: number;
  createdAt: string;
}

interface QuestionRow {
  id: string;
  event_id: string;
  name: string;
  question: string;
  status: QuestionStatus;
  is_relevant: boolean;
  answer: string | null;
  panel_title: string | null;
  speaker_name: string | null;
  helpful_count: number;
  unhelpful_count: number;
  created_at: string;
}

function mapRow(row: QuestionRow): AdminQuestion {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    question: row.question,
    status: row.status,
    isRelevant: row.is_relevant,
    answer: row.answer,
    panelTitle: row.panel_title,
    speakerName: row.speaker_name,
    helpfulCount: row.helpful_count,
    unhelpfulCount: row.unhelpful_count,
    createdAt: row.created_at,
  };
}

export async function listQuestions(): Promise<AdminQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as QuestionRow[]).map(mapRow);
}

export interface QuestionUpdateInput {
  status?: QuestionStatus;
  isRelevant?: boolean;
  answer?: string | null;
}

/** Partial on purpose — e.g. toggling `isRelevant` must never silently
 * wipe out an `answer` that was already saved, so callers only pass the
 * fields they're actually changing. */
export async function updateQuestion(id: string, input: QuestionUpdateInput): Promise<void> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (input.status !== undefined) patch.status = input.status;
  if (input.isRelevant !== undefined) patch.is_relevant = input.isRelevant;
  if (input.answer !== undefined) patch.answer = input.answer;

  const { error } = await supabase.from("questions").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteQuestion(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

export interface PanelistQuestion {
  id: string;
  question: string;
  name: string;
  answer: string | null;
  createdAt: string;
}

/** For /responder/[token]: every question addressed to this speaker on
 * this event, regardless of `is_relevant` — a panelist should be able to
 * draft an answer before the admin gets around to approving the question,
 * not be blocked on that review happening first. Uses the service client,
 * same reasoning as resolveSpeakerToken (no admin session here). Matching
 * is case/whitespace-insensitive since `speaker_name` is a free-text
 * snapshot taken at submit time, not a foreign key (see EventQuestion's
 * comment in lib/bff) — small typos in casing shouldn't hide a question
 * from the person it's for. */
export async function getQuestionsForSpeaker(eventId: string, speakerName: string): Promise<PanelistQuestion[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id, question, name, answer, created_at")
    .eq("event_id", eventId)
    .ilike("speaker_name", speakerName.trim())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    question: row.question,
    name: row.name,
    answer: row.answer,
    createdAt: row.created_at,
  }));
}

/** For /responder/[token]: writes the panelist's own answer. `eventId` +
 * `speakerName` come from the already-resolved token (not from the
 * client), and the update is scoped to both plus the question id so a
 * panelist can only ever write to their own questions on their own
 * event, even though this runs on the service client with RLS bypassed —
 * the scoping lives in this query, not in a database policy. */
export async function answerQuestionAsSpeaker(
  questionId: string,
  eventId: string,
  speakerName: string,
  answer: string,
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("questions")
    .update({ answer: answer.slice(0, 2000) })
    .eq("id", questionId)
    .eq("event_id", eventId)
    .ilike("speaker_name", speakerName.trim());
  if (error) throw error;
}
