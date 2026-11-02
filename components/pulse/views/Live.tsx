"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { ConsolePanel } from "@/components/pulse/ConsolePanel";
import { StatusTag } from "@/components/pulse/StatusTag";
import { Button } from "@/components/ui/Button";

/** Publish live photos/video and update the streaming link — changes here
 * are meant to reflect instantly on the event micro-site's "Ao Vivo" tab. */
export function Live() {
  const t = useTranslations("pulse.live");
  const tRoles = useTranslations("pulse");
  const [link, setLink] = useState("https://zoom.us/j/8421290 · Painel Turismo");
  const [updated, setUpdated] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-ink">{t("title")}</h2>
          <p className="mt-1 font-mono text-xs text-slate">{t("subtitle")}</p>
        </div>
        <StatusTag tone="success">{tRoles("roles.admin")}</StatusTag>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ConsolePanel title={t("mediaTitle")} subtitle={t("mediaSubtitle")}>
          <div className="flex flex-col items-center gap-2 rounded-brand border border-dashed border-line bg-paper-2 p-8 text-center">
            <Upload size={20} className="text-brand-navy" />
            <p className="text-sm text-slate">{t("dropHint")}</p>
            <p className="font-mono text-[10px] text-slate/70">{t("dropSubtitle")}</p>
          </div>
        </ConsolePanel>

        <ConsolePanel title={t("linkTitle")} subtitle={t("linkSubtitle")}>
          <div className="flex flex-col gap-4">
            <input
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                setUpdated(false);
              }}
              className="h-11 w-full rounded-brand border border-line px-4 text-sm outline-none focus-visible:border-brand-red"
            />
            <Button size="md" onClick={() => setUpdated(true)}>
              {t("updateCta")}
            </Button>
            {updated && <p className="text-sm text-success">✓ {t("updateCta")}</p>}
            <p className="rounded-brand border border-line bg-paper-2 px-4 py-3 font-mono text-[11px] text-slate">
              {t("reflectNote")}
            </p>
          </div>
        </ConsolePanel>
      </div>
    </div>
  );
}
