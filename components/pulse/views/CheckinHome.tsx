"use client";

import { useTranslations } from "next-intl";
import { ConsolePanel } from "@/components/pulse/ConsolePanel";
import { QRCode } from "@/components/pulse/QRCode";
import { initials } from "@/lib/utils";
import { CHECKIN_STATS, LAST_CHECKIN, MY_CREDENTIAL } from "@/lib/bff/pulseConsoleMock";

export function CheckinHome() {
  const t = useTranslations("pulse.checkin");
  const tProg = useTranslations("eventTabs.program");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">{t("title")}</h2>
        <p className="mt-1 font-mono text-xs text-slate">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <ConsolePanel title={t("scanning")} className="flex flex-col items-center text-center">
          <div className="relative flex aspect-square w-full max-w-[260px] items-center justify-center rounded-brand bg-brand-navy p-6">
            <QRCode seed={MY_CREDENTIAL.code} downloadLabel={t("download")} fileName="credencial-qr" />
          </div>
        </ConsolePanel>

        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4 rounded-brand border border-success/30 bg-success/5 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-brand bg-success/15 font-display text-lg text-success">
              {initials(LAST_CHECKIN.name)}
            </div>
            <div>
              <p className="font-display text-base text-ink">{LAST_CHECKIN.name}</p>
              <p className="font-mono text-[11px] text-slate">
                {t("confirmed")} · {tProg(LAST_CHECKIN.day)} · {LAST_CHECKIN.time} · {t("corporate")}
              </p>
            </div>
          </div>

          <ConsolePanel title={t("statsTitle")} subtitle={t("statsSubtitle")}>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-line">
                  <td className="py-3 text-slate">{t("total")}</td>
                  <td className="py-3 text-right font-mono text-ink">{CHECKIN_STATS.total}</td>
                </tr>
                <tr className="border-b border-line">
                  <td className="py-3 text-slate">{t("lastHour")}</td>
                  <td className="py-3 text-right font-mono text-ink">{CHECKIN_STATS.lastHour}</td>
                </tr>
                <tr className="border-b border-line">
                  <td className="py-3 text-slate">{t("corporates")}</td>
                  <td className="py-3 text-right font-mono text-ink">{CHECKIN_STATS.corporates}</td>
                </tr>
                <tr>
                  <td className="py-3 text-slate">{t("noShow")}</td>
                  <td className="py-3 text-right font-mono text-slate">{CHECKIN_STATS.noShow}</td>
                </tr>
              </tbody>
            </table>
          </ConsolePanel>
        </div>
      </div>
    </div>
  );
}
