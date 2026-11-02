import { useTranslations } from "next-intl";
import { ConsolePanel } from "@/components/pulse/ConsolePanel";
import { StatusTag } from "@/components/pulse/StatusTag";
import { QA_MODERATION } from "@/lib/bff/pulseConsoleMock";

/** Organiser-side view of Q&A activity: counts per panel only — the
 * private message content between participant and panelist is never
 * surfaced here (see pulse.qa.privacyNote). */
export function QA() {
  const t = useTranslations("pulse.qa");
  const tDash = useTranslations("pulse.dashboard");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">{t("title")}</h2>
        <p className="mt-1 font-mono text-xs text-slate">{t("subtitle")}</p>
      </div>

      <p className="rounded-brand border border-line bg-paper-2 px-4 py-3 font-mono text-[11px] text-slate">
        🔒 {t("privacyNote")}
      </p>

      <ConsolePanel title={t("title")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[10px] tracking-wide text-slate uppercase">
                <th className="pb-3 pr-4">{t("thPanel")}</th>
                <th className="pb-3 pr-4">{t("thPanelist")}</th>
                <th className="pb-3 pr-4">{t("thQuestions")}</th>
                <th className="pb-3 pr-4">{t("thAnswered")}</th>
                <th className="pb-3">{t("thStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {QA_MODERATION.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4 text-ink">{row.panel}</td>
                  <td className="py-3 pr-4 text-ink">{row.panelist}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate">{row.questions}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate">{row.answered}</td>
                  <td className="py-3">
                    {row.pending > 0 ? (
                      <StatusTag tone="alert">
                        {row.pending} {tDash("pending")}
                      </StatusTag>
                    ) : (
                      <StatusTag tone="success">{t("active")}</StatusTag>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ConsolePanel>
    </div>
  );
}
