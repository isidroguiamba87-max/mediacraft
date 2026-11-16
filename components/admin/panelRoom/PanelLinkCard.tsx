"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Link2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { newPanelLinkAction } from "@/app/admin/(protected)/interacao/actions";

/** The event's private link for the panelists' space: create it, copy it,
 * or replace it (the old link stops working). */
export function PanelLinkCard({ eventId, url }: { eventId: string; url: string | null }) {
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  function create(replace: boolean) {
    if (replace && !confirm("Gerar um link novo? O link actual deixa de funcionar para quem já o tem.")) return;
    start(async () => {
      try {
        await newPanelLinkAction(eventId);
        toast.success(replace ? "Novo link gerado." : "Link gerado.");
      } catch {
        toast.error("Não foi possível gerar o link. Confirme que o SQL da interação já foi corrido no Supabase.");
      }
    });
  }

  if (!url) {
    return (
      <div className="rounded-brand border border-line bg-paper p-5">
        <p className="text-sm text-slate">Este evento ainda não tem link de interação.</p>
        <Button type="button" onClick={() => create(false)} disabled={pending} className="mt-4">
          <Link2 size={16} />
          {pending ? "A gerar…" : "Gerar link"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-brand border border-line bg-paper p-5">
      <p className="text-xs font-medium text-slate">Link para os painelistas</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 w-full rounded-brand border border-line bg-paper-2 px-4 text-sm text-ink"
        />
        <Button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            } catch {
              toast.error("Copie o link à mão.");
            }
          }}
          className="shrink-0 justify-center"
        >
          <Copy size={16} />
          {copied ? "Copiado!" : "Copiar"}
        </Button>
      </div>
      <button
        type="button"
        onClick={() => create(true)}
        disabled={pending}
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate hover:text-brand-red disabled:opacity-50"
      >
        <RefreshCw size={13} />
        Gerar link novo (anula o actual)
      </button>
    </div>
  );
}
