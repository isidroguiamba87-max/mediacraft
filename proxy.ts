import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./config/i18n";
import { isSupabaseConfigured } from "./lib/supabase/config";

const intlProxy = createIntlMiddleware(routing);

/**
 * Single proxy for the whole app (Next.js 16 renamed middleware.ts to
 * proxy.ts — only one is allowed, so this is where next-intl's
 * locale-routing and the Supabase session refresh both have to live).
 *
 * /admin/** is NOT part of the [locale] segment (see app/admin/layout.tsx)
 * and is Portuguese-only by design — it must never be handed to
 * next-intl's middleware, which would otherwise try to redirect it to a
 * /pt|/en|/fr-prefixed URL. So: /admin paths get the Supabase session
 * refresh only; everything else gets the original next-intl behaviour,
 * untouched.
 *
 * /responder/** (2026-10-09, the per-speaker answer-link feature) is the
 * same situation: a short, unauthenticated link an admin copies and sends
 * straight to a panelist over WhatsApp/email, so it stays out of
 * [locale] too, on purpose — no session refresh needed there (it's not
 * behind Supabase auth, just an unguessable token), so it just skips the
 * intl rewrite entirely.
 */
export default async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return refreshSupabaseSession(request);
  }
  if (request.nextUrl.pathname.startsWith("/responder")) {
    return NextResponse.next({ request });
  }
  return intlProxy(request);
}

async function refreshSupabaseSession(request: NextRequest) {
  // No Supabase project yet — let the request through as-is; the
  // (protected) layout and /admin/login both show their own "not
  // configured" state rather than crashing on a missing env var.
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touching getUser() is what actually triggers the token refresh.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Original next-intl matcher (everything except Next internals, API
  // routes and files with an extension) plus /admin explicitly, in case
  // that pattern is ever narrowed — /admin must always hit this proxy.
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)", "/admin/:path*"],
};
