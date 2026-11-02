"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Star, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitRatingAction } from "@/app/[locale]/eventos/[eventId]/rating-actions";
import { RatingQuestionField, type RatingAnswerValue } from "./RatingQuestionField";
import type { ActiveRatingForm } from "@/lib/bff";

const RATED_KEY_PREFIX = "mc-panel-rating-done-";

/**
 * Per-panel counterpart to the event-wide RatingPopup (2026-10-14: "deve
 * ser possível fazer avaliação por painel" — this must be possible for
 * every panel, not an admin opt-in). Reuses the exact same active form
 * (same questions an admin already configured once in "Avaliação") —
 * only the attribution differs: this tags the submission with the
 * panel's own `key` as `sessionId` (see lib/supabase/ratings.ts's
 * getRatingsBySession for the admin-side breakdown that reads it back).
 *
 * Renders nothing when there's no active form, same contract as
 * ConnectButton rendering nothing when a speaker has no channels — a
 * visible-but-useless button is worse than no button. Also renders
 * nothing until the panel's own `date`+`timeTo` has passed (2026-10-15:
 * "a ideia é esse botão aparecer assim que o tempo estipulado para o
 * painel terminar" — this button times itself off the panel's own
 * schedule, not the admin's event-wide rating window; that window is
 * what gates the separate "rate the whole event" pop-up instead). Same
 * date+timeTo combining convention as lib/utils.ts's `latestScheduleEnd`.
 */
export function PanelRatingButton({
  eventId,
  sessionId,
  date,
  timeTo,
  form,
}: {
  eventId: string;
  sessionId: string;
  /** The panel's own ISO date (see lib/pulse/panels.ts's `Panel.date`). */
  date: string;
  /** The panel's own end time, "HH:MM" (see `Panel.timeTo`). */
  timeTo: string;
  form: ActiveRatingForm;
}) {
  const t = useTranslations("panelRating");
  const tr = useTranslations("rating");
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState("");
  const [answers, setAnswers] = useState<Record<string, RatingAnswerValue>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const ratedKey = `${RATED_KEY_PREFIX}${eventId}-${sessionId}`;

  // Read via useSyncExternalStore (same workaround as EventShell.tsx's
  // matchMedia handling) rather than a useEffect + setState: the
  // `react-hooks/set-state-in-effect` lint rule flags calling setState
  // synchronously in an effect body, and a subscribe-less snapshot read
  // like this sidesteps it entirely. `getServerSnapshot` returns false —
  // localStorage doesn't exist during this Client Component's SSR pass —
  // and the real value is picked up on the client's first paint. After a
  // successful submit, `setOpen(false)` below triggers a re-render that
  // re-reads this snapshot, so `rated` flips to true without needing its
  // own setState call.
  const rated = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(ratedKey) !== null;
      } catch {
        return false;
      }
    },
    () => false,
  );

  const missingRequired = form.questions.some((q) => {
    if (!q.required) return false;
    const v = answers[q.id];
    return q.type === "multi_choice" ? !Array.isArray(v) || v.length === 0 : !v;
  });

  // `Date.now()` is an impure read — same `useSyncExternalStore` escape
  // hatch as `rated` above, this time flagged by the `react-hooks/purity`
  // rule rather than `set-state-in-effect`. Server snapshot is `false`
  // (never claim a panel has ended during SSR), real value lands on the
  // client's first paint.
  const hasEnded = useSyncExternalStore(
    () => () => {},
    () => Date.now() >= new Date(`${date.slice(0, 10)}T${timeTo || "23:59"}:00`).getTime(),
    () => false,
  );
  if (!hasEnded) return null;

  async function onSubmit() {
    if (stars === 0) return;
    setBusy(true);
    setError(false);
    try {
      await submitRatingAction({
        eventId,
        formId: form.formId,
        stars,
        comment: comment.trim() || undefined,
        answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
        sessionId,
      });
      try {
        localStorage.setItem(ratedKey, "1");
      } catch {
        // Already submitted either way — just a missed "don't ask again".
      }
      setOpen(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={rated}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
          rated ? "border-line text-slate" : "border-brand-red text-brand-red hover:bg-brand-red/10",
        )}
      >
        {rated ? <Check size={15} /> : <Star size={15} />}
        {rated ? t("rated") : t("cta")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-brand-navy/70 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={tr("close")}
            className="fixed top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-brand hover:text-brand-red"
          >
            <X size={18} />
          </button>

          <div
            role="dialog"
            aria-label={t("title")}
            className="w-full max-w-md rounded-2xl bg-paper p-6 shadow-brand"
          >
            <p className="font-display text-lg text-brand-navy">{t("title")}</p>

            <div className="mt-4 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHoverStars(n)}
                  onMouseLeave={() => setHoverStars(0)}
                  aria-label={`${n} ${tr("stars")}`}
                  className="p-0.5"
                >
                  <Star
                    size={28}
                    className={cn(
                      "transition-colors",
                      n <= (hoverStars || stars) ? "fill-brand-red text-brand-red" : "text-line",
                    )}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={tr("commentPlaceholder")}
              rows={2}
              className="mt-4 w-full resize-none rounded-brand border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-brand-red"
            />

            {form.questions.length > 0 && (
              <div className="mt-3 flex flex-col gap-3">
                {form.questions.map((q) => (
                  <RatingQuestionField
                    key={q.id}
                    question={q}
                    value={answers[q.id]}
                    onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                  />
                ))}
              </div>
            )}

            {error && <p className="mt-2 text-xs text-brand-red">{tr("error")}</p>}

            <button
              type="button"
              onClick={onSubmit}
              disabled={stars === 0 || missingRequired || busy}
              className="mt-4 w-full rounded-full bg-brand-red px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-red-deep disabled:opacity-50"
            >
              {busy ? tr("sending") : tr("submit")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
