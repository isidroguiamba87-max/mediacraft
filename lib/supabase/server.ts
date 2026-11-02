import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Server-side Supabase client — for Server Components, Server Actions
 * and Route Handlers under app/admin. Mirrors cookies through next/headers
 * so the session survives across requests; `setAll` can throw when called
 * from a Server Component render (cookies are read-only there) — that's
 * expected and harmless as long as middleware.ts is refreshing the
 * session on every request. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — middleware.ts handles the refresh.
          }
        },
      },
    },
  );
}
