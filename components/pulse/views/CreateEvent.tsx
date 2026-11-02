"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, Check } from "lucide-react";
import { ConsolePanel } from "@/components/pulse/ConsolePanel";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

const fieldClass =
  "h-11 w-full rounded-brand border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red";

const MODULE_KEYS = ["news", "live", "program", "speakers", "library", "gallery", "qa", "tickets"] as const;

export function CreateEvent() {
  const t = useTranslations("pulse.create");
  const tEvents = useTranslations("pulse.events");
  const tCat = useTranslations("events.categories");
  const tTabs = useTranslations("eventTabs");
  const [modules, setModules] = useState<string[]>([...MODULE_KEYS]);
  const [created, setCreated] = useState(false);

  function toggleModule(key: string) {
    setModules((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">{t("title")}</h2>
        <p className="mt-1 font-mono text-xs text-slate">{t("subtitle")}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ConsolePanel title={t("basicTitle")} subtitle={t("basicSubtitle")}>
          <div className="flex flex-col gap-4">
            <input className={fieldClass} placeholder={t("nameLabel")} />
            <div className="grid grid-cols-2 gap-4">
              <Select label={t("categoryLabel")}>
                <option>{tCat("conference")}</option>
                <option>{tCat("forum")}</option>
                <option>{tCat("workshop")}</option>
                <option>{tCat("summit")}</option>
              </Select>
              <Select label={t("visibilityLabel")}>
                <option>{tEvents("public")}</option>
                <option>{tEvents("private")}</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input className={fieldClass} placeholder={t("daysLabel")} />
              <input className={fieldClass} placeholder={t("venueLabel")} />
            </div>
            <input className={fieldClass} placeholder={t("streamLabel")} />
          </div>
        </ConsolePanel>

        <ConsolePanel title={t("programTitle")} subtitle={t("programSubtitle")}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2 rounded-brand border border-dashed border-line bg-paper-2 p-8 text-center">
              <Upload size={20} className="text-brand-navy" />
              <p className="text-sm text-slate">{t("uploadHint")}</p>
              <p className="font-mono text-[10px] text-slate/70">PDF · DOCX · XLSX</p>
            </div>
            <p className="text-center font-mono text-[10px] text-slate">{t("or")}</p>
            <Button variant="ghost" className="justify-center">
              {t("writeManually")}
            </Button>

            <div className="mt-2">
              <p className="mb-3 font-mono text-[10px] tracking-wide text-slate uppercase">
                {t("modulesLabel")}
              </p>
              <div className="flex flex-wrap gap-2">
                {MODULE_KEYS.map((key) => {
                  const active = modules.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleModule(key)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                        active
                          ? "border-brand-navy bg-brand-navy text-white"
                          : "border-line text-slate hover:bg-paper-2"
                      }`}
                    >
                      {active && <Check size={12} />}
                      {tTabs(key)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </ConsolePanel>
      </div>

      <div>
        <Button onClick={() => setCreated(true)}>{t("submit")}</Button>
        {created && (
          <p className="mt-3 text-sm text-success">✓ {t("submit")}</p>
        )}
      </div>
    </div>
  );
}
