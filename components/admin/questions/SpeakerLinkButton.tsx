"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Link2 } from "lucide-react";
import { getSpeakerLinkAction } from "@/app/admin/(protected)/perguntas/actions";

export function SpeakerLinkButton({ eventId, speakerName }: { eventId: string; speakerName: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          try {
            const path = await getSpeakerLinkAction(eventId, speakerName);
            await navigator.clipboard.writeText(`${window.location.origin}${path}`);
            toast.success(`Link de ${speakerName} copiado! Envie por WhatsApp ou email.`);
          } catch {
            toast.error("Não foi possível gerar o link.");
          }
        })
      }
      disabled={pending}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-slate transition-colors hover:border-brand-red hover:text-brand-red disabled:opacity-50"
    >
      <Link2 size={12} />
      {pending ? "A gerar…" : `Copiar link de ${speakerName}`}
    </button>
  );
}
