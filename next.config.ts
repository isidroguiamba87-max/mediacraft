import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./config/request.ts");

const nextConfig: NextConfig = {
  // jsdom (via isomorphic-dompurify, used by lib/utils.ts stripHtml and
  // components/ui/SafeHtml.tsx) ships a transitive dependency that's
  // ESM-only — bundling/tracing it for the Vercel serverless runtime
  // throws `Error [ERR_REQUIRE_ESM]` at import time, 500ing every route
  // that touches it (confirmed live 2026-11-02 via Vercel runtime logs:
  // /eventos, /eventos/[eventId], /novidades). Keeping it external makes
  // Node require() it natively at runtime instead, which resolves ESM
  // correctly.
  serverExternalPackages: ["jsdom", "isomorphic-dompurify"],
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

export default withNextIntl(nextConfig);
