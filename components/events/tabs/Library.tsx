"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Download, KeyRound, Lock } from "lucide-react";
import { getEventMaterials } from "@/lib/pulse/endpoints";
import { Button } from "@/components/ui/Button";
import type { PulseMaterial } from "@/lib/pulse/types";

function toDisplayItems(materials: PulseMaterial[]) {
  return materials.map((m) => ({ id: m.id, name: m.title, type: m.type ?? "", href: m.url }));
}

function FileRow({ name, type, href }: { name: string; type?: string | null; href: string }) {
  const t = useTranslations("eventTabs");
  return (
    <li className="flex items-center gap-4 py-4 first:pt-0">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-brand bg-paper-2">
        <FileText size={18} className="text-brand-red" />
      </span>
      <div className="flex-1">
        <p className="text-sm text-ink">{name}</p>
        {type && <p className="text-xs text-slate">{type}</p>}
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-navy hover:text-brand-red"
      >
        <Download size={15} />
        {t("libraryDownload")}
      </a>
    </li>
  );
}

/**
 * A private event's materials are gated by the participant's ticket QR
 * code (query param `qrCode`, confirmed from
 * `participant/materials.routes.ts` — NOT a bearer token). Which model
 * applies is the event's own `isMaterialPublic` flag (confirmed real,
 * 2026-10-01): public events show materials straight away, with no code
 * box at all — only a private event (`isPublic: false`) gets the "have a
 * ticket code?" field, which re-fetches with it. `locked` (the real
 * `E-109 QR_CODE_NEEDED` business error) only matters for a private
 * event; it's a normal state, not a failure — never shown as fake/mock
 * materials, since those would look real and lead nowhere.
 *
 * Admin-uploaded documents (a second, separate source alongside these
 * Pulse materials) were retired 2026-10-10 — "todos os documentos virão
 * da plataforma Pulse" — so this is Pulse materials only now.
 */
export function Library({
  eventId,
  initialMaterials,
  initialLocked,
  isPublic,
}: {
  eventId: string;
  initialMaterials: PulseMaterial[];
  initialLocked: boolean;
  isPublic: boolean;
}) {
  const t = useTranslations("eventTabs");
  const [materials, setMaterials] = useState(initialMaterials);
  const [locked, setLocked] = useState(isPublic ? false : initialLocked);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function onUnlock() {
    if (!qrCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await getEventMaterials(eventId, { qrCode: qrCode.trim() });
      setMaterials(result.materials);
      setLocked(result.locked);
      setError(result.error);
    } finally {
      setBusy(false);
    }
  }

  const items = toDisplayItems(materials);

  return (
    <div>
      {!isPublic && (
        <div className="mb-6 flex flex-col gap-3 rounded-brand border border-line bg-paper-2 p-4 sm:flex-row sm:items-center">
          <KeyRound size={18} className="hidden shrink-0 text-brand-red sm:block" />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">{t("libraryCodeTitle")}</p>
            <p className="text-xs text-slate">{t("libraryCodeHint")}</p>
          </div>
          <div className="flex gap-2">
            <input
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder={t("libraryCodePlaceholder")}
              className="h-10 w-full rounded-brand border border-line px-3 text-sm outline-none focus-visible:border-brand-red sm:w-44"
            />
            <Button
              variant="secondary"
              onClick={onUnlock}
              disabled={busy || !qrCode.trim()}
              className="shrink-0"
            >
              {busy ? t("libraryCodeChecking") : t("libraryCodeUnlock")}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mb-4 text-xs text-brand-red">{error}</p>}

      {locked ? (
        <div className="flex flex-col items-center gap-3 rounded-brand border border-dashed border-line py-16 text-center">
          <Lock size={22} className="text-slate" />
          <p className="text-sm text-slate">{t("libraryLocked")}</p>
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate">{t("libraryEmpty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {items.map((file) => (
            <FileRow key={file.id} name={file.name} type={file.type} href={file.href} />
          ))}
        </ul>
      )}
    </div>
  );
}
