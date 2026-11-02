import { createBrowserClient } from "@supabase/ssr";

/** Browser-side Supabase client — for Client Components (e.g. the login
 * form). Reads the public URL/anon key, safe to expose client-side. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
