"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { ConsolePanel } from "@/components/pulse/ConsolePanel";
import { KpiCard } from "@/components/pulse/KpiCard";
import { StatusTag } from "@/components/pulse/StatusTag";
import { SourceTag } from "@/components/pulse/SourceTag";
import { ChatDrawer } from "@/components/pulse/ChatDrawer";
import { Button } from "@/components/ui/Button";
import { initials } from "@/lib/utils";
import {
  PANELIST_STATS,
  PANELIST_QUESTIONS,
  PANELIST_RATINGS,
  CONVERSATIONS,
} from "@/lib/bff/pulseConsoleMock";

export function PanelistHome() {
  const t = useTranslations("pulse.panelist");
  const tRoles = useTranslations("pulse.roles");
  const [chatWith, setChatWith] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">Teresa Machel</h2>
        <p className="mt-1 font-mono text-xs text-slate">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard value={PANELIST_STATS.sessions} label={t("kSessions")} />
        <KpiCard
          value={PANELIST_STATS.questionsReceived}
          label={t("kQuestions")}
          trend={`${PANELIST_STATS.questionsPending} ${t("pending")}`}
          trendTone="alert"
        />
        <KpiCard value={PANELIST_STATS.rating.toFixed(1)} label={t("kRating")} trend={`▲ ${t("topRated")}`} />
        <KpiCard value={PANELIST_STATS.attendees} label={t("kAttendees")} />
      </div>

      <ConsolePanel
        title={
          <span className="flex items-center gap-2">
            {t("conversationsTitle")} <SourceTag source="bff" />
          </span>
        }
        subtitle={t("conversationsSubtitle")}
      >
        <div className="flex flex-col divide-y divide-line">
          {CONVERSATIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChatWith(c.name)}
              className="flex items-center gap-3 py-3 text-left first:pt-0 hover:opacity-80"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-brand bg-brand-navy font-display text-sm text-white">
                {initials(c.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
                  <span className="shrink-0 font-mono text-[10px] text-slate">{c.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs text-slate">{c.lastMessage}</p>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-red px-1.5 font-mono text-[10px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </ConsolePanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <ConsolePanel title={t("questionsTitle")} subtitle={t("questionsSubtitle")}>
          <div className="flex flex-col divide-y divide-line">
            {PANELIST_QUESTIONS.map((q) => (
              <div key={q.id} className="flex flex-col gap-2 py-3 first:pt-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-brand bg-brand-red font-display text-xs text-white">
                    {initials(q.name)}
                  </div>
                  <p className="text-sm font-semibold text-ink">{q.name}</p>
                  <StatusTag tone="alert">{t("pending")}</StatusTag>
                </div>
                <p className="text-sm text-ink">{q.question}</p>
              </div>
            ))}
          </div>
          <Button size="md" className="mt-4">
            {t("reply")}
          </Button>
        </ConsolePanel>

        <ConsolePanel title={t("materialsTitle")} subtitle={t("materialsSubtitle")}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-2 rounded-brand border border-dashed border-line bg-paper-2 p-8 text-center">
              <Upload size={20} className="text-brand-navy" />
              <p className="text-sm text-slate">{t("uploadCta")}</p>
            </div>

            <div>
              <p className="mb-3 font-mono text-[10px] tracking-wide text-slate uppercase">{t("ratingTitle")}</p>
              <div className="flex flex-col gap-3">
                <div>
                  <div className="mb-1.5 flex justify-between font-mono text-xs">
                    <span className="text-ink">{t("clarity")}</span>
                    <span className="text-slate">{PANELIST_RATINGS.clarity.toFixed(1)} ★</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                    <div
                      className="h-full rounded-full bg-brand-navy"
                      style={{ width: `${(PANELIST_RATINGS.clarity / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between font-mono text-xs">
                    <span className="text-ink">{t("relevance")}</span>
                    <span className="text-slate">{PANELIST_RATINGS.relevance.toFixed(1)} ★</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                    <div
                      className="h-full rounded-full bg-brand-navy"
                      style={{ width: `${(PANELIST_RATINGS.relevance / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ConsolePanel>
      </div>

      <ChatDrawer
        open={chatWith !== null}
        onClose={() => setChatWith(null)}
        peerName={chatWith ?? ""}
        peerRole={tRoles("participant")}
        canEnd
      />
    </div>
  );
}
