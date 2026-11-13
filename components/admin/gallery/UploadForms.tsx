"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { ImagePlus, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImagePicker } from "@/components/admin/shared/ImagePicker";
import { uploadImagesAction, addVideoAction } from "@/app/admin/(protected)/galeria/actions";
import { replaceFileField, replaceFileFields } from "@/lib/supabase/clientUpload";
import { assertValidVideoUpload } from "@/lib/uploadValidation";

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

type UploadEvent = { id: string; title: string; sections: string[] };

const OTHER = "__other";

/** "Secção" for the photos/video: the chosen event's own sections (from its
 * Pulse programme) as a list, plus "Outra…" for a free-text one — or just
 * free text when the event has no sections. Submits as `dayOrSession`. */
function SectionField({ id, sections }: { id: string; sections: string[] }) {
  const [choice, setChoice] = useState("");
  if (sections.length === 0) {
    return (
      <div>
        <label className={labelClass} htmlFor={id}>
          Secção (opcional)
        </label>
        <input id={id} name="dayOrSession" placeholder="ex.: Painel, Stands, Foto geral…" className={inputClass} />
      </div>
    );
  }
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        Secção
      </label>
      <select
        id={id}
        name={choice === OTHER ? undefined : "dayOrSession"}
        value={choice}
        onChange={(e) => setChoice(e.target.value)}
        className={inputClass}
      >
        <option value="">Sem secção</option>
        {sections.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
        <option value={OTHER}>Outra…</option>
      </select>
      {choice === OTHER && (
        <input
          name="dayOrSession"
          required
          autoFocus
          placeholder="Nome da secção"
          className={`mt-2 ${inputClass}`}
        />
      )}
    </div>
  );
}

export function UploadForms({ events }: { events: UploadEvent[] }) {
  const [imgEvent, setImgEvent] = useState("");
  const [vidEvent, setVidEvent] = useState("");
  const sectionsOf = (id: string) => events.find((e) => e.id === id)?.sections ?? [];
  const [tab, setTab] = useState<"images" | "video">("images");
  const imageFormRef = useRef<HTMLFormElement>(null);
  const videoFormRef = useRef<HTMLFormElement>(null);
  // Bumped after a successful upload to remount ImagePicker (and so clear
  // its previews) — form.reset() alone wouldn't fire its onChange.
  const [imagePickerKey, setImagePickerKey] = useState(0);

  return (
    <div className="rounded-brand border border-line bg-paper p-5">
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
              await replaceFileFields(formData, "files");
              await uploadImagesAction(formData);
              imageFormRef.current?.reset();
              setImagePickerKey((k) => k + 1);
              toast.success("Imagens carregadas com sucesso!");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Não foi possível carregar as imagens.");
            }
          }}
          className="mt-4 flex flex-col gap-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="img-event">
                Evento
              </label>
              <select
                id="img-event"
                name="eventId"
                required
                value={imgEvent}
                onChange={(e) => setImgEvent(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Escolhe o evento…
                </option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>
            <SectionField key={imgEvent} id="img-day" sections={sectionsOf(imgEvent)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="img-caption">
              Legenda (aplicada a todas as imagens deste envio)
            </label>
            <input id="img-caption" name="caption" className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="img-files">
              Imagens (podes escolher várias)
            </label>
            <ImagePicker key={imagePickerKey} inputId="img-files" />
          </div>
          <SubmitButton label="Carregar imagens" pendingLabel="A carregar…" icon={ImagePlus} />
        </form>
      ) : (
        <form
          ref={videoFormRef}
          action={async (formData) => {
            try {
              const file = formData.get("file");
              if (file instanceof File && file.size > 0) assertValidVideoUpload(file);
              await replaceFileField(formData, "file");
              await addVideoAction(formData);
              videoFormRef.current?.reset();
              toast.success("Vídeo adicionado com sucesso!");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Não foi possível adicionar o vídeo.");
            }
          }}
          className="mt-4 flex flex-col gap-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="vid-event">
                Evento
              </label>
              <select
                id="vid-event"
                name="eventId"
                required
                value={vidEvent}
                onChange={(e) => setVidEvent(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Escolhe o evento…
                </option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>
            <SectionField key={vidEvent} id="vid-day" sections={sectionsOf(vidEvent)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="vid-caption">
              Título/legenda
            </label>
            <input id="vid-caption" name="caption" className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="vid-link">
              Link do vídeo (YouTube/Vimeo)
            </label>
            <input id="vid-link" name="externalVideoUrl" placeholder="https://…" className={inputClass} />
          </div>
          <p className="text-center text-xs text-slate">— ou —</p>
          <div>
            <label className={labelClass} htmlFor="vid-file">
              Carregar ficheiro de vídeo
            </label>
            <input id="vid-file" name="file" type="file" accept="video/*" className={inputClass} />
          </div>
          <SubmitButton label="Adicionar vídeo" pendingLabel="A adicionar…" icon={Video} />
        </form>
      )}
    </div>
  );
}
