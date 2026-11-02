"use client";

import { useTranslations } from "next-intl";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/components/pulse/KpiCard";
import { ConsolePanel } from "@/components/pulse/ConsolePanel";
import { StatusTag } from "@/components/pulse/StatusTag";
import {
  DASHBOARD_KPIS,
  WEEKLY_REGISTRATIONS,
  ACTIVITY_FEED,
  TODAY_SESSIONS,
  ALERTS,
  ATTENDANCE_BY_DAY,
} from "@/lib/bff/pulseConsoleMock";
import type { AdminView } from "@/components/pulse/ConsoleShell";

export function Dashboard({ onNavigate }: { onNavigate: (view: AdminView) => void }) {
  const t = useTranslations("pulse.dashboard");
  const tProg = useTranslations("eventTabs.program");
  const maxWeek = Math.max(...WEEKLY_REGISTRATIONS.map((w) => w.value));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-ink">{t("title")}</h2>
          <p className="mt-1 font-mono text-xs text-slate">{t("subtitle")}</p>
        </div>
        <Button size="md" onClick={() => onNavigate("create")}>
          <PlusCircle size={16} />
          {t("createCta")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard value={DASHBOARD_KPIS.registered} label={t("kpiRegistered")} trend={`▲ ${DASHBOARD_KPIS.registeredDelta} ${t("today")}`} />
        <KpiCard value={DASHBOARD_KPIS.checkinsToday} label={t("kpiCheckins")} trend={`${DASHBOARD_KPIS.checkinsRate} ${t("attendance")}`} />
        <KpiCard
          value={DASHBOARD_KPIS.questionsTotal}
          label={t("kpiQuestions")}
          trend={`${DASHBOARD_KPIS.questionsPending} ${t("pending")}`}
          trendTone="alert"
        />
        <KpiCard
          value={`${DASHBOARD_KPIS.revenue} MZN`}
          label={t("kpiRevenue")}
          trend={`${DASHBOARD_KPIS.ticketsSold} ${t("tickets")}`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ConsolePanel title={t("chartTitle")} subtitle={t("chartSubtitle")}>
          <div className="flex h-24 items-end gap-2">
            {WEEKLY_REGISTRATIONS.map((w) => (
              <div key={w.label} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-brand-navy to-brand-red/70"
                  style={{ height: `${(w.value / maxWeek) * 100}%` }}
                />
                <span className="font-mono text-[9px] text-slate">{w.label}</span>
              </div>
            ))}
          </div>
        </ConsolePanel>

        <ConsolePanel title={t("activityTitle")} subtitle={t("activitySubtitle")}>
          <div className="flex flex-col divide-y divide-line">
            {ACTIVITY_FEED.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-3 first:pt-0">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background:
                      a.tone === "green"
                        ? "var(--success)"
                        : a.tone === "orange"
                          ? "var(--brand-red)"
                          : "var(--brand-navy)",
                  }}
                />
                <div>
                  <p className="text-sm text-ink">{a.text}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate">· {a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ConsolePanel>
      </div>

      <ConsolePanel title={t("sessionsTitle")} subtitle={t("sessionsSubtitle")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[10px] tracking-wide text-slate uppercase">
                <th className="pb-3 pr-4">{t("thSession")}</th>
                <th className="pb-3 pr-4">{t("thRoom")}</th>
                <th className="pb-3 pr-4">{t("thStatus")}</th>
                <th className="pb-3">{t("thCheckin")}</th>
              </tr>
            </thead>
            <tbody>
              {TODAY_SESSIONS.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4 text-ink">{s.session}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate">{s.room}</td>
                  <td className="py-3 pr-4">
                    {s.status === "live" && <StatusTag tone="success">{t("onAir")}</StatusTag>}
                    {s.status === "scheduled" && <StatusTag tone="neutral">{s.time}</StatusTag>}
                    {s.status === "done" && <StatusTag tone="navy">{t("done")}</StatusTag>}
                  </td>
                  <td className="py-3 font-mono text-xs text-slate">{s.checkin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ConsolePanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <ConsolePanel title={t("alertsTitle")} subtitle={t("alertsSubtitle")}>
          <div className="flex flex-col gap-3">
            {ALERTS.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-brand border border-alert/30 bg-alert/5 p-3.5"
              >
                <span className="font-mono text-alert">◷</span>
                <div>
                  <p className="text-sm text-ink">{a.text}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate">{a.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </ConsolePanel>

        <ConsolePanel title={t("attendanceByDayTitle")} subtitle={t("attendanceByDaySubtitle")}>
          <div className="flex flex-col gap-4">
            {ATTENDANCE_BY_DAY.map((d) => (
              <div key={d.day}>
                <div className="mb-1.5 flex justify-between font-mono text-xs">
                  <span className="text-ink">{tProg(d.day)}</span>
                  <span className="text-slate">
                    {d.present} {t("present")} / {d.total} {t("expected")}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                  <div
                    className="h-full rounded-full bg-brand-navy"
                    style={{ width: `${(d.present / d.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ConsolePanel>
      </div>
    </div>
  );
}
