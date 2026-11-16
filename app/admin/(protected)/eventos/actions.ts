"use server";

import { revalidatePath } from "next/cache";
import { cleanLiveInfo, type EventLiveInfo } from "@/lib/events/liveInfo";
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
  existingLogoUrl: string | null,
  existingTagline: string | null,
  existingLiveInfo: EventLiveInfo | null,
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

  await saveEventOverride(eventId, {
    coverImageUrl,
    accentColor,
    overlayColor,
    // only written when something actually changed, so this form still
    // saves on a database that hasn't run the logo/tagline migration yet
    ...(logoUrl !== existingLogoUrl ? { logoUrl } : {}),
    ...(tagline !== existingTagline ? { tagline } : {}),
    ...(liveChanged ? { liveInfo } : {}),
  });
  revalidateEvent(eventId);
}

export async function clearEventOverrideAction(eventId: string) {
  await clearEventOverride(eventId);
  revalidateEvent(eventId);
}
