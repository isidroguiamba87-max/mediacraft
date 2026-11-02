"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { NetworkingReason, NetworkingSpeakerStat } from "@/lib/networking/types";

const REASON_LABELS: Record<NetworkingReason, string> = {
  negocio: "Negócio",
  parceria: "Parceria",
  tema: "Tema discutido",
  carreira: "Carreira",
  investimento: "Investimento",
  outro: "Outro",
};

/** Client-side .xlsx, straight from the rows already loaded on the page —
 * no extra request, no backend endpoint needed for the export itself
 * (originally CSV per the 2026-10-12 spec, switched to a real Excel file
 * on request — "baixar um arquivo excel" instead). `write-excel-file` is
 * write-only (no parser), so none of SheetJS's parsing-side CVEs apply;
 * `import()`ed on click rather than at module scope to keep it out of the
 * admin bundle until someone actually exports. */
export function NetworkingExportButton({ rows }: { rows: NetworkingSpeakerStat[] }) {
  const [exporting, setExporting] = useState(false);

  async function onExport() {
    setExporting(true);
    try {
      const writeXlsxFile = (await import("write-excel-file/browser")).default;
      const header = [
        { value: "Orador", fontWeight: "bold" as const },
        { value: "Intenções recebidas", fontWeight: "bold" as const },
        { value: "Motivo principal", fontWeight: "bold" as const },
        { value: "Sessões", fontWeight: "bold" as const },
      ];
      const data = rows.map((r) => [
        { value: r.speakerName },
        { value: r.intentsCount, type: Number },
        { value: r.topReason ? REASON_LABELS[r.topReason] : "" },
        { value: r.sessionTitles.join("; ") },
      ]);
      await writeXlsxFile([header, ...data]).toFile("networking.xlsx");
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onExport}
      disabled={rows.length === 0 || exporting}
      className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-paper-2 disabled:opacity-50"
    >
      {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      Exportar Excel
    </button>
  );
}
