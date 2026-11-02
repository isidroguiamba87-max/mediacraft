import sharp from "sharp";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB raw upload
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // matches next.config.ts serverActions.bodySizeLimit
const MAX_DIMENSION = 2400; // px, long edge — admin photos, not print assets
const ALLOWED_IMAGE_FORMATS = new Set(["jpeg", "png", "webp", "gif", "avif"]);
const ALLOWED_VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov"]);
const ALLOWED_VIDEO_MIME_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

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
 * reaches Storage:
 * - Real format check: sharp decodes the actual bytes, not the
 *   filename/extension or the browser-supplied `file.type` (either of
 *   which an attacker fully controls) — a non-image or corrupted file
 *   throws here instead of landing in the bucket.
 * - Metadata stripped: sharp drops EXIF/ICC/XMP by default unless
 *   `.withMetadata()` is called — it never is here, on purpose (A5:
 *   "remover metadados EXIF das imagens publicadas").
 * - Resized to a sane max (admin photos end up full-bleed on a phone
 *   screen at most, never printed) and always re-encoded to WebP.
 */
export async function processImageUpload(file: File): Promise<ProcessedImage> {
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
 * Lightweight check for admin-uploaded video (gallery/news "video"
 * items) — sharp can't decode video, so this is extension + declared
 * MIME + size only, not a real content sniff. Good enough to reject
 * obviously-wrong uploads; the real trust boundary for video is that
 * only authenticated admins (RLS `is_admin()`) can write to the bucket
 * at all.
 */
export function assertValidVideoUpload(file: File): void {
  if (file.size === 0) return; // caller treats this as "no file provided"
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("O vídeo excede o limite de 50MB.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_VIDEO_EXTENSIONS.has(ext)) {
    throw new Error("Formato de vídeo não suportado (usa .mp4, .webm ou .mov).");
  }
  if (file.type && !ALLOWED_VIDEO_MIME_TYPES.has(file.type)) {
    throw new Error("Formato de vídeo não suportado (usa .mp4, .webm ou .mov).");
  }
}
