import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./config/i18n";
import { isSupabaseConfigured } from "./lib/supabase/config";
import { pulseConfig } from "./config/site.config";

const intlProxy = createIntlMiddleware(routing);

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// Derived from the same env vars the app itself reads, so the CSP tracks
// whichever Supabase project / Pulse API is actually wired up (staging
// today, production later) without needing a separate hardcoded value.
const supabaseOrigin = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL);
const pulseOrigin = originOf(pulseConfig.apiUrl);

/**
 * `script-src`/`style-src` nonce — see https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy.
 * Next needs the nonce on the *request* (it reads it back out via
 * `headers()` while rendering, to stamp its own injected <script> tags) —
 * so it's set on a cloned request passed into every branch below, not just
 * on the outgoing response.
 *
 * `style-src` stays on 'unsafe-inline' rather than the nonce: a lot of
 * this codebase sets React `style={{...}}` (MouseGlow, FlagshipEvent,
 * per-event accent colors), and the `style=""` HTML attribute can't be
 * nonce'd the way a `<style>` block or `<script>` tag can — there's no
 * practical way to lock that down further without rewriting every one of
 * those call sites to CSS custom properties.
 *
 * Currently shipped as `Content-Security-Policy-Report-Only` — browsers
 * log violations to the console without blocking anything. Flip the
 * response header name to `Content-Security-Policy` once a pass through
 * the real site (home, eventos, event detail incl. the YouTube "Ao Vivo"
 * embed, novidades, /admin login + dashboard) shows no unexpected
 * [Report Only] console entries. See docs/CHECKLIST-SEGURANCA.md.
 */
function buildCsp(nonce: string): string {
  const connectSrc = [
    "'self'",
    supabaseOrigin,
    supabaseOrigin?.replace(/^https:/, "wss:"),
    pulseOrigin,
  ].filter(Boolean);

  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://*.supabase.co https://minio.devpulsemz.cloud https://img.youtube.com https://images.unsplash.com`,
    `font-src 'self' data:`,
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src https://www.youtube.com https://www.google.com https://maps.google.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ];
  return directives.join("; ");
}

const CSP_HEADER_NAME = "Content-Security-Policy-Report-Only";

function withNonce(request: NextRequest, nonce: string, csp: string): NextRequest {
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  // Next only auto-stamps its own <script> tags with the nonce when it can
  // read a `nonce-<value>` CSP directive back out of the *request* headers
  // during rendering — the x-nonce header alone isn't enough (confirmed
  // live 2026-11-03: every inline script Next itself injects on
  // /admin/login was missing the nonce until this was added). Setting it
  // under the same Report-Only name used on the response, since that's
  // the one Next is actually looking for right now.
  headers.set(CSP_HEADER_NAME, csp);
  return new NextRequest(request, { headers });
}

/**
 * Single proxy for the whole app (Next.js 16 renamed middleware.ts to
 * proxy.ts — only one is allowed, so this is where next-intl's
 * locale-routing, the Supabase session refresh and the security headers
 * all have to live).
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
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);
  const nonceRequest = withNonce(request, nonce, csp);

  let response: NextResponse;
  if (request.nextUrl.pathname.startsWith("/admin")) {
    response = await refreshSupabaseSession(nonceRequest);
  } else if (request.nextUrl.pathname.startsWith("/responder")) {
    response = NextResponse.next({ request: nonceRequest });
  } else {
    response = intlProxy(nonceRequest);
  }

  response.headers.set(CSP_HEADER_NAME, csp);
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  return response;
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
