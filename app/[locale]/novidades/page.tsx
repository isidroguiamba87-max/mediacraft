import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublishedNews } from "@/lib/bff";
import { getPublicEvents } from "@/lib/pulse/endpoints";
import { NewsCard } from "@/components/news/NewsCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.novidades" });
  return { title: t("title"), description: t("description") };
}

export default async function NewsListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("novidades");
  const [news, { events }] = await Promise.all([getPublishedNews(), getPublicEvents({ status: "all" })]);
  const eventTitle = new Map(events.map((e) => [e.id, e.title]));

  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-10">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl text-brand-navy">{t("title")}</h1>
        <p className="mt-4 text-base text-slate">{t("subtitle")}</p>
      </div>

      {news.length > 0 ? (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              linkedEventTitle={item.eventId ? (eventTitle.get(item.eventId) ?? null) : null}
            />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-sm text-slate">{t("empty")}</p>
      )}
    </div>
  );
}
