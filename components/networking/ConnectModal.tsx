"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronRight, ExternalLink, Loader2, X } from "lucide-react";
import { LinkedinIcon, WhatsappIcon } from "@/components/ui/SocialIcons";
import { cn } from "@/lib/utils";
import { speakerSlug } from "@/lib/pulse/panels";
import { createNetworkingIntent } from "@/lib/networking/endpoints";
import {
  getStoredAttendeeId,
  resolveAttendeeIdFromContact,
  resolveAttendeeIdViaQrCode,
} from "@/lib/networking/attendeeIdentity";
import {
  NETWORKING_REASONS,
  type NetworkingChannelType,
  type NetworkingReason,
  type NetworkingSource,
} from "@/lib/networking/types";
import type { ConnectButtonSpeaker } from "./ConnectButton";

const REASON_LABELS: Record<NetworkingReason, string> = {
  negocio: "Negócio",
  parceria: "Parceria",
  tema: "Tema discutido",
  carreira: "Carreira",
  investimento: "Investimento",
  outro: "Outro",
};

const CHANNEL_LABELS: Record<NetworkingChannelType, string> = {
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  other: "Outro",
};

type Step = "reason" | "channel" | "identity";

/**
 * The funnel's 3-screen state machine (2026-10-12 spec) — Motivo → Canal
 * → Registo/Redireccionamento — plus a 4th step this codebase specifically
 * needs: "Identidade", shown once per event before the first submit,
 * since this site has no participant login to derive an attendee id from
 * (see lib/networking/attendeeIdentity.ts). Skipped entirely once an
 * attendee id is already stored for this event.
 *
 * Own dialog shell rather than reusing components/ui/Modal.tsx — that
 * component doesn't trap focus or return it to the opener, and this spec
 * explicitly requires both; extending the shared Modal for every existing
 * caller wasn't something to do without asking first.
 */
export function ConnectModal({
  open,
  onClose,
  speaker,
  eventId,
  isFree,
  source,
  sessionId,
}: {
  open: boolean;
  onClose: () => void;
  speaker: ConnectButtonSpeaker;
  eventId: string;
  isFree: boolean;
  source: NetworkingSource;
  sessionId: string | null;
}) {
  const [step, setStep] = useState<Step>("reason");
  const [reason, setReason] = useState<NetworkingReason | null>(null);
  const [channel, setChannel] = useState<NetworkingChannelType | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);
  const titleId = useId();

  // Reset-on-open as a render-time adjustment (React's own recommended
  // pattern for "reset state when a prop changes") rather than a
  // useEffect that calls setState directly — same `set-state-in-effect`
  // lint rule this project already worked around once before (see
  // EventShell.tsx's matchMedia handling). Ref writes aren't allowed
  // during render either, so capturing/restoring the opener for focus
  // management is split into the two effects below instead.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStep("reason");
      setReason(null);
      setChannel(null);
      setQrCode("");
      setContactName("");
      setContactEmail("");
      setIdentityError(null);
      setSubmitError(null);
      setSubmitting(false);
    }
  }

  // Must run (and thus capture the pre-open activeElement) before the
  // autofocus effect further down steals it — effects run in declaration
  // order, so this one stays first.
  useEffect(() => {
    if (open) openerRef.current = document.activeElement;
  }, [open]);

  useEffect(() => {
    if (!open && openerRef.current instanceof HTMLElement) {
      openerRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = dialogRef.current;
    node?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const focusable = node.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose, step]);

  if (!open) return null;

  async function submit(attendeeId: string) {
    if (!reason || !channel) return;
    setSubmitting(true);
    setSubmitError(null);

    // Opened synchronously, still inside the click's call stack — doing
    // this after the `await` below loses the user gesture and the
    // browser blocks the popup (the exact trap called out in the spec).
    // No `noopener`: we need to keep this window reference to set its
    // `href` once the POST resolves.
    const tab = window.open("", "_blank");

    try {
      const result = await createNetworkingIntent({
        eventId,
        speakerId: speakerSlug(speaker.name, speaker.company),
        sessionId,
        source,
        connectionReason: reason,
        channel,
        attendeeId,
      });
      if (tab) tab.location.href = result.redirectUrl;
      onClose();
    } catch {
      // Option A (2026-10-12 decision): never redirect without a
      // confirmed registration — close the blank tab rather than leave
      // it stranded, and let the participant retry.
      tab?.close();
      setSubmitError("Não foi possível registar a ligação agora. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onChannelConfirm() {
    if (!channel) return;
    const existing = getStoredAttendeeId(eventId);
    if (existing) {
      await submit(existing);
    } else {
      setSubmitError(null);
      setStep("identity");
    }
  }

  async function onIdentityConfirm() {
    setIdentityError(null);
    if (isFree) {
      if (!contactName.trim() || !contactEmail.trim()) {
        setIdentityError("Preencha o nome e o email.");
        return;
      }
      await submit(resolveAttendeeIdFromContact(eventId, contactName, contactEmail));
      return;
    }
    const result = await resolveAttendeeIdViaQrCode(eventId, qrCode);
    if ("error" in result) {
      setIdentityError(
        result.error === "invalid"
          ? "Código inválido — confira o código no seu bilhete."
          : "Não foi possível confirmar o código agora.",
      );
      return;
    }
    await submit(result.attendeeId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex w-full max-w-md flex-col gap-5 rounded-brand bg-paper p-6 shadow-brand"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-lg text-brand-navy">
            Conectar com {speaker.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            data-autofocus={step === "reason" ? undefined : "true"}
            className="shrink-0 rounded-full p-1.5 text-slate hover:bg-paper-2 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <p aria-live="polite" className="sr-only">
          {step === "reason" && "Passo 1 de 3: motivo do contacto"}
          {step === "channel" && "Passo 2 de 3: canal de contacto"}
          {step === "identity" && "Passo 3 de 3: identificação"}
        </p>

        {step === "reason" && (
          <fieldset>
            <legend className="text-sm font-medium text-ink">Qual é o motivo do contacto?</legend>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {NETWORKING_REASONS.map((r) => (
                <label
                  key={r}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-center rounded-brand border px-3 py-2.5 text-center text-sm transition-colors",
                    reason === r
                      ? "border-brand-red bg-brand-red/10 font-medium text-brand-red"
                      : "border-line text-ink hover:border-brand-red/50",
                  )}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="sr-only"
                    data-autofocus={r === NETWORKING_REASONS[0] ? "true" : undefined}
                  />
                  {REASON_LABELS[r]}
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep("channel")}
              disabled={!reason}
              className="mt-5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-brand-red px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-red-deep disabled:opacity-40"
            >
              Continuar
              <ChevronRight size={15} />
            </button>
          </fieldset>
        )}

        {step === "channel" && (
          <fieldset>
            <legend className="text-sm font-medium text-ink">Como quer continuar a conversa?</legend>
            <p className="mt-1 text-xs text-slate">Vai sair da MediaCraft para o canal escolhido.</p>
            <div className="mt-3 flex flex-col gap-2">
              {speaker.channels.map((c) => (
                <label
                  key={c.type}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-3 rounded-brand border px-4 py-2.5 text-sm transition-colors",
                    channel === c.type
                      ? "border-brand-red bg-brand-red/10 font-medium text-brand-red"
                      : "border-line text-ink hover:border-brand-red/50",
                  )}
                >
                  <input
                    type="radio"
                    name="channel"
                    checked={channel === c.type}
                    onChange={() => setChannel(c.type)}
                    className="sr-only"
                  />
                  {c.type === "linkedin" && <LinkedinIcon size={17} />}
                  {c.type === "whatsapp" && <WhatsappIcon size={17} />}
                  {c.type === "other" && <ExternalLink size={17} />}
                  {c.type === "other" ? c.label || CHANNEL_LABELS.other : CHANNEL_LABELS[c.type]}
                  <ExternalLink size={13} className="ml-auto shrink-0 text-slate" />
                </label>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setStep("reason")}
                className="min-h-11 rounded-full border border-line px-4 py-2.5 text-sm text-ink hover:bg-paper-2"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={onChannelConfirm}
                disabled={!channel || submitting}
                className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-red px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-red-deep disabled:opacity-40"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                {submitting ? "A registar…" : "Continuar"}
              </button>
            </div>
          </fieldset>
        )}

        {step === "identity" && (
          <div>
            {isFree ? (
              <>
                <p className="text-sm font-medium text-ink">Como podemos identificá-lo?</p>
                <p className="mt-1 text-xs text-slate">
                  Só para contar participantes únicos — não enviamos mensagens nem partilhamos com o orador.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="O seu nome"
                    data-autofocus="true"
                    className="h-11 rounded-brand border border-line px-4 text-sm outline-none focus-visible:border-brand-red"
                  />
                  <input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="O seu email"
                    type="email"
                    className="h-11 rounded-brand border border-line px-4 text-sm outline-none focus-visible:border-brand-red"
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-ink">Código do seu bilhete</p>
                <p className="mt-1 text-xs text-slate">
                  O mesmo código usado para desbloquear os materiais do evento.
                </p>
                <input
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Código do bilhete"
                  data-autofocus="true"
                  className="mt-3 h-11 w-full rounded-brand border border-line px-4 text-sm outline-none focus-visible:border-brand-red"
                />
              </>
            )}
            {identityError && <p className="mt-2 text-xs text-brand-red">{identityError}</p>}
            {submitError && <p className="mt-2 text-xs text-brand-red">{submitError}</p>}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setStep("channel")}
                disabled={submitting}
                className="min-h-11 rounded-full border border-line px-4 py-2.5 text-sm text-ink hover:bg-paper-2 disabled:opacity-40"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={onIdentityConfirm}
                disabled={submitting}
                className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-red px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-red-deep disabled:opacity-40"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                {submitting ? "A registar…" : submitError ? "Tentar novamente" : "Confirmar e continuar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
