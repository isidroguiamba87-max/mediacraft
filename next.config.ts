import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./config/request.ts");

const nextConfig: NextConfig = {
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
