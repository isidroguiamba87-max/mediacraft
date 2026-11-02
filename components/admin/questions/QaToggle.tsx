"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { MessageCircleQuestion } from "lucide-react";
import { setQaEnabledAction } from "@/app/admin/(protected)/perguntas/actions";
import { cn } from "@/lib/utils";

export function QaToggle({ eventId, enabled }: { eventId: string; enabled: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          const next = !enabled;
          await setQaEnabledAction(eventId, next);
          toast.success(next ? "Secção Perguntas ativada no site." : "Secção Perguntas desativada no site.");
        })
      }
      disabled={pending}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium disabled:opacity-50",
        enabled ? "border-brand-red bg-brand-red/10 text-brand-red" : "border-line text-slate",
      )}
    >
      <MessageCircleQuestion size={12} />
      {enabled ? "Perguntas ativas no site" : "Ativar Perguntas no site"}
    </button>
  );
}
