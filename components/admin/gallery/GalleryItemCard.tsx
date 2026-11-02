"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Film, Save, Trash2 } from "lucide-react";
import {
  deleteGalleryItemAction,
  updateGalleryItemAction,
} from "@/app/admin/(protected)/galeria/actions";
import type { AdminGalleryItem } from "@/lib/supabase/gallery";

export function GalleryItemCard({
  item,
  eventTitle,
}: {
  item: AdminGalleryItem;
  eventTitle: string;
}) {
  const [caption, setCaption] = useState(item.caption ?? "");
  const [dayOrSession, setDayOrSession] = useState(item.dayOrSession ?? "");
  const [sortOrder, setSortOrder] = useState(item.sortOrder);
  const [published, setPublished] = useState(item.published);
  const [pending, startTransition] = useTransition();

  function onSave() {
    const formData = new FormData();
    formData.set("caption", caption);
    formData.set("dayOrSession", dayOrSession);
    formData.set("sortOrder", String(sortOrder));
    if (published) formData.set("published", "on");
    startTransition(async () => {
      try {
        await updateGalleryItemAction(item.id, formData);
        toast.success("Alterações guardadas com sucesso!");
      } catch {
        toast.error("Não foi possível guardar as alterações.");
      }
    });
  }

  function onDelete() {
    if (!confirm("Apagar este item da galeria? Não é possível desfazer.")) return;
    startTransition(async () => {
      try {
        await deleteGalleryItemAction(item.id);
        toast.success("Item apagado com sucesso.");
      } catch {
        toast.error("Não foi possível apagar o item.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-brand border border-line bg-paper p-3">
      <div className="relative aspect-video overflow-hidden rounded-brand bg-paper-2">
        {item.type === "image" && item.storageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image
          <img src={item.storageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate">
            <Film size={22} />
            <span className="text-xs">Vídeo</span>
          </div>
        )}
      </div>

      <p className="truncate text-xs text-slate">{eventTitle}</p>

      <input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Legenda"
        className="h-9 w-full rounded-brand border border-line bg-paper px-3 text-xs outline-none focus-visible:border-brand-red"
      />
      <div className="flex gap-2">
        <input
          value={dayOrSession}
          onChange={(e) => setDayOrSession(e.target.value)}
          placeholder="Dia/sessão"
          className="h-9 w-full rounded-brand border border-line bg-paper px-3 text-xs outline-none focus-visible:border-brand-red"
        />
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          title="Ordem"
          className="h-9 w-16 rounded-brand border border-line bg-paper px-2 text-xs outline-none focus-visible:border-brand-red"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs text-ink">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Publicado
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            aria-label="Guardar"
            className="grid h-8 w-8 place-items-center rounded-full border border-line text-brand-navy hover:border-brand-red hover:text-brand-red disabled:opacity-50"
          >
            <Save size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            aria-label="Apagar"
            className="grid h-8 w-8 place-items-center rounded-full border border-line text-brand-red hover:bg-brand-red/10 disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
