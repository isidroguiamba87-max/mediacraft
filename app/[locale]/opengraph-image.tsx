import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site.config";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default `og:image`/Twitter card for every page that doesn't set its own
 * (event/news detail pages override it with their real cover — see
 * `image` in lib/seo.ts's buildMetadata). Generated on the fly rather than
 * a static asset so there's no separate file to keep in sync with the
 * brand colors in tailwind.config.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#001B32",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 90,
            height: 10,
            backgroundColor: "#BF262E",
            marginBottom: 40,
          }}
        />
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: "#FFFFFF" }}>
          {siteConfig.name}
        </div>
        <div style={{ display: "flex", fontSize: 36, color: "#E5E7EB", marginTop: 24 }}>
          Comunicação Estratégica & Eventos — Moçambique
        </div>
      </div>
    ),
    { ...size },
  );
}
