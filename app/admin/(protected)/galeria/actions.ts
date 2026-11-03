"use server";

import { revalidatePath } from "next/cache";
import {
  addGalleryImage,
  addGalleryVideo,
  deleteGalleryItem,
  updateGalleryItem,
} from "@/lib/supabase/gallery";

export async function uploadImagesAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const caption = String(formData.get("caption") ?? "");
  const dayOrSession = String(formData.get("dayOrSession") ?? "");
  // Already uploaded straight to Storage client-side (see
  // lib/supabase/clientUpload.ts) — this receives the temp paths, never
  // the file bytes, or a real photo would 413 against Vercel's own
  // Function body cap regardless of next.config.ts's bodySizeLimit.
  const tempPaths = formData.getAll("files").filter((v): v is string => typeof v === "string" && v.length > 0);

  if (!eventId) throw new Error("Escolhe o evento.");
  if (tempPaths.length === 0) throw new Error("Escolhe pelo menos uma imagem.");

  // One at a time so a single bad file doesn't take the rest down with it.
  for (const tempPath of tempPaths) {
    await addGalleryImage({ eventId, caption, dayOrSession, tempPath });
  }

  revalidatePath("/admin/galeria");
}

export async function addVideoAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const caption = String(formData.get("caption") ?? "");
  const dayOrSession = String(formData.get("dayOrSession") ?? "");
  const externalVideoUrl = String(formData.get("externalVideoUrl") ?? "").trim();
  const tempPathValue = formData.get("file");
  const tempPath = typeof tempPathValue === "string" && tempPathValue.length > 0 ? tempPathValue : null;

  if (!eventId) throw new Error("Escolhe o evento.");
  if (!externalVideoUrl && !tempPath) {
    throw new Error("Dá um link do vídeo ou carrega um ficheiro.");
  }

  await addGalleryVideo({ eventId, caption, dayOrSession, externalVideoUrl: externalVideoUrl || null, tempPath });
  revalidatePath("/admin/galeria");
}

export async function updateGalleryItemAction(id: string, formData: FormData) {
  await updateGalleryItem(id, {
    caption: String(formData.get("caption") ?? ""),
    dayOrSession: String(formData.get("dayOrSession") ?? ""),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    published: formData.get("published") === "on",
  });
  revalidatePath("/admin/galeria");
}

export async function deleteGalleryItemAction(id: string) {
  await deleteGalleryItem(id);
  revalidatePath("/admin/galeria");
}
