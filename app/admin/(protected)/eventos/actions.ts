"use server";

import { revalidatePath } from "next/cache";
import { cleanLiveInfo, type EventLiveInfo } from "@/lib/events/liveInfo";
import { createClient } from "@/lib/supabase/server";
import { finalizePdfUpload } from "@/lib/supabase/mediaUpload";
import {
  type EventCategory,
  saveEventOverride,
  clearEventOverride,
  uploadEventCover,
} from "@/lib/supabase/eventOverrides";

function revalidateEvent(eventId: string) {
  revalidatePath("/admin/eventos");
  revalidatePath(`/eventos/${eventId}`);
  // the home page splits Eventos / Comunicação by this override
  revalidatePath("/", "layout");
}

export async function saveEventOverrideAction(
  eventId: string,
  existingCoverUrl: string | null,
  existingLogoUrl: string | null,
  existingTagline: string | null,
  existingLiveInfo: EventLiveInfo | null,
  existingCategory: EventCategory,
  existingChannels: string | null,
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
  const overlayRaw = String(formData.get("overlayColor") ?? "").trim();
  const overlayColor =
    overlayRaw === "default"
      ? null
      : /^#[0-9a-fA-F]{8}(,#[0-9a-fA-F]{8})?$/.test(overlayRaw)
        ? overlayRaw.toLowerCase()
        : undefined;

  const logoTemp = formData.get("logo");
  const logoUrl =
    typeof logoTemp === "string" && logoTemp.length > 0
      ? await uploadEventCover(logoTemp)
      : formData.get("removeLogo") === "on"
        ? null
        : existingLogoUrl;
  const taglineRaw = String(formData.get("tagline") ?? "").trim();
  const tagline = taglineRaw || null;

  const liveInfo = cleanLiveInfo({
    joinUrl: formData.get("liveJoinUrl"),
    meetingId: formData.get("liveMeetingId"),
    passcode: formData.get("livePasscode"),
    chatUrl: formData.get("liveChatUrl"),
    instructions: formData.get("liveInstructions"),
  });
  const liveChanged = JSON.stringify(liveInfo) !== JSON.stringify(existingLiveInfo);

  // Programme PDF: a new upload replaces it (and restamps the date);
  // "remove" clears it; otherwise untouched.
  const pdfTemp = formData.get("programPdf");
  const programPdfUrl =
    typeof pdfTemp === "string" && pdfTemp.length > 0
      ? await finalizePdfUpload(await createClient(), pdfTemp)
      : formData.get("removeProgramPdf") === "on"
        ? null
        : undefined;

  const category: EventCategory = formData.get("category") === "comunicacao" ? "comunicacao" : "evento";
  const channels = String(formData.get("channels") ?? "").trim() || null;

  try {
    await saveOverride();
  } catch (err) {
    // Database without the Eventos/Comunicação columns yet — say exactly
    // what's missing instead of a bare 500.
    const msg = typeof err === "object" && err && "message" in err ? String(err.message) : "";
    if (/'(category|channels)' column/.test(msg)) {
      return {
        error:
          "Falta correr a migração supabase/migrations/2026-11-19_event_category.sql no Supabase (SQL Editor) para poder escolher Eventos / Comunicação.",
      };
    }
    throw err;
  }
  revalidateEvent(eventId);
  return { error: null };

  async function saveOverride() {
  await saveEventOverride(eventId, {
    coverImageUrl,
    accentColor,
    overlayColor,
    // only written when something actually changed, so this form still
    // saves on a database that hasn't run the logo/tagline migration yet
    ...(logoUrl !== existingLogoUrl ? { logoUrl } : {}),
    ...(tagline !== existingTagline ? { tagline } : {}),
    ...(liveChanged ? { liveInfo } : {}),
    ...(programPdfUrl !== undefined ? { programPdfUrl } : {}),
    ...(category !== existingCategory ? { category } : {}),
    ...(channels !== existingChannels ? { channels } : {}),
  });
  }
}

export async function clearEventOverrideAction(eventId: string) {
  await clearEventOverride(eventId);
  revalidateEvent(eventId);
}
