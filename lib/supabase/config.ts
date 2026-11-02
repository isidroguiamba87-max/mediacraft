/** True once the Supabase project's URL/anon key have been pasted into
 * .env.local — until then, every /admin screen should show a clear "not
 * configured yet" state instead of crashing on a missing env var. Reads
 * NEXT_PUBLIC_* vars, so this is safe to import from Client Components
 * too (e.g. the login form). */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
