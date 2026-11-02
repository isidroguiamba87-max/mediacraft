"use client";

import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { buildPanels } from "@/lib/pulse/panels";
import { QuestionFeedback } from "./QuestionFeedback";
import type { EventQuestion } from "@/lib/bff";
import type { PulseEventSection } from "@/lib/pulse/types";

const POLL_INTERVAL_MS = 15_000;

/** No WebSocket/real-time layer yet, so the question list is refreshed by
 * polling the BFF route on an interval, same as the Live tab.
 *
 * `sections` (2026-10-09) lets an asker optionally target a specific panel
 * and, within it, a specific speaker — "caso eu esteja a fazer uma
 * pergunta direcionada a uma pessoa ou a um painel específico". Both
 * selects are optional; most questions aren't directed at anyone. Neither
 * is a foreign key — see EventQuestion.panelTitle's comment — just the
 * chosen panel/speaker's label, snapshotted at submit time, which is also
 * what the admin panel groups by. */
export function QA({ eventId, sections }: { eventId: string; sections: PulseEventSection[] }) {
  const t = useTranslations("eventTabs");
  const locale = useLocale();
  const panels = useMemo(() => buildPanels(sections), [sections]);
  const [questions, setQuestions] = useState<EventQuestion[]>([]);
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [panelKey, setPanelKey] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const selectedPanel = panels.find((p) => p.key === panelKey) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/bff/events/${eventId}/questions`, {
          cache: "no-store",
        });
        const data = (await res.json()) as { questions: EventQuestion[] };
        if (!cancelled) setQuestions(data.questions);
      } catch {
        // Keep showing the last known list if a poll fails.
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [eventId]);

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !question.trim()) return;
    setStatus("sending");
    // Not added to the visible list here: a new question is unmoderated
    // (`is_relevant = false` until an admin approves it in the panel), so
    // it only appears once a later poll picks it up as approved.
    await fetch(`/api/bff/events/${eventId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        question,
        panelTitle: selectedPanel?.title,
        speakerName: speakerName || undefined,
      }),
    });
    setQuestion("");
    setStatus("sent");
    setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        <h3 className="font-display text-lg text-brand-navy">{t("qaTitle")}</h3>
        {questions.length === 0 ? (
          <p className="mt-4 text-sm text-slate">{t("qaEmpty")}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {questions.map((q) => (
              <li key={q.id} className="rounded-brand border border-line p-4">
                {/* Asker's message — a chat bubble, not a plain line, so a
                    reply underneath it reads as a reply (2026-10-09:
                    "como se fosse uma chat de duas pessoas"). */}
                <p className="text-xs font-semibold text-brand-navy">{q.name}</p>
                <p className="mt-1.5 w-fit max-w-[85%] rounded-2xl rounded-tl-sm bg-paper-2 px-4 py-2.5 text-sm text-ink">
                  {q.question}
                </p>
                <p className="mt-1.5 text-[11px] text-slate">
                  {formatDate(q.createdAt, locale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {(q.panelTitle || q.speakerName) && ` · ${[q.panelTitle, q.speakerName].filter(Boolean).join(" · ")}`}
                </p>

                {q.answer && (
                  <div className="mt-3 flex flex-col items-end">
                    <p className="text-xs font-semibold text-brand-red">{q.speakerName || t("qaAnswerLabel")}</p>
                    <p className="mt-1.5 w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-navy px-4 py-2.5 text-sm text-white">
                      {q.answer}
                    </p>
                    <QuestionFeedback
                      questionId={q.id}
                      helpfulCount={q.helpfulCount}
                      unhelpfulCount={q.unhelpfulCount}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex h-fit flex-col gap-3 rounded-brand border border-line p-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("qaNamePlaceholder")}
          required
          className="h-11 rounded-brand border border-line px-4 text-sm outline-none focus-visible:border-brand-red"
          aria-label="Name"
        />
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("qaPlaceholder")}
          required
          rows={3}
          className="resize-none rounded-brand border border-line px-4 py-3 text-sm outline-none focus-visible:border-brand-red"
        />

        {panels.length > 0 && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate">{t("qaPanelLabel")}</label>
              <select
                value={panelKey}
                onChange={(e) => {
                  setPanelKey(e.target.value);
                  setSpeakerName("");
                }}
                className="h-11 w-full rounded-brand border border-line bg-paper px-3 text-sm outline-none focus-visible:border-brand-red"
              >
                <option value="">{t("qaPanelPlaceholder")}</option>
                {panels.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedPanel && selectedPanel.speakers.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate">{t("qaSpeakerLabel")}</label>
                <select
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  className="h-11 w-full rounded-brand border border-line bg-paper px-3 text-sm outline-none focus-visible:border-brand-red"
                >
                  <option value="">{t("qaSpeakerPlaceholder")}</option>
                  {selectedPanel.speakers.map((sp, i) => (
                    <option key={i} value={sp.name}>
                      {sp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        <Button type="submit" disabled={status === "sending"} className="justify-center">
          <Send size={15} />
          {status === "sending" ? t("qaSending") : t("qaSubmit")}
        </Button>
        {status === "sent" && (
          <p className="text-xs text-success">{t("qaSent")}</p>
        )}
      </form>
    </div>
  );
}
