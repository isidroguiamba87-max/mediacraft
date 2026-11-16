"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronRight, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** A grey "ID da reunião" / "Senha" box — tap to copy the value. */
function InfoBox({ label, value }: { label: string; value: string }) {
  const t = useTranslations("eventTabs");
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value.replace(/\s/g, ""));
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // clipboard blocked — the value is still on screen
        }
      }}
      aria-label={`${label}: ${value} — ${t("liveCopy")}`}
      className="group min-w-[12rem] flex-1 rounded-2xl bg-[#dadce1] px-5 py-4 text-left transition-colors hover:bg-[#d0d3d9] sm:flex-none"
    >
      <span className="flex items-center justify-between gap-3 text-sm text-brand-navy">
        {label}
        {copied ? (
          <Check aria-hidden className="h-4 w-4 text-brand-red" />
        ) : (
          <Copy aria-hidden className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-60" />
        )}
      </span>
      <span className="mt-1 block font-body text-2xl font-bold tracking-wide text-brand-navy sm:text-3xl">{value}</span>
    </button>
  );
}

/**
 * The white Zoom card from the client design (2026-11-13): "Participe
 * também pelo Zoom", the join / chat / instructions pills, then the meeting
 * ID and passcode boxes. Colours follow the event's accent (`--brand-red`,
 * set per event in the admin).
 */
export function LiveZoomCard({
  joinUrl,
  platform,
  meetingId,
  passcode,
  chatUrl,
  instructions,
}: {
  joinUrl: string;
  /** "Zoom", "Google Meet", "Microsoft Teams" — null for any other link. */
  platform: string | null;
  meetingId: string | null;
  passcode: string | null;
  chatUrl: string | null;
  instructions: string | null;
}) {
  const t = useTranslations("eventTabs");
  const [showInstructions, setShowInstructions] = useState(false);
  const outline =
    "inline-flex items-center rounded-full border-2 border-brand-red px-4 py-2 text-sm font-bold text-brand-navy transition-colors hover:bg-brand-red/10";

  return (
    <div className="w-full max-w-3xl rounded-[1.75rem] bg-white p-6 font-body shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:p-10">
      <h3 className="text-brand-red">
        <span className="font-body text-xl font-bold tracking-wide uppercase sm:text-2xl">{platform ? t("liveJoinTitle", { platform }) : t("liveJoinTitleGeneric")}</span>
      </h3>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href={joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-5 py-2.5 text-base font-bold text-white transition-colors hover:bg-brand-red-deep sm:text-lg"
        >
          {platform ? t("liveJoinVia", { platform }) : t("liveJoinGeneric")}
          <ChevronRight aria-hidden className="h-5 w-5" strokeWidth={3} />
        </a>
        {chatUrl && (
          <a href={chatUrl} target="_blank" rel="noopener noreferrer" className={outline}>
            {t("liveZoomChat")}
          </a>
        )}
        {instructions && (
          <button
            type="button"
            aria-expanded={showInstructions}
            onClick={() => setShowInstructions((v) => !v)}
            className={cn(outline, showInstructions && "bg-brand-red/10")}
          >
            {t("liveZoomInstructions")}
          </button>
        )}
      </div>

      {instructions && showInstructions && (
        <div className="reveal-up mt-4 rounded-2xl border border-line bg-paper-2 px-5 py-4 text-sm leading-relaxed whitespace-pre-line text-ink">
          {instructions}
        </div>
      )}

      {(meetingId || passcode) && (
        <div className="mt-6 flex flex-wrap gap-4">
          {meetingId && <InfoBox label={t("liveZoomMeetingId")} value={meetingId} />}
          {passcode && <InfoBox label={t("liveZoomPasscode")} value={passcode} />}
        </div>
      )}
    </div>
  );
}
