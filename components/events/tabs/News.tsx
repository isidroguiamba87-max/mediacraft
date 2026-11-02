import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/config/i18n";
import { getEventNews } from "@/lib/bff";
import { formatDate } from "@/lib/utils";
import { SafeHtml } from "@/components/ui/SafeHtml";

export async function News({ eventId }: { eventId: string }) {
  const t = await getTranslations("eventTabs");
  const locale = await getLocale();
  const news = await getEventNews(eventId);

  if (news.length === 0) {
    return <p className="text-sm text-slate">{t("newsEmpty")}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-line">
      {news.map((item) => (
        <li key={item.id} className="flex flex-col gap-4 py-6 first:pt-0 sm:flex-row">
          {item.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image, not optimizable local asset
            <img
              src={item.coverUrl}
              alt=""
              className="h-40 w-full shrink-0 rounded-brand object-cover sm:h-28 sm:w-44"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate">{formatDate(item.publishedAt, locale)}</p>
              {item.featured && (
                <span className="rounded-full bg-brand-red/10 px-2 py-0.5 text-[10px] font-medium text-brand-red uppercase">
                  {t("newsFeatured")}
                </span>
              )}
            </div>
            <Link href={`/novidades/${item.id}`} className="group">
              <h3 className="mt-1 font-display text-lg text-brand-navy group-hover:text-brand-red">
                {item.title}
              </h3>
            </Link>
            {item.summary && <p className="mt-1 text-sm font-medium text-ink">{item.summary}</p>}
            {item.body && <SafeHtml html={item.body} className="mt-2 text-sm text-slate" />}
          </div>
        </li>
      ))}
    </ul>
  );
}
