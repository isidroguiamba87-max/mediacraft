"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, MapPin, Ticket, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getEventPreviewAction, type EventPreview } from "@/app/admin/(protected)/novidades/actions";
import { replaceFileField } from "@/lib/supabase/clientUpload";
import { RichTextEditor } from "@/components/admin/shared/RichTextEditor";
import type { AdminNewsItem, NewsStatus } from "@/lib/supabase/news";

const inputClass =
  "h-11 w-full rounded-brand border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red";
const labelClass = "mb-1.5 block text-xs font-medium text-slate";

const STATUS_LABELS: Record<NewsStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
};

export function NewsForm({
  events,
  initial,
  action,
}: {
  events: { id: string; title: string }[];
  initial?: AdminNewsItem;
  action: (formData: FormData) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<NewsStatus>(initial?.status ?? "draft");
  const [removeCover, setRemoveCover] = useState(false);
  const [eventId, setEventId] = useState(initial?.eventId ?? "");
  const [preview, setPreview] = useState<EventPreview | null>(null);
  const [loadingPreview, startPreviewTransition] = useTransition();

  // Pulse is read-only here — this only ever fetches, for a glance at the
  // event being linked, never writes anything back. No event picked, no
  // fetch — the panel below just ignores `preview` in that case.
  useEffect(() => {
    if (!eventId) return;
    startPreviewTransition(async () => {
      const result = await getEventPreviewAction(eventId);
      setPreview(result);
    });
  }, [eventId]);

  // createNewsAction/updateNewsAction redirect back here with one of these
  // flags (a Server Action that redirects can't hand back a value to
  // react to on this same request) — shown once, then stripped from the
  // URL so a refresh doesn't repeat it.
  useEffect(() => {
    const created = searchParams.get("created");
    const saved = searchParams.get("saved");
    if (!created && !saved) return;
    toast.success(created ? "Novidade criada com sucesso!" : "Alterações guardadas com sucesso!");
    router.replace(window.location.pathname);
  }, [searchParams, router]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form
        action={async (formData) => {
          await replaceFileField(formData, "cover");
          action(formData);
        }}
        className="flex flex-col gap-5"
      >
        <div>
          <label className={labelClass} htmlFor="eventId">
            Evento associado (opcional)
          </label>
          <select
            id="eventId"
            name="eventId"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className={inputClass}
          >
            <option value="">— Nenhum evento —</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-slate">
            Se associares a um evento, aparece lá um botão &ldquo;Ver evento&rdquo; nesta novidade.
          </p>
        </div>

        <div>
        <label className={labelClass} htmlFor="title">
          Título
        </label>
        <input id="title" name="title" required defaultValue={initial?.title} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="summary">
          Resumo
        </label>
        <input id="summary" name="summary" defaultValue={initial?.summary ?? ""} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Conteúdo</label>
        <RichTextEditor name="body" defaultValue={initial?.body ?? ""} />
      </div>

      <div>
        <label className={labelClass} htmlFor="cover">
          Imagem de capa
        </label>
        {initial?.coverUrl && !removeCover && (
          <div className="mb-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image, not optimizable local asset */}
            <img src={initial.coverUrl} alt="" className="h-16 w-28 rounded-brand object-cover" />
            <label className="flex items-center gap-2 text-xs text-slate">
              <input
                type="checkbox"
                name="removeCover"
                onChange={(e) => setRemoveCover(e.target.checked)}
              />
              Remover capa actual
            </label>
          </div>
        )}
        <input id="cover" name="cover" type="file" accept="image/*" className={inputClass} />
      </div>

      <div className="flex flex-wrap gap-5">
        <div>
          <label className={labelClass} htmlFor="status">
            Estado
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as NewsStatus)}
            className={inputClass}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {status === "draft" && (
            <p className="mt-1.5 text-xs text-brand-red">
              Rascunho não aparece no site público — escolhe &ldquo;Publicado&rdquo; para isso.
            </p>
          )}
        </div>

        {status === "scheduled" && (
          <div>
            <label className={labelClass} htmlFor="publishedAt">
              Data de publicação
            </label>
            <input
              id="publishedAt"
              name="publishedAt"
              type="datetime-local"
              defaultValue={initial?.publishedAt?.slice(0, 16)}
              className={inputClass}
            />
          </div>
        )}

        <label className="mt-6 flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="featured" defaultChecked={initial?.featured} />
          Destaque
        </label>
      </div>

        <SubmitButton />
      </form>

      <EventPreviewPanel eventId={eventId} preview={preview} loading={loadingPreview} />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full justify-center sm:w-auto">
      {pending ? "A guardar…" : "Guardar"}
    </Button>
  );
}

/** Read-only glance at the selected Pulse event — same facts `/admin/pulse`
 * shows, condensed for this sidebar. Empty state fills the space that used
 * to just sit blank next to the form when no event is picked. */
function EventPreviewPanel({
  eventId,
  preview,
  loading,
}: {
  eventId: string;
  preview: EventPreview | null;
  loading: boolean;
}) {
  if (!eventId) {
    return (
      <div className="hidden rounded-brand border border-dashed border-line bg-paper-2 p-5 text-sm text-slate lg:block">
        Associa um evento para veres aqui os dados que já estão no Pulse (data, local, bilhetes, programa…).
      </div>
    );
  }

  return (
    <div className="h-fit rounded-brand border border-line bg-paper p-5">
      <p className="text-xs font-semibold tracking-[0.14em] text-slate uppercase">Dados do Pulse</p>

      {loading && !preview ? (
        <p className="mt-3 text-sm text-slate">A carregar…</p>
      ) : !preview ? (
        <p className="mt-3 text-sm text-slate">Não foi possível encontrar este evento no Pulse.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-4">
          {preview.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media
            <img src={preview.coverUrl} alt="" className="h-28 w-full rounded-brand object-cover" />
          )}
          <p className="font-display text-base text-brand-navy">{preview.title}</p>

          <div className="flex flex-col gap-2.5 text-sm text-ink">
            {preview.scheduleText && (
              <span className="flex items-start gap-2">
                <CalendarDays size={15} className="mt-0.5 shrink-0 text-brand-red" />
                {preview.scheduleText}
              </span>
            )}
            {preview.locationName && (
              <span className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-brand-red" />
                {preview.locationName}
              </span>
            )}
            <span className="flex items-start gap-2">
              <Ticket size={15} className="mt-0.5 shrink-0 text-brand-red" />
              {preview.ticketsSold} / {preview.ticketsTotal} bilhetes vendidos
            </span>
            <span className="flex items-start gap-2">
              <Clock size={15} className="mt-0.5 shrink-0 text-brand-red" />
              {preview.sessionsCount} sessões no programa
            </span>
            <span className="flex items-start gap-2">
              <Users size={15} className="mt-0.5 shrink-0 text-brand-red" />
              {preview.speakersCount} oradores
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
