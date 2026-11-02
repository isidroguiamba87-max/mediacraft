import { getTranslations } from "next-intl/server";
import { SafeHtml } from "@/components/ui/SafeHtml";
import type { PulseEventDetail } from "@/lib/pulse/types";

/** "Detalhes" — the organizer's free-text description (`event.details`),
 * which used to sit at the top of the hero and was moved out of it in the
 * 2026-10-08 redesign ("aquela informação que ficava muito lá em cima").
 * Rendered as plain text inside EventShell's own content card — no photo
 * background of its own, per the reference supplied for this tab. */
export async function EventDetails({ event }: { event: PulseEventDetail }) {
  const t = await getTranslations("eventTabs");

  return event.details ? (
    <SafeHtml html={event.details} className="text-justify text-sm leading-relaxed text-slate" />
  ) : (
    <p className="text-sm text-slate">{t("detailsEmpty")}</p>
  );
}
