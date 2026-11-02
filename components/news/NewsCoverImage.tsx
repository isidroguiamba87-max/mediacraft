"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

/**
 * Makes the news detail page's cover photo clickable (2026-10-15: "a
 * imagem da novidade deve ser clicável") — opens it enlarged in a modal,
 * same lightbox pattern GalleryGrid already uses for gallery photos
 * (letterboxed on a navy background, `object-contain` so nothing crops).
 */
export function NewsCoverImage({ src, title }: { src: string; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={title}
        className="block w-full cursor-zoom-in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image */}
        <img
          src={src}
          alt=""
          className="aspect-[16/9] w-full rounded-2xl object-cover shadow-brand transition-opacity hover:opacity-90"
        />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={title} className="max-w-4xl">
        <div className="overflow-hidden rounded-brand bg-brand-navy">
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image */}
          <img src={src} alt="" className="max-h-[80vh] w-full object-contain" />
        </div>
      </Modal>
    </>
  );
}
