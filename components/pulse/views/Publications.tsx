"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { ConsolePanel } from "@/components/pulse/ConsolePanel";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const PHASES = ["phaseBefore", "phaseDuring", "phaseAfter"] as const;

const PUBLISHED = [
  { id: "p1", text: "Bastidores da montagem do palco", tone: "orange" as const, date: "14 Mai" },
  { id: "p2", text: "Reunião de organização concluída", tone: "navy" as const, date: "10 Mai" },
  { id: "p3", text: "Campanha de inscrições lançada", tone: "success" as const, date: "02 Mai" },
];

export function Publications() {
  const t = useTranslations("pulse.publications");
  const [phase, setPhase] = useState<(typeof PHASES)[number]>("phaseBefore");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">{t("title")}</h2>
        <p className="mt-1 font-mono text-xs text-slate">{t("subtitle")}</p>
      </div>

      <div className="flex gap-1 rounded-brand bg-paper-2 p-1">
        {PHASES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPhase(p)}
            className={cn(
              "flex-1 rounded-brand px-3 py-2.5 font-mono text-xs font-semibold transition-colors",
              phase === p ? "bg-paper text-brand-navy shadow-sm" : "text-slate",
            )}
          >
            {t(p)}
          </button>
        ))}
      </div>

      <p className="rounded-brand border border-line bg-paper-2 px-4 py-3 font-mono text-[11px] text-slate">
        {t("note")}
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <ConsolePanel title={t("newTitle")} subtitle={t("newSubtitle")}>
          <div className="flex flex-col gap-4">
            <Select label={t("typeLabel")}>
              <option>Notícia</option>
              <option>Foto</option>
              <option>Vídeo</option>
              <option>Campanha</option>
            </Select>
            <input
              className="h-11 w-full rounded-brand border border-line px-4 text-sm outline-none focus-visible:border-brand-red"
              placeholder={t("titleLabel")}
            />
            <div className="flex flex-col items-center gap-2 rounded-brand border border-dashed border-line bg-paper-2 p-8 text-center">
              <Upload size={20} className="text-brand-navy" />
              <p className="text-sm text-slate">{t("mediaHint")}</p>
            </div>
            <Button className="justify-center">{t("publishCta")}</Button>
          </div>
        </ConsolePanel>

        <ConsolePanel title={t("listTitle")} subtitle={t("listSubtitle")}>
          <div className="flex flex-col divide-y divide-line">
            {PUBLISHED.map((p) => (
              <div key={p.id} className="flex items-start gap-3 py-3 first:pt-0">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background:
                      p.tone === "success"
                        ? "var(--success)"
                        : p.tone === "orange"
                          ? "var(--brand-red)"
                          : "var(--brand-navy)",
                  }}
                />
                <p className="text-sm text-ink">
                  {p.text}
                  <span className="ml-2 font-mono text-[10px] text-slate">{p.date}</span>
                </p>
              </div>
            ))}
          </div>
        </ConsolePanel>
      </div>
    </div>
  );
}
