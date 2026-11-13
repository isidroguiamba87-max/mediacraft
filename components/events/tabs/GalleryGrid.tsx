"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Download, Play } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PillDropdown } from "@/components/ui/PillDropdown";
import { youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/utils";
import type { EventGalleryItem } from "@/lib/bff";

/** Mosaic rhythm from the gallery mock-up, on a 4-column track
 * (2fr 1fr 2.2fr 2fr) with dense auto-placement. Eight tiles fill exactly
 * three rows, so the pattern repeats cleanly for any gallery length:
 *   row 1: tall · small · wide (2 cols)
 *   row 2: (tall) · tall · small · tall
 *   row 3: small · (tall) · small · (tall)
 * Below lg it's a plain 2-column grid. */
const SPANS = [
  "lg:row-span-2",
  "",
  "lg:col-span-2",
  "lg:row-span-2",
  "",
  "lg:row-span-2",
  "",
  "",
];

const ALL = "";
const VIDEOS = "__videos";
const DOCUMENTS = "__documents";

export function GalleryGrid({
  items,
  documentsSlot,
  leading,
  sectionOrder,
}: {
  items: EventGalleryItem[];
  documentsSlot?: React.ReactNode;
  /** Extra filter(s) rendered before the section dropdown — the general
   * /galeria page puts its "evento" dropdown here. */
  leading?: React.ReactNode;
  /** Section names in the order the event defines them (its Pulse agenda
   * sections); tags not in the list follow, in first-seen order. */
  sectionOrder?: string[];
}) {
  const t = useTranslations("eventTabs");
  const photos = items.filter((i) => i.type === "image");
  const videos = items.filter((i) => i.type === "video");
  // One red dropdown drives the whole gallery: "Todos os dias" (every
  // photo), one entry per day/session tag the admin set on photos, then
  // Vídeos / Documentos when there's anything to show there.
  const tagged = [...new Set(photos.map((p) => p.dayOrSession?.trim()).filter((g): g is string => !!g))];
  const groups = sectionOrder
    ? [...sectionOrder.filter((g) => tagged.includes(g)), ...tagged.filter((g) => !sectionOrder.includes(g))]
    : tagged;
  const [filter, setFilter] = useState<string>(
    photos.length > 0 || (videos.length === 0 && !documentsSlot) ? ALL : videos.length > 0 ? VIDEOS : DOCUMENTS,
  );
  const tab: "photos" | "videos" | "documents" =
    filter === VIDEOS ? "videos" : filter === DOCUMENTS ? "documents" : "photos";
  const shownPhotos =
    filter === ALL || tab !== "photos" ? photos : photos.filter((p) => p.dayOrSession?.trim() === filter);
  const filterOptions = [
    { value: ALL, label: t("galleryAllDays") },
    ...groups.map((g) => ({ value: g, label: g })),
    ...(videos.length > 0 ? [{ value: VIDEOS, label: t("galleryVideos") }] : []),
    ...(documentsSlot ? [{ value: DOCUMENTS, label: t("galleryDocuments") }] : []),
  ];
  const [openVideo, setOpenVideo] = useState<EventGalleryItem | null>(null);
  const [openPhotoIndex, setOpenPhotoIndex] = useState<number | null>(null);
  const openPhoto = openPhotoIndex !== null ? shownPhotos[openPhotoIndex] : null;
  const touchStartXRef = useRef<number | null>(null);

  function showPrevPhoto() {
    setOpenPhotoIndex((i) => (i === null ? null : (i - 1 + shownPhotos.length) % shownPhotos.length));
  }
  function showNextPhoto() {
    setOpenPhotoIndex((i) => (i === null ? null : (i + 1) % shownPhotos.length));
  }
  function handlePhotoTouchStart(e: React.TouchEvent) {
    touchStartXRef.current = e.touches[0].clientX;
  }
  function handlePhotoTouchEnd(e: React.TouchEvent) {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX === null) return;
    const deltaX = e.changedTouches[0].clientX - startX;
    if (Math.abs(deltaX) < 40) return;
    if (deltaX > 0) showPrevPhoto();
    else showNextPhoto();
  }

  useEffect(() => {
    if (openPhotoIndex === null || shownPhotos.length <= 1) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") showPrevPhoto();
      if (e.key === "ArrowRight") showNextPhoto();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPhotoIndex]);

  return (
    <div>
      {(filterOptions.length > 1 || leading) && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {leading}
          {filterOptions.length > 1 && (
          <PillDropdown
            ariaLabel={t("galleryFilter")}
            align="left"
            size="md"
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setOpenPhotoIndex(null);
            }}
            options={filterOptions}
          />
          )}
        </div>
      )}

      {tab === "documents" ? (
        documentsSlot
      ) : tab === "photos" ? (
        shownPhotos.length === 0 ? (
          <p className="text-sm text-slate">{t("galleryEmpty")}</p>
        ) : (
          <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:gap-4 lg:grid-flow-row-dense lg:auto-rows-[165px] lg:grid-cols-[2fr_1fr_2.2fr_2fr] xl:auto-rows-[180px]">
            {shownPhotos.map((item, i) => {
              const span = SPANS[i % SPANS.length];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOpenPhotoIndex(i)}
                  className={`group relative overflow-hidden rounded-[1.25rem] bg-brand-navy text-left ${span}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image */}
                  <img
                    src={item.storageUrl ?? ""}
                    alt={item.caption ?? ""}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  {(item.caption || item.dayOrSession) && (
                    <>
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />
                      <span className="absolute bottom-2 left-2 flex items-center gap-1.5 font-mono text-[10px] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="h-1 w-1 rounded-full bg-brand-red" />
                        {item.caption || item.dayOrSession}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        )
      ) : videos.length === 0 ? (
        <p className="text-sm text-slate">{t("galleryEmpty")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {videos.map((item) => {
            const thumbUrl = item.externalVideoUrl ? youtubeThumbnailUrl(item.externalVideoUrl) : null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setOpenVideo(item)}
                className="group relative aspect-video overflow-hidden rounded-[1.25rem] bg-brand-navy text-left"
              >
                {thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external YouTube thumbnail
                  <img
                    src={thumbUrl}
                    alt={item.caption ?? ""}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : item.storageUrl ? (
                  // First-frame preview for self-hosted clips — no stored poster image,
                  // but `preload="metadata"` makes the browser paint the opening frame.
                  <video src={item.storageUrl} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                ) : null}
                <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition-colors group-hover:bg-black/30">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-transform group-hover:scale-110">
                    <Play size={20} fill="currentColor" />
                  </span>
                </span>
                {item.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-left text-xs font-medium text-white">
                    {item.caption}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={openVideo !== null}
        onClose={() => setOpenVideo(null)}
        title={openVideo?.caption || t("galleryVideos")}
        className="max-w-3xl"
      >
        {openVideo && <VideoPlayer item={openVideo} />}
      </Modal>

      <Modal
        open={openPhoto !== null}
        onClose={() => setOpenPhotoIndex(null)}
        title={openPhoto?.caption || t("galleryPhotos")}
        className="max-w-3xl"
      >
        {openPhoto && openPhotoIndex !== null && (
          <div>
            <div
              className="relative overflow-hidden rounded-brand bg-brand-navy"
              onTouchStart={handlePhotoTouchStart}
              onTouchEnd={handlePhotoTouchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image */}
              <img
                src={openPhoto.storageUrl ?? ""}
                alt={openPhoto.caption ?? ""}
                className="max-h-[70vh] w-full object-contain"
              />
              {shownPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevPhoto}
                    aria-label="Previous photo"
                    className="absolute top-1/2 left-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={showNextPhoto}
                    aria-label="Next photo"
                    className="absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              {openPhoto.storageUrl ? (
                <a
                  href={openPhoto.storageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-navy hover:text-brand-red"
                >
                  <Download size={15} />
                  {t("libraryDownload")}
                </a>
              ) : (
                <span />
              )}
              {photos.length > 1 && (
                <span className="text-xs text-slate">
                  {openPhotoIndex + 1} / {photos.length}
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function VideoPlayer({ item }: { item: EventGalleryItem }) {
  const embedUrl = item.externalVideoUrl ? youtubeEmbedUrl(item.externalVideoUrl) : null;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-brand bg-brand-navy">
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={item.caption ?? "Video"}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      ) : item.storageUrl ? (
        <video src={item.storageUrl} controls autoPlay className="h-full w-full" />
      ) : item.externalVideoUrl ? (
        <a
          href={item.externalVideoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-full w-full items-center justify-center text-sm font-medium text-white underline"
        >
          {item.externalVideoUrl}
        </a>
      ) : null}
    </div>
  );
}
