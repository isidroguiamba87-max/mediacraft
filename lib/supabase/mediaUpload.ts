import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { TEMP_UPLOAD_PREFIX } from "@/lib/uploadValidation";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB raw upload
const MAX_DIMENSION = 2400; // px, long edge — admin photos, not print assets
const ALLOWED_IMAGE_FORMATS = new Set(["jpeg", "png", "webp", "gif", "avif"]);

export interface ProcessedImage {
  buffer: Buffer;
  contentType: "image/webp";
  /** Always "webp" — storage paths built from this never need the
   * original filename's extension (or the rest of it: see
   * sanitizeFileName's call sites before this file existed). */
  extension: "webp";
}

/**
 * Validates and re-encodes an admin-uploaded image before it ever
 * reaches its real Storage path:
 * - Real format check: sharp decodes the actual bytes, not the
 *   filename/extension or the browser-supplied `file.type` (either of
 *   which an attacker fully controls) — a non-image or corrupted file
 *   throws here instead of landing in the bucket.
 * - Metadata stripped: sharp drops EXIF/ICC/XMP by default unless
 *   `.withMetadata()` is called — it never is here, on purpose (A5:
 *   "remover metadados EXIF das imagens publicadas").
 * - Resized to a sane max (admin photos end up full-bleed on a phone
 *   screen at most, never printed) and always re-encoded to WebP.
 *
 * Takes a `Blob` rather than specifically a `File` — the only caller is
 * now `finalizeImageUpload`, which downloads the already-uploaded temp
 * object from Storage (a `Blob`), not a `File` straight off a form.
 */
export async function processImageUpload(file: Blob): Promise<ProcessedImage> {
  if (file.size === 0) {
    throw new Error("Ficheiro vazio.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("A imagem excede o limite de 10MB.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  let image: ReturnType<typeof sharp>;
  try {
    image = sharp(input, { failOn: "error" });
    const metadata = await image.metadata();
    if (!metadata.format || !ALLOWED_IMAGE_FORMATS.has(metadata.format)) {
      throw new Error(`unsupported format: ${metadata.format}`);
    }
  } catch {
    throw new Error("O ficheiro não é uma imagem válida.");
  }

  const buffer = await image
    .rotate() // apply EXIF orientation before it's stripped, or a sideways phone photo stays sideways
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  return { buffer, contentType: "image/webp", extension: "webp" };
}

/**
 * The second half of every admin image upload: the file already sits at
 * `tempPath` (uploaded directly from the browser — see
 * lib/supabase/clientUpload.ts — specifically so its bytes never pass
 * through a Server Action's request body, which Vercel caps at ~4.5MB
 * regardless of next.config.ts's bodySizeLimit; confirmed live
 * 2026-11-03, a gallery photo 413'd). This downloads it server-side
 * (an outbound fetch, not subject to that cap), runs it through
 * `processImageUpload`, uploads the real WebP to `finalPrefix/<uuid>.webp`,
 * and removes the temp object either way.
 */
export async function finalizeImageUpload(
  supabase: SupabaseClient,
  tempPath: string,
  finalPrefix: string,
): Promise<string> {
  try {
    const { data: blob, error: downloadError } = await supabase.storage.from("media").download(tempPath);
    if (downloadError || !blob) {
      throw downloadError ?? new Error("Não foi possível obter o ficheiro enviado.");
    }

    const processed = await processImageUpload(blob);
    const finalPath = `${finalPrefix}/${crypto.randomUUID()}.${processed.extension}`;
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(finalPath, processed.buffer, { contentType: processed.contentType });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("media").getPublicUrl(finalPath);
    return data.publicUrl;
  } finally {
    await supabase.storage.from("media").remove([tempPath]);
  }
}

/**
 * Video's half of the same flow — no re-encoding (sharp can't touch
 * video), just a metadata-only move from the temp path to its real one,
 * so the actual bytes never transit through this Function either way.
 */
export async function finalizeVideoUpload(
  supabase: SupabaseClient,
  tempPath: string,
  finalPrefix: string,
): Promise<string> {
  const finalPath = `${finalPrefix}/${crypto.randomUUID()}-${tempPath.slice(TEMP_UPLOAD_PREFIX.length)}`;
  const { error } = await supabase.storage.from("media").move(tempPath, finalPath);
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(finalPath);
  return data.publicUrl;
}
