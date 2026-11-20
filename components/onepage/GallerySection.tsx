import { getTranslations } from "next-intl/server";
import { Images } from "lucide-react";
import { Link } from "@/config/i18n";
import { getAllGallery } from "@/lib/bff/gallery";
import { getPublicEvents } from "@/lib/pulse/endpoints";

/**
 * #galeria on the one-page home (client 2026-11-20): one album per event
 * instead of every photo mixed together. Each album shows the photo the
 * admin starred as its cover (falls back to the event's first photo), the
 * event name and how many photos it has; it opens /galeria/[eventId], where
 * the photos are organised by moment.
 */
export async function GallerySection() {
  const t = await getTranslations("galeria");
  const [items, { events }] = await Promise.all([getAllGallery(), getPublicEvents({ status: "all" })]);
  const titles = new Map(events.map((e) => [e.id, e.title]));

  // Most recently added-to album first (items arrive newest-first).
  const albums = [...new Set(items.map((i) => i.eventId))].map((eventId) => {
    const own = items.filter((i) => i.eventId === eventId);
    const photos = own.filter((i) => i.type === "image" && i.storageUrl);
    const cover = own.find((i) => i.isCover && i.storageUrl) ?? photos[photos.length - 1] ?? null;
    return {
      eventId,
      title: titles.get(eventId) ?? null,
      coverUrl: cover?.storageUrl ?? null,
      photoCount: photos.length,
    };
  });

  return (
    <div className="mx-auto max-w-container px-6 pt-6 pb-14 sm:pt-10 sm:pb-20 lg:px-10">
      <div className="inline-block">
        <h2 className="text-brand-navy">
          <span className="font-body text-4xl font-bold uppercase sm:text-5xl">{t("title")}</span>
        </h2>
        <span aria-hidden className="mt-3 block h-px w-[calc(100%+0.5rem)] bg-brand-red" />
      </div>

      {albums.length === 0 ? (
        <p className="mt-8 text-sm text-slate">{t("empty")}</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:mt-12 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-3">
          {albums.map((album) => (
            <li key={album.eventId}>
              <Link
                href={`/galeria/${encodeURIComponent(album.eventId)}`}
                className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-red"
              >
                {/* stacked-photos look so it reads as an album, not one photo */}
                <span className="relative block pt-2 sm:pt-3">
                  <span aria-hidden className="absolute inset-x-4 top-0 h-6 rounded-t-xl sm:inset-x-6 sm:rounded-t-[1.25rem] bg-brand-navy/15" />
                  <span aria-hidden className="absolute inset-x-2 top-1 h-6 rounded-t-xl sm:inset-x-3 sm:top-1.5 sm:rounded-t-[1.25rem] bg-brand-navy/30" />
                  <span className="relative block aspect-[4/5] overflow-hidden rounded-xl sm:aspect-[4/3] sm:rounded-[1.25rem] bg-brand-navy shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-shadow duration-300 group-hover:shadow-[0_10px_28px_rgba(0,0,0,0.4)]">
                    {album.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image
                      <img
                        src={album.coverUrl}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    )}
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-5">
                      <span className="line-clamp-3 block font-body text-sm leading-tight font-bold break-words uppercase sm:line-clamp-2 sm:text-xl">
                        {album.title ?? t("title")}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-white/85 sm:mt-1.5 sm:gap-1.5 sm:text-sm">
                        <Images aria-hidden className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {t("photoCount", { count: album.photoCount })}
                      </span>
                    </span>
                  </span>
                </span>
                <span className="sr-only">{t("openAlbum")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
