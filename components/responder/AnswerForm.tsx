"use client";

import { useState, useTransition } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { submitAnswerAction } from "@/app/responder/[token]/actions";

export function AnswerForm({
  token,
  questionId,
  initialAnswer,
}: {
  token: string;
  questionId: string;
  initialAnswer: string | null;
}) {
  const [answer, setAnswer] = useState(initialAnswer ?? "");
  const [savedAnswer, setSavedAnswer] = useState(initialAnswer);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await submitAnswerAction(token, questionId, answer);
        setSavedAnswer(answer.trim());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível guardar a resposta.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2">
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Escreva a sua resposta…"
        rows={3}
        className="resize-none rounded-brand border border-line bg-paper px-4 py-3 text-sm outline-none focus-visible:border-brand-red"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !answer.trim()}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-red-deep disabled:opacity-50"
        >
          <Send size={13} />
          {pending ? "A guardar…" : savedAnswer ? "Atualizar resposta" : "Enviar resposta"}
        </button>
        {!pending && savedAnswer && savedAnswer === answer.trim() && (
          <span className="flex items-center gap-1 text-xs text-success">
            <CheckCircle2 size={13} />
            Guardada
          </span>
        )}
        {error && <span className="text-xs text-brand-red">{error}</span>}
      </div>
    </form>
  );
}
