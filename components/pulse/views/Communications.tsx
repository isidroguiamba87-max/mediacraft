"use client";

import { useTranslations } from "next-intl";
import { ConsolePanel } from "@/components/pulse/ConsolePanel";
import { StatusTag } from "@/components/pulse/StatusTag";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { COMMS_HISTORY } from "@/lib/bff/pulseConsoleMock";

export function Communications() {
  const t = useTranslations("pulse.communications");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">{t("title")}</h2>
        <p className="mt-1 font-mono text-xs text-slate">{t("subtitle")}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ConsolePanel title={t("composeTitle")} subtitle={t("composeSubtitle")}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Select label={t("templateLabel")}>
                <option>Convite</option>
                <option>Carta de credenciação</option>
                <option>Lembrete</option>
              </Select>
              <Select label={t("toLabel")}>
                <option>{t("toAll")}</option>
                <option>{t("toDelegates")}</option>
                <option>{t("toCorporate")}</option>
              </Select>
            </div>
            <input
              className="h-11 w-full rounded-brand border border-line px-4 text-sm outline-none focus-visible:border-brand-red"
              defaultValue="Convite · Fórum de Diplomacia 2026"
            />
            <textarea
              rows={3}
              className="resize-none rounded-brand border border-line px-4 py-3 text-sm outline-none focus-visible:border-brand-red"
              defaultValue="Estimado(a) {nome}, {cargo} da {organização}…"
            />
            <div>
              <p className="mb-2 font-mono text-[10px] tracking-wide text-slate uppercase">
                {t("variablesLabel")}
              </p>
              <div className="flex flex-wrap gap-2">
                {["{nome}", "{cargo}", "{organização}", "{QR}"].map((v) => (
                  <span key={v} className="rounded-md border border-line bg-paper-2 px-2.5 py-1 font-mono text-[10px] text-slate">
                    {v}
                  </span>
                ))}
              </div>
            </div>
            <Button className="justify-center">{t("sendCta")}</Button>
          </div>
        </ConsolePanel>

        <ConsolePanel title={t("historyTitle")} subtitle={t("historySubtitle")}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[10px] tracking-wide text-slate uppercase">
                <th className="pb-3 pr-4">{t("thType")}</th>
                <th className="pb-3 pr-4">{t("thRecipients")}</th>
                <th className="pb-3">{t("thType")}</th>
              </tr>
            </thead>
            <tbody>
              {COMMS_HISTORY.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4 text-ink">{c.type}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate">{c.recipients}</td>
                  <td className="py-3">
                    <StatusTag tone={c.status === "sent" ? "success" : "alert"}>
                      {t(c.status)}
                    </StatusTag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ConsolePanel>
      </div>
    </div>
  );
}
