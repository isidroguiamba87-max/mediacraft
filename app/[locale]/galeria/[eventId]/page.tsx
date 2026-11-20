import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Images } from "lucide-react";
import { Link } from "@/config/i18n";
import { getAllGallery } from "@/lib/bff/gallery";
import { getEvent } from "@/lib/pulse/endpoints";
import { GalleryGrid } from "@/components/events/tabs/GalleryGrid";

interface AlbumPageProps {
  params: Promise<{ locale: string; eventId: string }>;
}

async function loadAlbum(eventId: string) {
  const [all, { event }] = await Promise.all([getAllGallery(), getEvent(eventId)]);
  const items = all.filter((i) => i.eventId === eventId);
  return { items, event };
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const { event } = await loadAlbum(eventId);
  const t = await getTranslations("galeria");
  return { title: event ? `${t("title")} — ${event.title}` : t("title") };
}

/**
 * One event's album (client 2026-11-20): the starred cover as the header,
 * then the photos split by moment — the "Dia/sessão" tag set in the admin,
 * in the order of the event's own agenda sections, untagged photos last as
 * "Outros momentos", videos at the end. Chips at the top jump to a moment;
 * each moment is its own mosaic with the usual photo viewer.
 */
export default async function AlbumPage({ params }: AlbumPageProps) {
  const { locale, eventId } = await params;
  setRequestLocale(locale);
  const { items, event } = await loadAlbum(eventId);
  if (items.length === 0) notFound();

  const t = await getTranslations("galeria");
  const photos = items.filter((i) => i.type === "image" && i.storageUrl);
  const videos = items.filter((i) => i.type === "video");
  const cover = items.find((i) => i.isCover && i.storageUrl) ?? photos[photos.length - 1] ?? null;

  const sectionOrder = (event?.sections ?? []).map((s) => s.title.trim()).filter(Boolean);
  const tagged = [...new Set(photos.map((p) => p.dayOrSession?.trim()).filter((g): g is string => !!g))];
  const momentNames = [
    ...sectionOrder.filter((g) => tagged.includes(g)),
    ...tagged.filter((g) => !sectionOrder.includes(g)),
  ];
  const moments = [
    ...momentNames.map((name) => ({ name, items: photos.filter((p) => p.dayOrSession?.trim() === name) })),
    ...(photos.some((p) => !p.dayOrSession?.trim())
      ? [{ name: tagged.length > 0 ? t("otherMoments") : t("moments"), items: photos.filter((p) => !p.dayOrSession?.trim()) }]
      : []),
    ...(videos.length > 0 ? [{ name: t("videos"), items: videos }] : []),
  ].map((m, i) => ({ ...m, id: `momento-${i + 1}` }));

  return (
    <div className="font-body">
      <section className="relative isolate overflow-hidden bg-brand-navy text-white">
        {cover?.storageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image
          <img src={cover.storageUrl} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover" />
        )}
        <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-brand-navy/30" />
        <div className="mx-auto max-w-container px-6 pt-8 pb-8 sm:pt-10 sm:pb-12 lg:px-10">
          <Link
            href="/#galeria"
            className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-brand-navy shadow transition-colors hover:bg-white"
          >
            <ArrowLeft aria-hidden size={15} strokeWidth={2.6} />
            {t("back")}
          </Link>
          <h1 className="mt-10 max-w-4xl text-white sm:mt-16">
            <span className="block text-3xl leading-tight font-bold uppercase sm:text-5xl">{event?.title ?? t("title")}</span>
          </h1>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/85 sm:text-base">
            <Images aria-hidden className="h-4 w-4" />
            {t("photoCount", { count: photos.length })}
          </p>
        </div>
      </section>

      {moments.length > 1 && (
        <nav
          aria-label={t("moments")}
          className="sticky top-20 z-20 border-b border-line bg-white/95 backdrop-blur"
        >
          <ul className="mx-auto flex max-w-container gap-2 overflow-x-auto px-6 py-3 [scrollbar-width:none] lg:px-10 [&::-webkit-scrollbar]:hidden">
            {moments.map((m) => (
              <li key={m.id} className="shrink-0">
                <a
                  href={`#${m.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-navy/20 px-4 py-1.5 text-sm font-semibold text-brand-navy transition-colors hover:border-brand-red hover:text-brand-red"
                >
                  {m.name}
                  <span className="text-xs font-normal text-slate">{m.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mx-auto flex max-w-container flex-col gap-10 px-6 py-8 sm:gap-12 sm:py-12 lg:px-10">
        {moments.map((m) => (
          <section key={m.id} id={m.id} className="scroll-mt-40">
            <h2 className="inline-block border-b-2 border-brand-red pb-1 text-brand-navy">
              <span className="text-xl font-bold uppercase sm:text-2xl">{m.name}</span>
            </h2>
            <div className="mt-4 sm:mt-6">
              <GalleryGrid items={m.items} hideFilter />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
