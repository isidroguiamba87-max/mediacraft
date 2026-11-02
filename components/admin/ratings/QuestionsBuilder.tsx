"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  addQuestionAction,
  deleteQuestionAction,
} from "@/app/admin/(protected)/avaliacao/actions";
import type { AdminRatingFormQuestion, RatingQuestionType } from "@/lib/supabase/ratings";

const inputClass =
  "h-11 w-full rounded-brand border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red";
const labelClass = "mb-1.5 block text-xs font-medium text-slate";

const TYPE_LABELS: Record<RatingQuestionType, string> = {
  single_choice: "Escolha única",
  multi_choice: "Escolha múltipla",
  text: "Texto livre",
  scale: "Escala",
};

function AddSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending} className="w-full justify-center sm:w-auto">
      <Plus size={16} />
      {pending ? "A adicionar…" : "Adicionar pergunta"}
    </Button>
  );
}

function DeleteQuestionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await deleteQuestionAction(id);
          toast.success("Pergunta apagada com sucesso.");
        })
      }
      disabled={pending}
      aria-label="Apagar pergunta"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-brand-red hover:bg-brand-red/10 disabled:opacity-50"
    >
      <Trash2 size={14} />
    </button>
  );
}

export function QuestionsBuilder({
  formId,
  questions,
}: {
  formId: string | null;
  questions: AdminRatingFormQuestion[];
}) {
  const [type, setType] = useState<RatingQuestionType>("text");
  const needsOptions = type === "single_choice" || type === "multi_choice";

  if (!formId) {
    return (
      <p className="text-sm text-slate">
        Guarda primeiro as definições acima (cria o formulário) para poderes adicionar perguntas extra.
      </p>
    );
  }

  const boundAction = addQuestionAction.bind(null, formId, questions.length);

  return (
    <div>
      {questions.length > 0 && (
        <ul className="mb-5 flex flex-col divide-y divide-line rounded-brand border border-line bg-paper">
          {questions.map((q) => (
            <li key={q.id} className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">
                  {q.label}
                  {q.required && <span className="text-brand-red"> *</span>}
                </p>
                <p className="mt-0.5 text-xs text-slate">
                  {TYPE_LABELS[q.type]}
                  {q.options && q.options.length > 0 && ` · ${q.options.map((o) => o.label).join(", ")}`}
                </p>
              </div>
              <DeleteQuestionButton id={q.id} />
            </li>
          ))}
        </ul>
      )}

      <form
        action={async (formData) => {
          try {
            await boundAction(formData);
            toast.success("Pergunta adicionada com sucesso!");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Não foi possível adicionar a pergunta.");
          }
        }}
        className="rounded-brand border border-dashed border-line bg-paper p-5"
      >
        <p className="mb-3 text-xs font-semibold tracking-wide text-slate uppercase">Nova pergunta</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="q-label">
              Texto da pergunta
            </label>
            <input id="q-label" name="label" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="q-type">
              Tipo
            </label>
            <select
              id="q-type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as RatingQuestionType)}
              className={inputClass}
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {needsOptions && (
          <div className="mt-3">
            <label className={labelClass} htmlFor="q-options">
              Opções (uma por linha)
            </label>
            <textarea
              id="q-options"
              name="options"
              rows={3}
              placeholder={"Muito bom\nBom\nRazoável\nFraco"}
              className="w-full resize-y rounded-brand border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus-visible:border-brand-red"
            />
          </div>
        )}

        <label className="mt-3 flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="required" />
          Obrigatória
        </label>

        <div className="mt-4">
          <AddSubmitButton />
        </div>
      </form>
    </div>
  );
}
