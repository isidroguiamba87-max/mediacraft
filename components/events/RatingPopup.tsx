"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Star, X, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitRatingAction } from "@/app/[locale]/eventos/[eventId]/rating-actions";
import { RatingQuestionField, type RatingAnswerValue } from "./RatingQuestionField";
import type { ActiveRatingForm } from "@/lib/bff";

const DISMISS_KEY_PREFIX = "mc-rating-dismissed-";
const SHOW_DELAY_MS = 1600;

type AnswerValue = RatingAnswerValue;
type Step = "intro" | "form" | "done";

/**
 * Full-screen pop-up asking visitors to rate the event — only rendered
 * when the admin's form is active and (if set) the current time is
 * inside its window (see getActiveRatingForm in lib/bff). Two steps on
 * purpose (2026-10-05, matching a reference design the user liked): an
 * "intro" screen with the event's own cover photo as a poster and a
 * clear choice (answer vs. just enter the site), THEN the actual
 * stars/comment/questions form — rather than dropping the whole form on
 * someone the moment the page loads. Closing it at any point (either
 * button, the X, or a real submission) remembers that in localStorage
 * per event, so it never nags the same visitor twice — deliberately
 * client-only state, no participant login on this site to hang it off.
 */
export function RatingPopup({
  eventId,
  form,
  coverUrl,
}: {
  eventId: string;
  form: ActiveRatingForm;
  coverUrl: string | null;
}) {
  const t = useTranslations("rating");
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<Step>("intro");
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState("");
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const dismissKey = `${DISMISS_KEY_PREFIX}${eventId}`;

  useEffect(() => {
    try {
      if (localStorage.getItem(dismissKey)) return;
    } catch {
      // Private browsing / storage blocked — just show it, worst case it
      // can reappear on a later visit.
    }
    const id = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(id);
  }, [dismissKey]);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(dismissKey, "1");
    } catch {
      // Nothing to do — it just might reappear next visit.
    }
  }

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
      });
      setStep("done");
      try {
        localStorage.setItem(dismissKey, "1");
      } catch {
        // Already submitted either way — just a missed "don't show again".
      }
      setTimeout(() => setOpen(false), 2200);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const missingRequired = form.questions.some((q) => {
    if (!q.required) return false;
    const v = answers[q.id];
    return q.type === "multi_choice" ? !Array.isArray(v) || v.length === 0 : !v;
  });

  return (
    <AnimatePresence>
      {visible && open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-brand-navy/70 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("close")}
            className="fixed top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-brand hover:text-brand-red"
          >
            <X size={18} />
          </button>

          <motion.div
            role="dialog"
            aria-label={t("title")}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="flex w-full max-w-md flex-col items-center gap-4"
          >
            {coverUrl && (
              <div className="w-full overflow-hidden rounded-2xl shadow-brand">
                {/* eslint-disable-next-line @next/next/no-img-element -- remote Pulse media */}
                <img src={coverUrl} alt="" className="max-h-64 w-full object-cover" />
              </div>
            )}

            <div className="w-full rounded-2xl bg-paper p-6 shadow-brand">
              {step === "done" ? (
                <div className="py-4 text-center">
                  <p className="font-display text-lg text-brand-navy">{t("thanksTitle")}</p>
                  <p className="mt-1 text-sm text-slate">{t("thanksBody")}</p>
                </div>
              ) : step === "intro" ? (
                <div className="text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                    <ClipboardList size={20} />
                  </div>
                  <p className="mt-3 font-display text-lg text-brand-navy">{t("title")}</p>
                  <p className="mt-2 text-sm text-slate">{t("subtitle")}</p>

                  <div className="mt-5 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => setStep("form")}
                      className="w-full rounded-full bg-brand-red px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-red-deep"
                    >
                      {t("respond")}
                    </button>
                    <button
                      type="button"
                      onClick={dismiss}
                      className="flex w-full items-center justify-center gap-1.5 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-slate hover:bg-paper-2"
                    >
                      <X size={14} />
                      {t("closeAndEnter")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-display text-lg text-brand-navy">{t("title")}</p>

                  <div className="mt-4 flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setStars(n)}
                        onMouseEnter={() => setHoverStars(n)}
                        onMouseLeave={() => setHoverStars(0)}
                        aria-label={`${n} ${t("stars")}`}
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
                    placeholder={t("commentPlaceholder")}
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

                  {error && <p className="mt-2 text-xs text-brand-red">{t("error")}</p>}

                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={stars === 0 || missingRequired || busy}
                    className="mt-4 w-full rounded-full bg-brand-red px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-red-deep disabled:opacity-50"
                  >
                    {busy ? t("sending") : t("submit")}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
