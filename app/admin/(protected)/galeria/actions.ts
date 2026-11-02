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
  const files = formData.getAll("files") as File[];

  if (!eventId) throw new Error("Escolhe o evento.");
  const realFiles = files.filter((f) => f.size > 0);
  if (realFiles.length === 0) throw new Error("Escolhe pelo menos uma imagem.");

  // One at a time so a single bad file doesn't take the rest down with it.
  for (const file of realFiles) {
    await addGalleryImage({ eventId, caption, dayOrSession, file });
  }

  revalidatePath("/admin/galeria");
}

export async function addVideoAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const caption = String(formData.get("caption") ?? "");
  const dayOrSession = String(formData.get("dayOrSession") ?? "");
  const externalVideoUrl = String(formData.get("externalVideoUrl") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!eventId) throw new Error("Escolhe o evento.");
  if (!externalVideoUrl && (!file || file.size === 0)) {
    throw new Error("Dá um link do vídeo ou carrega um ficheiro.");
  }

  await addGalleryVideo({ eventId, caption, dayOrSession, externalVideoUrl: externalVideoUrl || null, file });
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
