"use server";

import { revalidatePath } from "next/cache";
import {
  saveEventOverride,
  clearEventOverride,
  uploadEventCover,
} from "@/lib/supabase/eventOverrides";

function revalidateEvent(eventId: string) {
  revalidatePath("/admin/eventos");
  revalidatePath(`/eventos/${eventId}`);
}

export async function saveEventOverrideAction(
  eventId: string,
  existingCoverUrl: string | null,
  formData: FormData,
) {
  const file = formData.get("cover") as File | null;
  const coverImageUrl =
    file && file.size > 0
      ? await uploadEventCover(file)
      : formData.get("removeCover") === "on"
        ? null
        : existingCoverUrl;

  const accentColor = String(formData.get("accentColor") ?? "").trim() || null;

  await saveEventOverride(eventId, { coverImageUrl, accentColor });
  revalidateEvent(eventId);
}

export async function clearEventOverrideAction(eventId: string) {
  await clearEventOverride(eventId);
  revalidateEvent(eventId);
}
