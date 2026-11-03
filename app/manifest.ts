import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.legalName,
    short_name: siteConfig.name,
    description: "Comunicação estratégica, gestão de reputação e eventos corporativos em Moçambique.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#001B32",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
