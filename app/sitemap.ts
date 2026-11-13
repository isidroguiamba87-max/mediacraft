import type { MetadataRoute } from "next";
import { routing } from "@/config/i18n";
import { siteConfig } from "@/config/site.config";
import { getPublicEvents } from "@/lib/pulse/endpoints";
import { getPublishedNews } from "@/lib/bff";

interface StaticPath {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}

const staticPaths: StaticPath[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/eventos", changeFrequency: "daily", priority: 0.9 },
  { path: "/novidades", changeFrequency: "daily", priority: 0.8 },
  { path: "/politica-privacidade", changeFrequency: "yearly", priority: 0.2 },
  { path: "/termos-de-uso", changeFrequency: "yearly", priority: 0.2 },
];

function entry(path: string, lastModified: Date, changeFrequency: StaticPath["changeFrequency"], priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteConfig.url}/${routing.defaultLocale}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${siteConfig.url}/${l}${path}`]),
      ),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = staticPaths.map(({ path, changeFrequency, priority }) =>
    entry(path, now, changeFrequency, priority),
  );

  // Both external lookups degrade to "just skip the dynamic entries" rather
  // than failing the whole sitemap — getPublicEvents falls back to mock
  // placeholder events when Pulse is unreachable (`usedFallback: true`),
  // and those aren't real URLs, so they're excluded rather than indexed.
  const [eventsResult, news] = await Promise.all([
    getPublicEvents({ status: "all" }).catch(() => ({ events: [], usedFallback: true })),
    getPublishedNews().catch(() => []),
  ]);

  const eventEntries = eventsResult.usedFallback
    ? []
    : eventsResult.events.map((e) => entry(`/eventos/${e.id}`, new Date(e.createdAt), "weekly", 0.7));

  const newsEntries = news.map((n) =>
    entry(`/novidades/${n.id}`, new Date(n.publishedAt), "monthly", 0.6),
  );

  return [...staticEntries, ...eventEntries, ...newsEntries];
}
