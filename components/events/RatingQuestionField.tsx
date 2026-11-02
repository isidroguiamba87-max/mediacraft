"use client";

import { cn } from "@/lib/utils";
import type { RatingFormQuestion } from "@/lib/bff";

export type RatingAnswerValue = string | string[];

/** Shared between RatingPopup (event-wide) and PanelRatingButton
 * (per-panel) — same `rating_forms`/`rating_form_questions` schema backs
 * both, so the same four question types render identically either way. */
export function RatingQuestionField({
  question,
  value,
  onChange,
}: {
  question: RatingFormQuestion;
  value: RatingAnswerValue | undefined;
  onChange: (value: RatingAnswerValue) => void;
}) {
  const label = (
    <p className="text-xs font-medium text-slate">
      {question.label}
      {question.required && <span className="text-brand-red"> *</span>}
    </p>
  );

  if (question.type === "text") {
    return (
      <div>
        {label}
        <input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 h-9 w-full rounded-brand border border-line bg-paper px-3 text-sm outline-none focus-visible:border-brand-red"
        />
      </div>
    );
  }

  if (question.type === "scale") {
    const numeric = Number(value ?? 0);
    return (
      <div>
        {label}
        <div className="mt-1.5 flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(String(n))}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-medium",
                numeric === n ? "border-brand-red bg-brand-red text-white" : "border-line text-slate",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // single_choice / multi_choice
  const multi = question.type === "multi_choice";
  const selected = new Set(multi ? ((value as string[]) ?? []) : value ? [value as string] : []);

  function toggle(v: string) {
    if (multi) {
      const next = new Set(selected);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      onChange([...next]);
    } else {
      onChange(v);
    }
  }

  return (
    <div>
      {label}
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {(question.options ?? []).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              selected.has(opt.value) ? "border-brand-red text-brand-red" : "border-line text-slate",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
