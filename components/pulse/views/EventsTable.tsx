import { useTranslations } from "next-intl";
import { ConsolePanel } from "@/components/pulse/ConsolePanel";
import { StatusTag } from "@/components/pulse/StatusTag";
import { ADMIN_EVENTS } from "@/lib/bff/pulseConsoleMock";

export function EventsTable() {
  const t = useTranslations("pulse");
  const tCat = useTranslations("events.categories");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">{t("nav.events")}</h2>
        <p className="mt-1 font-mono text-xs text-slate">{t("events.subtitle")}</p>
      </div>

      <ConsolePanel title={t("nav.events")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[10px] tracking-wide text-slate uppercase">
                <th className="pb-3 pr-4">{t("events.thEvent")}</th>
                <th className="pb-3 pr-4">{t("events.thDate")}</th>
                <th className="pb-3 pr-4">{t("events.thCategory")}</th>
                <th className="pb-3 pr-4">{t("events.thVisibility")}</th>
                <th className="pb-3">{t("events.thRegistrations")}</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_EVENTS.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4 text-ink">{e.title}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate">{e.date}</td>
                  <td className="py-3 pr-4">
                    <StatusTag tone="navy">{tCat(e.category)}</StatusTag>
                  </td>
                  <td className="py-3 pr-4">
                    <StatusTag tone={e.visibility === "public" ? "success" : "red"}>
                      {t(`events.${e.visibility}`)}
                    </StatusTag>
                  </td>
                  <td className="py-3 font-mono text-xs text-slate">{e.registrations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ConsolePanel>
    </div>
  );
}
