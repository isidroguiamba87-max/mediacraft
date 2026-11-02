"use client";

import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { ConsolePanel } from "@/components/pulse/ConsolePanel";
import { KpiCard } from "@/components/pulse/KpiCard";
import { Button } from "@/components/ui/Button";
import { REPORT_STATS, REPORT_ATTENDANCE } from "@/lib/bff/pulseConsoleMock";

function toCsv() {
  const header = "Participante,Email,Bilhete,Dia 1,Dia 2,Avaliacao";
  const rows = [
    "Ana Timane,ana@email.com,Delegado,Presente,Presente,5",
    "Carlos Mucavele,carlos@email.com,Corporativo,Presente,Ausente,4",
    "Sofia Rungo,sofia@email.com,Visitante,Presente,Presente,5",
  ];
  return [header, ...rows].join("\n");
}

function downloadCsv() {
  const blob = new Blob([toCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "relatorio-forum-diplomacia-2026.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function Report() {
  const t = useTranslations("pulse.report");
  const tProg = useTranslations("eventTabs.program");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-ink">{t("title")}</h2>
          <p className="mt-1 font-mono text-xs text-slate">{t("subtitle")}</p>
        </div>
        <Button variant="ghost" size="md" onClick={downloadCsv}>
          <Download size={16} />
          {t("exportCta")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard value={REPORT_STATS.attendees} label={t("attendeesLabel")} />
        <KpiCard value={`${REPORT_STATS.attendanceRate}%`} label={t("attendanceRateLabel")} />
        <KpiCard value={REPORT_STATS.questions} label={t("questionsLabel")} />
        <KpiCard value={REPORT_STATS.rating.toFixed(1)} label={t("ratingLabel")} />
      </div>

      <ConsolePanel title={t("attendanceTitle")} subtitle={t("attendanceSubtitle")}>
        <div className="flex flex-col gap-4">
          {REPORT_ATTENDANCE.map((d) => (
            <div key={d.day}>
              <div className="mb-1.5 flex justify-between font-mono text-xs">
                <span className="text-ink">{tProg(d.day)}</span>
                <span className="text-slate">
                  {d.present} / {d.total} · {d.pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                <div className="h-full rounded-full bg-brand-navy" style={{ width: `${d.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-brand border border-line bg-paper-2 px-4 py-3 font-mono text-[11px] text-slate">
          {t("note")}
        </p>
      </ConsolePanel>
    </div>
  );
}
