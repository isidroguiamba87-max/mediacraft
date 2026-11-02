"use client";

import { useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Film, ImagePlus, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImagePicker } from "@/components/admin/shared/ImagePicker";
import {
  addNewsImagesAction,
  addNewsVideoAction,
  deleteNewsMediaAction,
} from "@/app/admin/(protected)/novidades/actions";
import type { AdminNewsMediaItem } from "@/lib/supabase/news";

const inputClass =
  "h-11 w-full rounded-brand border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red";
const labelClass = "mb-1.5 block text-xs font-medium text-slate";

function SubmitButton({ label, pendingLabel, icon: Icon }: { label: string; pendingLabel: string; icon: typeof ImagePlus }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full justify-center sm:w-auto">
      <Icon size={16} />
      {pending ? pendingLabel : label}
    </Button>
  );
}

function MediaCard({ newsId, item }: { newsId: string; item: AdminNewsMediaItem }) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm("Remover este ficheiro da novidade? Não é possível desfazer.")) return;
    startTransition(async () => {
      try {
        await deleteNewsMediaAction(newsId, item.id);
        toast.success("Ficheiro removido com sucesso.");
      } catch {
        toast.error("Não foi possível remover o ficheiro.");
      }
    });
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-brand border border-line bg-paper-2">
      {item.type === "image" && item.storageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image
        <img src={item.storageUrl} alt={item.caption ?? ""} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate">
          <Film size={22} />
          <span className="text-xs">Vídeo</span>
        </div>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-label="Remover"
        className="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-brand-red disabled:opacity-50"
      >
        <Trash2 size={13} />
      </button>
      {item.caption && (
        <p className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-2 py-1 text-[11px] text-white">
          {item.caption}
        </p>
      )}
    </div>
  );
}

export function NewsMediaManager({ newsId, media }: { newsId: string; media: AdminNewsMediaItem[] }) {
  const [tab, setTab] = useState<"images" | "video">("images");
  const imageFormRef = useRef<HTMLFormElement>(null);
  const videoFormRef = useRef<HTMLFormElement>(null);
  const [imagePickerKey, setImagePickerKey] = useState(0);

  return (
    <div>
      <h2 className="font-display text-lg text-brand-navy">Fotos e vídeo desta novidade</h2>
      <p className="mt-1 text-sm text-slate">
        Além da capa, podes juntar mais fotos e um vídeo — aparecem como galeria na página pública desta
        novidade.
      </p>

      {media.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {media.map((item) => (
            <MediaCard key={item.id} newsId={newsId} item={item} />
          ))}
        </div>
      )}

      <div className="mt-5 rounded-brand border border-line bg-paper p-5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("images")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "images" ? "bg-brand-red/10 text-brand-red" : "text-slate"}`}
          >
            Imagens
          </button>
          <button
            type="button"
            onClick={() => setTab("video")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "video" ? "bg-brand-red/10 text-brand-red" : "text-slate"}`}
          >
            Vídeo
          </button>
        </div>

        {tab === "images" ? (
          <form
            ref={imageFormRef}
            action={async (formData) => {
              try {
                await addNewsImagesAction(newsId, formData);
                imageFormRef.current?.reset();
                setImagePickerKey((k) => k + 1);
                toast.success("Imagens carregadas com sucesso!");
              } catch {
                toast.error("Não foi possível carregar as imagens.");
              }
            }}
            className="mt-4 flex flex-col gap-3"
          >
            <div>
              <label className={labelClass} htmlFor="news-img-caption">
                Legenda (aplicada a todas as imagens deste envio)
              </label>
              <input id="news-img-caption" name="caption" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="news-img-files">
                Imagens (podes escolher várias)
              </label>
              <ImagePicker key={imagePickerKey} inputId="news-img-files" />
            </div>
            <SubmitButton label="Carregar imagens" pendingLabel="A carregar…" icon={ImagePlus} />
          </form>
        ) : (
          <form
            ref={videoFormRef}
            action={async (formData) => {
              try {
                await addNewsVideoAction(newsId, formData);
                videoFormRef.current?.reset();
                toast.success("Vídeo adicionado com sucesso!");
              } catch {
                toast.error("Não foi possível adicionar o vídeo.");
              }
            }}
            className="mt-4 flex flex-col gap-3"
          >
            <div>
              <label className={labelClass} htmlFor="news-vid-caption">
                Título/legenda
              </label>
              <input id="news-vid-caption" name="caption" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="news-vid-link">
                Link do vídeo (YouTube/Vimeo)
              </label>
              <input id="news-vid-link" name="externalVideoUrl" placeholder="https://…" className={inputClass} />
            </div>
            <p className="text-center text-xs text-slate">— ou —</p>
            <div>
              <label className={labelClass} htmlFor="news-vid-file">
                Carregar ficheiro de vídeo
              </label>
              <input id="news-vid-file" name="file" type="file" accept="video/*" className={inputClass} />
            </div>
            <SubmitButton label="Adicionar vídeo" pendingLabel="A adicionar…" icon={Video} />
          </form>
        )}
      </div>
    </div>
  );
}
