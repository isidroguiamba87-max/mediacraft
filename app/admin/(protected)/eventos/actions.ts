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
  // Already uploaded straight to Storage client-side — see
  // lib/supabase/clientUpload.ts and uploadEventCover.
  const tempPath = formData.get("cover");
  const coverImageUrl =
    typeof tempPath === "string" && tempPath.length > 0
      ? await uploadEventCover(tempPath)
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
