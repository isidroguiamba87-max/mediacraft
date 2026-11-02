"use server";

import { revalidatePath } from "next/cache";
import {
  addFormQuestion,
  deleteFormQuestion,
  saveFormSettings,
  type RatingFormQuestionOption,
  type RatingQuestionType,
} from "@/lib/supabase/ratings";

function toLocalDatetime(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

export async function saveFormSettingsAction(eventId: string, formData: FormData) {
  await saveFormSettings(eventId, {
    isActive: formData.get("isActive") === "on",
    windowStart: toLocalDatetime(String(formData.get("windowStart") ?? "")),
    windowEnd: toLocalDatetime(String(formData.get("windowEnd") ?? "")),
  });
  revalidatePath("/admin/avaliacao");
}

export async function addQuestionAction(formId: string, sortOrder: number, formData: FormData) {
  const type = formData.get("type") as RatingQuestionType;
  const label = String(formData.get("label") ?? "").trim();
  if (!label) throw new Error("Dá um texto à pergunta.");

  let options: RatingFormQuestionOption[] | null = null;
  if (type === "single_choice" || type === "multi_choice") {
    const raw = String(formData.get("options") ?? "");
    const values = raw
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 0) throw new Error("Dá pelo menos uma opção (uma por linha).");
    options = values.map((v) => ({ value: v, label: v }));
  }

  await addFormQuestion(formId, {
    type,
    label,
    options,
    required: formData.get("required") === "on",
    sortOrder,
  });
  revalidatePath("/admin/avaliacao");
}

export async function deleteQuestionAction(id: string) {
  await deleteFormQuestion(id);
  revalidatePath("/admin/avaliacao");
}
