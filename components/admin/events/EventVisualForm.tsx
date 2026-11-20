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
import { assertValidPdfUpload } from "@/lib/uploadValidation";
import type { AdminEventOverride } from "@/lib/supabase/eventOverrides";

const inputClass =
  "h-11 w-full rounded-brand border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red";
const labelClass = "mb-1.5 block text-xs font-medium text-slate";

const DEFAULT_ACCENT = "#bf262e";
/** The cover's default shadow: brand navy at 60%. */
const DEFAULT_OVERLAY = "#001b32";
const DEFAULT_OVERLAY_PCT = 60;

const toHexAlpha = (pct: number) =>
  Math.round((Math.min(100, Math.max(0, pct)) / 100) * 255)
    .toString(16)
    .padStart(2, "0");

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
  // Cover shadow, stored as "#rrggbbaa" — split here into colour + strength.
  // "#rrggbbaa" or, for a gradient, "#rrggbbaa,#rrggbbaa" (left → right).
  const savedOverlay = override?.overlayColor ?? null;
  const savedStops = savedOverlay ? savedOverlay.split(",") : [];
  const [overlayHex, setOverlayHex] = useState(savedStops[0] ? savedStops[0].slice(0, 7) : DEFAULT_OVERLAY);
  const [overlayHex2, setOverlayHex2] = useState<string | null>(savedStops[1] ? savedStops[1].slice(0, 7) : null);
  const [overlayPct, setOverlayPct] = useState(
    savedStops[0] ? Math.round((parseInt(savedStops[0].slice(7, 9), 16) / 255) * 100) : DEFAULT_OVERLAY_PCT,
  );
  const [overlayTouched, setOverlayTouched] = useState(!!savedOverlay);
  const alpha = toHexAlpha(overlayPct);
  const overlayValue = overlayHex2 ? `${overlayHex}${alpha},${overlayHex2}${alpha}` : `${overlayHex}${alpha}`;
  const overlayCss = overlayHex2
    ? `linear-gradient(100deg, ${overlayHex}${alpha}, ${overlayHex2}${alpha})`
    : `${overlayHex}${alpha}`;
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removePdf, setRemovePdf] = useState(false);
  const [category, setCategory] = useState(override?.category ?? "evento");
  const [pending, startTransition] = useTransition();

  const boundAction = saveEventOverrideAction.bind(
    null,
    eventId,
    override?.coverImageUrl ?? null,
    override?.logoUrl ?? null,
    override?.tagline ?? null,
    override?.liveInfo ?? null,
    override?.category ?? "evento",
    override?.channels ?? null,
  );
  const effectiveCover = override?.coverImageUrl ?? pulseCoverUrl;

  function onReset() {
    if (!confirm("Repor este evento para o visual original do Pulse? A capa, a cor e a sombra personalizadas são removidas.")) {
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
          await replaceFileField(formData, "logo");
          const pdf = formData.get("programPdf");
          if (pdf instanceof File && pdf.size > 0) assertValidPdfUpload(pdf);
          await replaceFileField(formData, "programPdf");
          const result = await boundAction(formData);
          if (result?.error) {
            toast.error(result.error, { duration: 10000 });
            return;
          }
          toast.success("Alterações guardadas com sucesso!");
        } catch (err) {
          toast.error(
            err instanceof Error && /PDF/.test(err.message) ? err.message : "Não foi possível guardar as alterações.",
          );
        }
      }}
      className="flex flex-col gap-6"
    >
      <div className="rounded-brand border border-line bg-paper p-5">
        <h2 className="font-display text-lg text-brand-navy">Tipo</h2>
        <p className="mt-1 text-sm text-slate">
          Define em que secção da página inicial este evento aparece.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {(
            [
              ["evento", "Eventos"],
              ["comunicacao", "Comunicação"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink has-[:checked]:border-brand-red has-[:checked]:bg-brand-red/5 has-[:checked]:font-semibold"
            >
              <input
                type="radio"
                name="category"
                value={value}
                defaultChecked={(override?.category ?? "evento") === value}
                onChange={() => setCategory(value)}
                className="accent-brand-red"
              />
              {label}
            </label>
          ))}
        </div>
        {category === "comunicacao" && (
          <div className="mt-4">
            <label className={labelClass} htmlFor="channels">
              Canais (aparece por baixo do título, ex.: &ldquo;TVM, YouTube, Redes Sociais&rdquo;)
            </label>
            <input
              id="channels"
              name="channels"
              maxLength={120}
              defaultValue={override?.channels ?? ""}
              className={inputClass}
            />
          </div>
        )}
      </div>

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
        <h2 className="font-display text-lg text-brand-navy">Logótipo e tema</h2>
        <p className="mt-1 text-sm text-slate">
          O logótipo aparece na barra de cima da página do evento (no lugar do da MediaCraft). O tema aparece por
          baixo do nome do evento, na primeira tela.
        </p>

        {override?.logoUrl && !removeLogo && (
          <div className="mt-4 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image */}
            <img src={override.logoUrl} alt="" className="h-12 w-auto rounded border border-line bg-white p-1" />
            <label className="flex items-center gap-2 text-xs text-slate">
              <input type="checkbox" name="removeLogo" onChange={(e) => setRemoveLogo(e.target.checked)} />
              Remover logótipo
            </label>
          </div>
        )}

        <div className="mt-4">
          <label className={labelClass} htmlFor="logo">
            {override?.logoUrl ? "Novo logótipo" : "Logótipo do evento"} (PNG com fundo transparente, de preferência)
          </label>
          <input id="logo" name="logo" type="file" accept="image/*" className={inputClass} />
        </div>

        <div className="mt-4">
          <label className={labelClass} htmlFor="tagline">
            Tema (ex.: &ldquo;Tema: Transformar actividade económica em activos financiáveis…&rdquo;)
          </label>
          <textarea
            id="tagline"
            name="tagline"
            rows={2}
            defaultValue={override?.tagline ?? ""}
            className="w-full rounded-brand border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red"
          />
        </div>
      </div>

      <div className="rounded-brand border border-line bg-paper p-5">
        <h2 className="font-display text-lg text-brand-navy">Programa em PDF</h2>
        <p className="mt-1 text-sm text-slate">
          Aparece no topo da secção &ldquo;Programa&rdquo; do evento, para abrir ou descarregar. Sempre que o programa
          mudar, carregue aqui o PDF novo: substitui o anterior e a data de actualização fica registada.
        </p>
        {override?.programPdfUrl && !removePdf && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <a href={override.programPdfUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-red hover:underline">
              Ver PDF actual
            </a>
            {override.programPdfUpdatedAt && (
              <span className="text-xs text-slate">
                actualizado a{" "}
                {new Date(override.programPdfUpdatedAt).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}
              </span>
            )}
            <label className="flex items-center gap-2 text-xs text-slate">
              <input type="checkbox" name="removeProgramPdf" onChange={(e) => setRemovePdf(e.target.checked)} />
              Remover PDF
            </label>
          </div>
        )}
        <div className="mt-4">
          <label className={labelClass} htmlFor="programPdf">
            {override?.programPdfUrl ? "Carregar PDF actualizado" : "Carregar PDF do programa"} (até 25MB)
          </label>
          <input id="programPdf" name="programPdf" type="file" accept="application/pdf,.pdf" className={inputClass} />
        </div>
      </div>

      <div className="rounded-brand border border-line bg-paper p-5">
        <h2 className="font-display text-lg text-brand-navy">Ao Vivo (Zoom)</h2>
        <p className="mt-1 text-sm text-slate">
          Aparece na secção &ldquo;Ao Vivo&rdquo; do evento. O link de entrada vem do Pulse (link do evento); só
          preencha aqui se quiser usar outro. O ID da reunião é lido do link do Zoom quando não é preenchido.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="liveJoinUrl">
              Link para entrar (opcional)
            </label>
            <input
              id="liveJoinUrl"
              name="liveJoinUrl"
              type="url"
              placeholder="https://zoom.us/j/…"
              defaultValue={override?.liveInfo?.joinUrl ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="liveMeetingId">
              ID da reunião
            </label>
            <input
              id="liveMeetingId"
              name="liveMeetingId"
              placeholder="842 7512 2896"
              defaultValue={override?.liveInfo?.meetingId ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="livePasscode">
              Senha
            </label>
            <input
              id="livePasscode"
              name="livePasscode"
              placeholder="751947"
              defaultValue={override?.liveInfo?.passcode ?? ""}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="liveChatUrl">
              Link do chat da reunião (opcional)
            </label>
            <input
              id="liveChatUrl"
              name="liveChatUrl"
              type="url"
              placeholder="https://…"
              defaultValue={override?.liveInfo?.chatUrl ?? ""}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="liveInstructions">
              Instruções de acesso (opcional)
            </label>
            <textarea
              id="liveInstructions"
              name="liveInstructions"
              rows={4}
              defaultValue={override?.liveInfo?.instructions ?? ""}
              className="w-full rounded-brand border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red"
            />
          </div>
        </div>
      </div>

      <div className="rounded-brand border border-line bg-paper p-5">
        <h2 className="font-display text-lg text-brand-navy">Sombra da capa</h2>
        <p className="mt-1 text-sm text-slate">
          A cor que cobre a imagem de capa no topo da página do evento, por baixo do título. Escolhe a cor e a
          intensidade — a pré-visualização mostra como fica.
        </p>

        <div className="relative mt-4 h-32 overflow-hidden rounded-brand bg-brand-navy">
          {effectiveCover && (
            // eslint-disable-next-line @next/next/no-img-element -- Pulse or Supabase Storage image
            <img src={effectiveCover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <span className="absolute inset-0" style={{ background: overlayCss }} />
          <span className="relative flex h-full items-center px-5 font-display text-lg text-white">
            Título do evento
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="color"
            aria-label="Cor da sombra"
            value={overlayHex}
            onChange={(e) => {
              setOverlayHex(e.target.value);
              setOverlayTouched(true);
            }}
            className="h-11 w-14 cursor-pointer rounded-brand border border-line bg-paper"
          />
          <label className="flex flex-1 items-center gap-3 text-sm text-slate">
            Intensidade
            <input
              type="range"
              min={0}
              max={95}
              value={overlayPct}
              onChange={(e) => {
                setOverlayPct(Number(e.target.value));
                setOverlayTouched(true);
              }}
              className="flex-1 accent-brand-red"
            />
            <span className="w-10 text-right tabular-nums">{overlayPct}%</span>
          </label>
          {overlayHex2 ? (
            <>
              <span className="text-sm text-slate">→</span>
              <input
                type="color"
                aria-label="Segunda cor do degradé"
                value={overlayHex2}
                onChange={(e) => {
                  setOverlayHex2(e.target.value);
                  setOverlayTouched(true);
                }}
                className="h-11 w-14 cursor-pointer rounded-brand border border-line bg-paper"
              />
              <button
                type="button"
                onClick={() => {
                  setOverlayHex2(null);
                  setOverlayTouched(true);
                }}
                className="text-xs text-slate underline hover:text-brand-red"
              >
                Só uma cor
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOverlayHex2("#1f8a7a");
                setOverlayTouched(true);
              }}
              className="text-xs text-slate underline hover:text-brand-red"
            >
              + Degradé (2.ª cor)
            </button>
          )}
          {overlayTouched && (
            <button
              type="button"
              onClick={() => {
                setOverlayHex2(null);
                setOverlayHex(DEFAULT_OVERLAY);
                setOverlayPct(DEFAULT_OVERLAY_PCT);
                setOverlayTouched(false);
              }}
              className="text-xs text-slate underline hover:text-brand-red"
            >
              Usar a padrão
            </button>
          )}
        </div>
        {/* changed → the new value; reset after one was saved → "default"
            (clears it); otherwise empty (left as is) */}
        <input
          type="hidden"
          name="overlayColor"
          value={overlayTouched ? overlayValue : savedOverlay ? "default" : ""}
        />
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
