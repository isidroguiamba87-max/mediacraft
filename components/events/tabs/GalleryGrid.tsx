"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Download, Play } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/utils";
import type { EventGalleryItem } from "@/lib/bff";

/** Magazine-style rhythm instead of a flat uniform grid — a big feature
 * tile, one tall tile, the rest square. Index into this cyclically so any
 * gallery length still reads as laid-out on purpose, not a plain grid. */
const SPANS = [
  "col-span-2 row-span-2",
  "row-span-2",
  "",
  "",
  "row-span-2",
  "",
  "",
  "col-span-2",
];

export function GalleryGrid({
  items,
  documentsSlot,
}: {
  items: EventGalleryItem[];
  documentsSlot?: React.ReactNode;
}) {
  const t = useTranslations("eventTabs");
  const photos = items.filter((i) => i.type === "image");
  const videos = items.filter((i) => i.type === "video");
  const [tab, setTab] = useState<"photos" | "videos" | "documents">(photos.length > 0 ? "photos" : "videos");
  const [openVideo, setOpenVideo] = useState<EventGalleryItem | null>(null);
  const [openPhotoIndex, setOpenPhotoIndex] = useState<number | null>(null);
  const openPhoto = openPhotoIndex !== null ? photos[openPhotoIndex] : null;
  const touchStartXRef = useRef<number | null>(null);

  function showPrevPhoto() {
    setOpenPhotoIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  }
  function showNextPhoto() {
    setOpenPhotoIndex((i) => (i === null ? null : (i + 1) % photos.length));
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
    if (openPhotoIndex === null || photos.length <= 1) return;
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
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("photos")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "photos" ? "bg-brand-red/10 text-brand-red" : "text-slate"}`}
        >
          {t("galleryPhotos")}
        </button>
        <button
          type="button"
          onClick={() => setTab("videos")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "videos" ? "bg-brand-red/10 text-brand-red" : "text-slate"}`}
        >
          {t("galleryVideos")}
        </button>
        {documentsSlot && (
          <button
            type="button"
            onClick={() => setTab("documents")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "documents" ? "bg-brand-red/10 text-brand-red" : "text-slate"}`}
          >
            {t("galleryDocuments")}
          </button>
        )}
      </div>

      {tab === "documents" ? (
        documentsSlot
      ) : tab === "photos" ? (
        photos.length === 0 ? (
          <p className="text-sm text-slate">{t("galleryEmpty")}</p>
        ) : (
          <div className="grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:grid-cols-4 lg:auto-rows-[220px]">
            {photos.map((item, i) => {
              const span = SPANS[i % SPANS.length];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOpenPhotoIndex(i)}
                  className={`group relative overflow-hidden rounded-brand bg-brand-navy text-left ${span}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image */}
                  <img
                    src={item.storageUrl ?? ""}
                    alt={item.caption ?? ""}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
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
                className="group relative aspect-video overflow-hidden rounded-brand bg-brand-navy text-left"
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
              {photos.length > 1 && (
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
