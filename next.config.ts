import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withBundleAnalyzerInit from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./config/request.ts");
// Opt-in only (`ANALYZE=true npm run build`) — writes .next/analyze/*.html
// instead of changing anything about a normal build.
const withBundleAnalyzer = withBundleAnalyzerInit({ enabled: process.env.ANALYZE === "true" });

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Hides the `X-Powered-By: Next.js` response header.
  poweredByHeader: false,
  // proxy.ts sets the same headers (plus the nonce-based CSP) for the
  // page/app routes it runs on, but its matcher skips /api/** and static
  // files — this covers those too, so every response carries them.
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Pulse-hosted media (event covers, gallery, speaker photos) is rendered
  // with plain <img> for now since the media host isn't finalized yet.
  // Once it is, add it to images.remotePatterns and switch those spots to
  // next/image.
  experimental: {
    // Required because the root layout lives under the [locale] dynamic
    // segment (app/[locale]/layout.tsx) — see app/global-not-found.tsx.
    globalNotFound: true,
    serverActions: {
      // Next's default (1 MB) throws on a single real photo, let alone the
      // admin panel's multi-file picker (Galeria/Novidades let you queue up
      // several images, plus video uploads) — confirmed live 2026-10-06
      // ("Body exceeded 1 MB limit") uploading one ordinary screenshot.
      bodySizeLimit: "50mb",
    },
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
