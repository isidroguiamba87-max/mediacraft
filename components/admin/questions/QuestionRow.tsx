"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import {
  deleteQuestionAction,
  saveAnswerAction,
  setStatusAction,
  toggleRelevantAction,
} from "@/app/admin/(protected)/perguntas/actions";
import type { AdminQuestion, QuestionStatus } from "@/lib/supabase/questions";
import { cn, formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<QuestionStatus, string> = {
  new: "Nova",
  reviewed: "Revista",
  archived: "Arquivada",
};

export function QuestionRow({ question, eventTitle }: { question: AdminQuestion; eventTitle: string }) {
  const [answer, setAnswer] = useState(question.answer ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex flex-col gap-3 rounded-brand border border-line bg-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink">{question.question}</p>
          <p className="mt-1 text-xs text-slate">
            {question.name} · {eventTitle} ·{" "}
            {formatDate(question.createdAt, "pt", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
          {question.speakerName && (
            <p className="mt-1 text-xs font-medium text-brand-red">Para: {question.speakerName}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              question.status === "archived"
                ? "bg-paper-2 text-slate"
                : question.status === "reviewed"
                  ? "bg-brand-navy/10 text-brand-navy"
                  : "bg-brand-red/10 text-brand-red",
            )}
          >
            {STATUS_LABELS[question.status]}
          </span>

          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                const next = !question.isRelevant;
                await toggleRelevantAction(question.id, next, question.status);
                toast.success(next ? "Marcada como relevante — já visível no site." : "Já não está visível no site.");
              })
            }
            disabled={pending}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium disabled:opacity-50",
              question.isRelevant ? "border-brand-red bg-brand-red/10 text-brand-red" : "border-line text-slate",
            )}
          >
            <Check size={12} />
            {question.isRelevant ? "Visível no site" : "Marcar relevante"}
          </button>

          {question.status !== "archived" ? (
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await setStatusAction(question.id, "archived");
                  toast.success("Pergunta arquivada.");
                })
              }
              disabled={pending}
              className="rounded-full border border-line px-3 py-1 text-xs font-medium text-slate disabled:opacity-50"
            >
              Arquivar
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await setStatusAction(question.id, "reviewed");
                  toast.success("Pergunta reaberta.");
                })
              }
              disabled={pending}
              className="rounded-full border border-line px-3 py-1 text-xs font-medium text-slate disabled:opacity-50"
            >
              Reabrir
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (!confirm("Apagar esta pergunta? Não é possível desfazer.")) return;
              startTransition(async () => {
                await deleteQuestionAction(question.id);
                toast.success("Pergunta apagada com sucesso.");
              });
            }}
            disabled={pending}
            aria-label="Apagar"
            className="grid h-7 w-7 place-items-center rounded-full border border-line text-brand-red hover:bg-brand-red/10 disabled:opacity-50"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {(question.helpfulCount > 0 || question.unhelpfulCount > 0) && (
        <div className="flex items-center gap-3 text-xs text-slate">
          <span className="flex items-center gap-1">
            <ThumbsUp size={12} className="text-success" />
            {question.helpfulCount}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsDown size={12} className="text-brand-red" />
            {question.unhelpfulCount}
          </span>
          <span>a achar a resposta útil</span>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Resposta (opcional, interna por agora)"
          className="h-9 w-full rounded-brand border border-line bg-paper px-3 text-xs outline-none focus-visible:border-brand-red"
        />
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await saveAnswerAction(question.id, answer);
              toast.success("Resposta guardada com sucesso!");
            })
          }
          disabled={pending || answer === (question.answer ?? "")}
          className="shrink-0 rounded-brand border border-line px-3 text-xs font-medium text-brand-navy disabled:opacity-50"
        >
          Guardar
        </button>
      </div>
    </li>
  );
}
