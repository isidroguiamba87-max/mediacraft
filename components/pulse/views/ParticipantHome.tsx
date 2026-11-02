"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { ConsolePanel } from "@/components/pulse/ConsolePanel";
import { SourceTag } from "@/components/pulse/SourceTag";
import { QRCode } from "@/components/pulse/QRCode";
import { ChatDrawer } from "@/components/pulse/ChatDrawer";
import { Button } from "@/components/ui/Button";
import { initials } from "@/lib/utils";
import { ADMIN_EVENTS, MY_TICKET, SESSION_PANELISTS } from "@/lib/bff/pulseConsoleMock";

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="mt-1.5 flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={n <= value ? "text-brand-red" : "text-slate/40 hover:text-slate"}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function ParticipantHome() {
  const t = useTranslations("pulse.participant");
  const tRoles = useTranslations("pulse.roles");
  const [chatWith, setChatWith] = useState<{ name: string; role: string } | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  function downloadEventsCsv() {
    const header = "Evento,Data,Local,Categoria";
    const rows = ADMIN_EVENTS.map((e) => `"${e.title}",${e.date},—,${e.category}`);
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eventos-mediacraft.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-ink">{t("title")}</h2>
          <p className="mt-1 font-mono text-xs text-slate">{t("subtitle")}</p>
        </div>
        <Button variant="ghost" size="md" onClick={downloadEventsCsv}>
          <Download size={16} />
          {t("downloadCta")}
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ConsolePanel title={t("ticketTitle")} subtitle={t("ticketCaption")}>
          <div className="flex flex-col items-center gap-4">
            <QRCode seed={MY_TICKET.code} downloadLabel={t("downloadQr")} fileName="bilhete-mediacraft" />
          </div>
        </ConsolePanel>

        <ConsolePanel title={t("upcomingTitle")} subtitle={t("upcomingSubtitle")}>
          <div className="flex flex-col divide-y divide-line">
            {ADMIN_EVENTS.map((e) => (
              <div key={e.id} className="flex items-center gap-3 py-3 first:pt-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{e.title}</p>
                  <p className="font-mono text-[10px] text-slate">{e.date}</p>
                </div>
                <Button variant="ghost" size="md" className="shrink-0">
                  {t("register")}
                </Button>
              </div>
            ))}
          </div>
        </ConsolePanel>
      </div>

      <ConsolePanel
        title={
          <>
            {t("panelistsTitle")} <SourceTag source="bff" />
          </>
        }
        subtitle={t("panelistsSubtitle")}
      >
        <div className="flex flex-col divide-y divide-line">
          {SESSION_PANELISTS.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-brand bg-brand-red font-display text-sm text-white">
                {initials(p.name)}
              </div>
              <div className="min-w-[8rem] flex-1">
                <p className="text-sm font-semibold text-ink">{p.name}</p>
                <p className="font-mono text-[11px] text-slate">{p.role}</p>
                <Stars
                  value={ratings[p.id] ?? 0}
                  onChange={(v) => setRatings((prev) => ({ ...prev, [p.id]: v }))}
                />
              </div>
              <Button
                variant="secondary"
                size="md"
                className="shrink-0"
                onClick={() => setChatWith({ name: p.name, role: p.role })}
              >
                {t("talk")}
              </Button>
            </div>
          ))}
        </div>
      </ConsolePanel>

      <ChatDrawer
        open={chatWith !== null}
        onClose={() => setChatWith(null)}
        peerName={chatWith?.name ?? ""}
        peerRole={chatWith?.role ?? tRoles("panelist")}
      />
    </div>
  );
}
