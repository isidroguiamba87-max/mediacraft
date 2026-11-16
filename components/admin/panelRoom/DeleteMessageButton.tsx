"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deletePanelMessageAction } from "@/app/admin/(protected)/interacao/actions";

export function DeleteMessageButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label="Apagar mensagem"
      disabled={pending}
      onClick={() => {
        if (!confirm("Apagar esta mensagem? Não pode ser desfeito.")) return;
        start(async () => {
          try {
            await deletePanelMessageAction(id);
          } catch {
            toast.error("Não foi possível apagar a mensagem.");
          }
        });
      }}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate hover:bg-paper-2 hover:text-brand-red disabled:opacity-50"
    >
      <Trash2 size={15} />
    </button>
  );
}
