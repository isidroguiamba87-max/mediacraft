"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  saveEventOverrideAction,
  clearEventOverrideAction,
} from "@/app/admin/(protected)/eventos/actions";
import { replaceFileField } from "@/lib/supabase/clientUpload";
import type { AdminEventOverride } from "@/lib/supabase/eventOverrides";

const inputClass =
  "h-11 w-full rounded-brand border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red";
const labelClass = "mb-1.5 block text-xs font-medium text-slate";

const DEFAULT_ACCENT = "#bf262e";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full justify-center sm:w-auto">
      {pending ? "A guardar…" : "Guardar"}
    </Button>
  );
}

export function EventVisualForm({
  eventId,
  pulseCoverUrl,
  override,
}: {
  eventId: string;
  /** The cover Pulse itself has, shown as the "default" when there's no
   * override — purely informational here, never written back to Pulse. */
  pulseCoverUrl: string | null;
  override: AdminEventOverride | null;
}) {
  const [removeCover, setRemoveCover] = useState(false);
  const [accentColor, setAccentColor] = useState(override?.accentColor ?? "");
  const [pending, startTransition] = useTransition();

  const boundAction = saveEventOverrideAction.bind(null, eventId, override?.coverImageUrl ?? null);
  const effectiveCover = override?.coverImageUrl ?? pulseCoverUrl;

  function onReset() {
    if (!confirm("Repor este evento para o visual original do Pulse? A capa e a cor personalizadas são removidas.")) {
      return;
    }
    startTransition(async () => {
      try {
        await clearEventOverrideAction(eventId);
        toast.success("Visual reposto para o original do Pulse.");
      } catch {
        toast.error("Não foi possível repor o visual.");
      }
    });
  }

  return (
    <form
      action={async (formData) => {
        try {
          await replaceFileField(formData, "cover");
          await boundAction(formData);
          toast.success("Alterações guardadas com sucesso!");
        } catch {
          toast.error("Não foi possível guardar as alterações.");
        }
      }}
      className="flex flex-col gap-6"
    >
      <div className="rounded-brand border border-line bg-paper p-5">
        <h2 className="font-display text-lg text-brand-navy">Capa</h2>
        <p className="mt-1 text-sm text-slate">
          Substitui, só na apresentação do site, a capa que vem do Pulse para este evento.
        </p>

        {effectiveCover && !removeCover && (
          <div className="mt-4 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- Pulse or Supabase Storage image */}
            <img src={effectiveCover} alt="" className="h-20 w-32 rounded-brand object-cover" />
            <div className="text-xs text-slate">
              {override?.coverImageUrl ? (
                <p>Capa personalizada em uso.</p>
              ) : (
                <p>A mostrar a capa original do Pulse (ainda sem substituição).</p>
              )}
              {override?.coverImageUrl && (
                <label className="mt-1.5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="removeCover"
                    onChange={(e) => setRemoveCover(e.target.checked)}
                  />
                  Remover capa personalizada (volta à do Pulse)
                </label>
              )}
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className={labelClass} htmlFor="cover">
            Nova imagem de capa
          </label>
          <input id="cover" name="cover" type="file" accept="image/*" className={inputClass} />
        </div>
      </div>

      <div className="rounded-brand border border-line bg-paper p-5">
        <h2 className="font-display text-lg text-brand-navy">Jogo de cores</h2>
        <p className="mt-1 text-sm text-slate">
          Troca o vermelho de destaque do site só na página deste evento (botões, ícones, estados activos).
          Deixa em branco para usar a cor padrão da MediaCraft.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <input
            type="color"
            aria-label="Cor de destaque"
            value={accentColor || DEFAULT_ACCENT}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-11 w-14 cursor-pointer rounded-brand border border-line bg-paper"
          />
          <input
            name="accentColor"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            placeholder={DEFAULT_ACCENT}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        {override && (
          <button
            type="button"
            onClick={onReset}
            disabled={pending}
            className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-brand-red disabled:opacity-50"
          >
            <RotateCcw size={14} />
            Repor visual original do Pulse
          </button>
        )}
      </div>
    </form>
  );
}
