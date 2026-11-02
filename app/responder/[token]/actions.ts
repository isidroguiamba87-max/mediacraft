"use server";

import { resolveSpeakerToken } from "@/lib/supabase/speakerLinks";
import { answerQuestionAsSpeaker } from "@/lib/supabase/questions";

/** The token (not a questionId or eventId passed separately by the
 * client) is what proves this request is allowed to write — resolved
 * fresh on every submit rather than trusted from a hidden form field, so
 * a tampered request can't answer on another speaker's behalf. */
export async function submitAnswerAction(token: string, questionId: string, answer: string) {
  const scope = await resolveSpeakerToken(token);
  if (!scope) throw new Error("Link inválido ou expirado.");
  if (!answer.trim()) throw new Error("A resposta não pode estar vazia.");

  await answerQuestionAsSpeaker(questionId, scope.eventId, scope.speakerName, answer.trim());
}
