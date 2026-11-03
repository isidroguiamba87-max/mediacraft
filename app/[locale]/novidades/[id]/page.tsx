import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, getLocale, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight, CalendarDays, Mail } from "lucide-react";
import { LinkedinIcon, FacebookIcon, WhatsappIcon } from "@/components/ui/SocialIcons";
import { Link } from "@/config/i18n";
import { getPublishedNewsById, getNewsMedia } from "@/lib/bff";
import { getEvent } from "@/lib/pulse/endpoints";
import { formatDate, stripHtml } from "@/lib/utils";
import { siteConfig } from "@/config/site.config";
import { SafeHtml } from "@/components/ui/SafeHtml";
import { GalleryGrid } from "@/components/events/tabs/GalleryGrid";
import { NewsCoverImage } from "@/components/news/NewsCoverImage";
import type { PulseEventDetail } from "@/lib/pulse/types";
import type { Locale } from "@/config/i18n";
import { buildMetadata } from "@/lib/seo";

interface NewsDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const item = await getPublishedNewsById(id);
  if (!item) return buildMetadata({ locale: locale as Locale, path: `/novidades/${id}` });
  return buildMetadata({
    locale: locale as Locale,
    path: `/novidades/${id}`,
    title: item.title,
    description: item.summary ?? (item.body ? stripHtml(item.body) : undefined),
    image: item.coverUrl ?? undefined,
  });
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const item = await getPublishedNewsById(id);
  if (!item) notFound();

  const [t, currentLocale, media, linkedEvent] = await Promise.all([
    getTranslations("novidades"),
    getLocale(),
    getNewsMedia(item.id),
    item.eventId ? getEvent(item.eventId).then((r) => r.event) : Promise.resolve(null),
  ]);

  const pageUrl = `${siteConfig.url}/${locale}/novidades/${item.id}`;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
      <Link href="/novidades" className="inline-flex items-center gap-2 text-sm text-slate hover:text-ink">
        <ArrowLeft size={15} />
        {t("backToList")}
      </Link>

      {/* Sidebar fills what used to be bare whitespace next to a narrow
       * single-column article (2026-10-09: "está muito vazia... a
       * informação está centralizada e não fica bonito") — the linked
       * event (when there is one) and share links, both reachable without
       * scrolling, not just via the floating button below. */}
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
        <article className="min-w-0">
          {item.coverUrl && <NewsCoverImage src={item.coverUrl} title={item.title} />}

          <span className="mt-6 flex items-center gap-1.5 text-xs text-slate">
            <CalendarDays size={13} className="text-brand-red" />
            {formatDate(item.publishedAt, currentLocale)}
          </span>
          <h1 className="mt-2 font-display text-3xl text-brand-navy sm:text-4xl">{item.title}</h1>
          {item.summary && <p className="mt-3 text-base font-medium text-ink">{item.summary}</p>}

          {/* Same card as the sidebar's (desktop), shown here instead on
           * mobile — the sidebar stacks below the whole article body on
           * narrow screens (single-column grid), which buried it far
           * enough to go unnoticed (2026-10-15: "no modo mobile... podes
           * fazer aparecer o nome do evento associado... como está no
           * modo web"). The sidebar's own copy is desktop-only (`lg:block`
           * there) so this never duplicates. */}
          {linkedEvent && (
            <div className="mt-5 lg:hidden">
              <LinkedEventCard event={linkedEvent} label={t("viewEvent")} />
            </div>
          )}

          {item.body && <SafeHtml html={item.body} className="mt-6 text-sm text-slate" />}
        </article>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
          {linkedEvent && (
            <div className="hidden lg:block">
              <LinkedEventCard event={linkedEvent} label={t("viewEvent")} />
            </div>
          )}

          <div className="rounded-2xl border border-line bg-paper p-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-slate uppercase">{t("share")}</p>
            <div className="mt-3 flex gap-2.5">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${item.title} ${pageUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-slate transition-colors hover:border-brand-red hover:text-brand-red"
              >
                <WhatsappIcon size={17} />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-slate transition-colors hover:border-brand-red hover:text-brand-red"
              >
                <FacebookIcon size={17} />
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-slate transition-colors hover:border-brand-red hover:text-brand-red"
              >
                <LinkedinIcon size={17} />
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(item.title)}&body=${encodeURIComponent(pageUrl)}`}
                aria-label="Email"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-slate transition-colors hover:border-brand-red hover:text-brand-red"
              >
                <Mail size={17} />
              </a>
            </div>
          </div>
        </aside>
      </div>

      {linkedEvent && (
        // Floating too, not just the sidebar card — a long article scrolls
        // the sidebar out of reach, so this stays reachable at any scroll
        // position. Navy/white to match the logo's own colour instead of
        // blending into the page as a plain white pill (2026-10-09: "a cor
        // da logo não está assim branco... está num canto escondido que as
        // pessoas não irão perceber que ele existe").
        <Link
          href={`/eventos/${linkedEvent.id}`}
          className="fixed right-4 bottom-24 z-40 flex max-w-xs items-center gap-3 rounded-full bg-brand-navy px-5 py-3.5 text-white shadow-xl transition-transform hover:scale-105 md:bottom-10"
        >
          <div className="min-w-0 text-left">
            <p className="text-[10px] text-white/60">{t("viewEvent")}</p>
            <p className="truncate font-display text-sm">{linkedEvent.title}</p>
          </div>
          <ArrowRight size={16} className="shrink-0 text-brand-red" />
        </Link>
      )}

      {media.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-brand-navy">{t("gallery")}</h2>
          <div className="mt-4">
            <GalleryGrid
              items={media.map((m) => ({
                id: m.id,
                type: m.type,
                storageUrl: m.storageUrl,
                externalVideoUrl: m.externalVideoUrl,
                caption: m.caption,
                dayOrSession: null,
              }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LinkedEventCard({ event, label }: { event: PulseEventDetail; label: string }) {
  return (
    <Link
      href={`/eventos/${event.id}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-paper shadow-sm transition-shadow hover:shadow-brand"
    >
      {event.coverUrl && (
        <div className="aspect-[16/10] overflow-hidden bg-brand-navy">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote Pulse media, host not finalized yet */}
          <img
            src={event.coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-brand-red uppercase">{label}</p>
        <p className="mt-1 font-display text-base text-brand-navy">{event.title}</p>
        {event.location?.name && <p className="mt-1 text-xs text-slate">{event.location.name}</p>}
      </div>
    </Link>
  );
}
