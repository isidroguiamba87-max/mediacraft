import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS entirely via `SUPABASE_SECRET_KEY`.
 * Only ever called from Server Actions / route handlers for narrow,
 * server-validated writes made by someone who isn't a logged-in admin
 * (the per-speaker answer link, the per-answer like/dislike vote) — what
 * makes each write safe is the validation inside that Server Action, not
 * a database policy. Never import this from a Client Component; it would
 * ship the secret key to the browser.
 */
export function createServiceClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
}
