"use server";

import { revalidatePath } from "next/cache";
import { deleteQuestion, updateQuestion, type QuestionStatus } from "@/lib/supabase/questions";
import { setQaEnabled } from "@/lib/supabase/eventOverrides";
import { getOrCreateSpeakerLink } from "@/lib/supabase/speakerLinks";

export async function setQaEnabledAction(eventId: string, enabled: boolean) {
  await setQaEnabled(eventId, enabled);
  revalidatePath("/admin/perguntas");
  revalidatePath(`/eventos/${eventId}`);
}

/** Returns the full /responder/<token> path (not the token alone) so the
 * client component doesn't need its own copy of that route's shape. */
export async function getSpeakerLinkAction(eventId: string, speakerName: string): Promise<string> {
  const token = await getOrCreateSpeakerLink(eventId, speakerName);
  return `/responder/${token}`;
}

export async function toggleRelevantAction(id: string, isRelevant: boolean, currentStatus: QuestionStatus) {
  await updateQuestion(id, {
    isRelevant,
    // Marking a brand-new question relevant also moves it out of "new" so
    // it doesn't sit forever in an unreviewed-looking state.
    status: currentStatus === "new" && isRelevant ? "reviewed" : undefined,
  });
  revalidatePath("/admin/perguntas");
}

export async function setStatusAction(id: string, status: QuestionStatus) {
  await updateQuestion(id, { status });
  revalidatePath("/admin/perguntas");
}

export async function saveAnswerAction(id: string, answer: string) {
  await updateQuestion(id, { answer: answer.trim() || null });
  revalidatePath("/admin/perguntas");
}

export async function deleteQuestionAction(id: string) {
  await deleteQuestion(id);
  revalidatePath("/admin/perguntas");
}
