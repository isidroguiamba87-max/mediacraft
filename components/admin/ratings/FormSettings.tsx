"use client";

import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { saveFormSettingsAction } from "@/app/admin/(protected)/avaliacao/actions";
import type { AdminRatingForm } from "@/lib/supabase/ratings";

const inputClass =
  "h-11 w-full rounded-brand border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red";
const labelClass = "mb-1.5 block text-xs font-medium text-slate";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full justify-center sm:w-auto">
      {pending ? "A guardar…" : "Guardar"}
    </Button>
  );
}

export function FormSettings({ eventId, form }: { eventId: string; form: AdminRatingForm | null }) {
  const boundAction = saveFormSettingsAction.bind(null, eventId);

  return (
    <form
      action={async (formData) => {
        try {
          await boundAction(formData);
          toast.success("Alterações guardadas com sucesso!");
        } catch {
          toast.error("Não foi possível guardar as alterações.");
        }
      }}
      className="rounded-brand border border-line bg-paper p-5"
    >
      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <input type="checkbox" name="isActive" defaultChecked={form?.isActive} />
        Formulário activo
      </label>
      <p className="mt-1 text-xs text-slate">
        Enquanto activo e dentro da janela, o pop-up de avaliação aparece no site para quem visitar a página do
        evento.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="windowStart">
            Início da janela (opcional)
          </label>
          <input
            id="windowStart"
            name="windowStart"
            type="datetime-local"
            defaultValue={form?.windowStart?.slice(0, 16)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="windowEnd">
            Fim da janela (opcional)
          </label>
          <input
            id="windowEnd"
            name="windowEnd"
            type="datetime-local"
            defaultValue={form?.windowEnd?.slice(0, 16)}
            className={inputClass}
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-slate">
        Deixa em branco para não ter limite nesse lado (ex.: só preencher o início para ficar activo até
        desactivares à mão).
      </p>

      <div className="mt-4">
        <SubmitButton />
      </div>
    </form>
  );
}
