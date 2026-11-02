import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, Ticket } from "lucide-react";
import { Link } from "@/config/i18n";
import { formatDate } from "@/lib/utils";
import type { EventNewsItem } from "@/lib/bff";

export function NewsCard({
  item,
  linkedEventTitle,
}: {
  item: EventNewsItem;
  /** Shown as a badge on the cover so a linked event reads at a glance
   * from the listing grid, not only once a visitor opens the news item
   * (2026-10-09: "deve ser possível ver o título do evento linkado à
   * notícia logo aqui na capa"). Null when the news isn't linked to an
   * event, or the linked event's title couldn't be resolved. */
  linkedEventTitle?: string | null;
}) {
  const locale = useLocale();
  const t = useTranslations("eventTabs");

  return (
    <Link
      href={`/novidades/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-brand transition-shadow hover:shadow-xl"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-brand-navy">
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image
          <img
            src={item.coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand-navy to-brand-navy-2" />
        )}
        {item.featured && (
          <span className="absolute top-3 left-3 rounded-full bg-brand-red px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.14em] text-white uppercase shadow-sm">
            {t("newsFeatured")}
          </span>
        )}
        {linkedEventTitle && (
          <span className="absolute right-3 bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-brand-navy/80 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <Ticket size={12} className="shrink-0 text-brand-red" />
            <span className="truncate">{linkedEventTitle}</span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="flex items-center gap-1.5 text-xs text-slate">
          <CalendarDays size={13} className="text-brand-red" />
          {formatDate(item.publishedAt, locale)}
        </span>
        <h3 className="mt-2 font-display text-lg leading-snug text-brand-navy group-hover:text-brand-red">
          {item.title}
        </h3>
        {item.summary && <p className="mt-2 line-clamp-2 text-sm text-slate">{item.summary}</p>}
      </div>
    </Link>
  );
}
