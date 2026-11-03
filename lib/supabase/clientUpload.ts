"use client";

import { createClient } from "./client";
import { TEMP_UPLOAD_PREFIX } from "@/lib/uploadValidation";

/**
 * Uploads a file straight from the browser to Supabase Storage — used
 * right before submitting an admin upload form, so the actual file bytes
 * never pass through the Server Action's own request body (Vercel caps
 * that at ~4.5MB no matter what next.config.ts's bodySizeLimit says;
 * confirmed live 2026-11-03, a gallery photo 413'd). Lands under `tmp/`;
 * the Server Action that receives just this path string downloads it
 * server-side and finishes the job — see
 * lib/supabase/mediaUpload.ts's finalizeImageUpload/finalizeVideoUpload.
 * Authorized the same way a direct upload to its real path would be
 * (RLS `admin write media`, bucket_id = 'media' and is_admin()) — `tmp/`
 * isn't a separate bucket or policy, just a prefix.
 */
export async function uploadToTempStorage(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${TEMP_UPLOAD_PREFIX}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file);
  if (error) throw error;
  return path;
}

/** Replaces a single-file form field in place with its temp Storage path
 * — call before handing the FormData to a Server Action. No-op when the
 * field is empty (nothing chosen, or a File with size 0). */
export async function replaceFileField(formData: FormData, fieldName: string): Promise<void> {
  const file = formData.get(fieldName);
  if (file instanceof File && file.size > 0) {
    const path = await uploadToTempStorage(file);
    formData.set(fieldName, path);
  }
}

/** Same as `replaceFileField`, for a multi-file field (`formData.getAll`)
 * — every File entry becomes its temp path, in the same order, uploaded
 * one at a time so one bad file doesn't abort the rest. */
export async function replaceFileFields(formData: FormData, fieldName: string): Promise<void> {
  const files = formData.getAll(fieldName).filter((f): f is File => f instanceof File && f.size > 0);
  formData.delete(fieldName);
  for (const file of files) {
    const path = await uploadToTempStorage(file);
    formData.append(fieldName, path);
  }
}
