"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Vote = "helpful" | "unhelpful" | null;

function storageKey(questionId: string) {
  return `mc-qa-vote-${questionId}`;
}

/** Like/dislike on one answer (2026-10-09, "mostrando o nível de
 * satisfação da resposta") — there's no visitor login on this site, so
 * "one vote per person" is enforced the same way the rest of the public
 * site handles anything per-visitor: a localStorage flag, not a server
 * identity. Read via a lazy useState initializer rather than
 * useEffect+setState — this only ever mounts after QA's own client-side
 * poll has already populated the question list (see QA.tsx), well past
 * hydration, so there's no SSR/client mismatch to guard against.
 *
 * Clicking the already-active button undoes that vote (2026-10-10,
 * "se a pessoa já tiver clicado... e quer desfazer basta clicar
 * novamente") — a misclick shouldn't be permanent. The *other* button
 * stays disabled while a vote is active: this only ever toggles the same
 * vote off, it doesn't switch helpful ↔ unhelpful directly. */
export function QuestionFeedback({
  questionId,
  helpfulCount,
  unhelpfulCount,
}: {
  questionId: string;
  helpfulCount: number;
  unhelpfulCount: number;
}) {
  const [vote, setVote] = useState<Vote>(() => {
    try {
      const stored = localStorage.getItem(storageKey(questionId));
      return stored === "helpful" || stored === "unhelpful" ? stored : null;
    } catch {
      return null;
    }
  });
  const [counts, setCounts] = useState({ helpful: helpfulCount, unhelpful: unhelpfulCount });

  function sendFeedback(type: "helpful" | "unhelpful", action: "vote" | "undo") {
    fetch(`/api/bff/questions/${questionId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, action }),
    }).catch(() => {});
  }

  function onClick(type: "helpful" | "unhelpful") {
    if (vote === type) {
      // Same button again — undo.
      setVote(null);
      setCounts((c) => ({ ...c, [type]: Math.max(0, c[type] - 1) }));
      try {
        localStorage.removeItem(storageKey(questionId));
      } catch {
        // Nothing to clean up if storage isn't available.
      }
      sendFeedback(type, "undo");
      return;
    }
    if (vote) return; // the other button, while a vote is active — no-op

    setVote(type);
    setCounts((c) => ({ ...c, [type]: c[type] + 1 }));
    try {
      localStorage.setItem(storageKey(questionId), type);
    } catch {
      // Private browsing or storage disabled — the vote still counts
      // server-side, it just won't be remembered as "already voted" here.
    }
    sendFeedback(type, "vote");
  }

  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-slate">
      <span>Esta resposta foi útil?</span>
      <button
        type="button"
        onClick={() => onClick("helpful")}
        disabled={!!vote && vote !== "helpful"}
        aria-label={vote === "helpful" ? "Desfazer voto útil" : "Útil"}
        aria-pressed={vote === "helpful"}
        className={cn(
          "flex items-center gap-1 rounded-full border px-2 py-1 transition-colors disabled:cursor-default",
          vote === "helpful" ? "border-success text-success" : "border-line hover:border-success hover:text-success",
        )}
      >
        <ThumbsUp size={12} />
        {counts.helpful}
      </button>
      <button
        type="button"
        onClick={() => onClick("unhelpful")}
        disabled={!!vote && vote !== "unhelpful"}
        aria-label={vote === "unhelpful" ? "Desfazer voto não útil" : "Não útil"}
        aria-pressed={vote === "unhelpful"}
        className={cn(
          "flex items-center gap-1 rounded-full border px-2 py-1 transition-colors disabled:cursor-default",
          vote === "unhelpful" ? "border-brand-red text-brand-red" : "border-line hover:border-brand-red hover:text-brand-red",
        )}
      >
        <ThumbsDown size={12} />
        {counts.unhelpful}
      </button>
    </div>
  );
}
