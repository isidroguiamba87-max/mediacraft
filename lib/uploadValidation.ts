// Shared by client and server code — never import `sharp` (server-only,
// native) here, or any client component that imports this file breaks
// the browser build. See lib/supabase/mediaUpload.ts for the image side,
// which does need sharp and stays server-only.

/** Prefix every admin upload lands under first, from the browser, before
 * a Server Action ever sees it — see lib/supabase/clientUpload.ts and
 * lib/supabase/mediaUpload.ts. */
export const TEMP_UPLOAD_PREFIX = "tmp/";

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // matches next.config.ts serverActions.bodySizeLimit
const ALLOWED_VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov"]);
const ALLOWED_VIDEO_MIME_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

/**
 * Lightweight check for admin-uploaded video (gallery/news "video"
 * items) — extension + declared MIME + size only, not a real content
 * sniff (there's no server-side video decoder in this project the way
 * sharp covers images). Called client-side, right before the direct
 * upload to Storage (see lib/supabase/clientUpload.ts) — good enough to
 * reject obviously-wrong uploads; the real trust boundary for video is
 * that only authenticated admins (RLS `is_admin()`) can write to the
 * bucket at all.
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
