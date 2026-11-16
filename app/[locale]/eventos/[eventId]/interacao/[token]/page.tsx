import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getEvent } from "@/lib/pulse/endpoints";
import { getEventOverride } from "@/lib/bff";
import { isValidPanelToken } from "@/lib/supabase/panelRoom";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { darkenHex } from "@/lib/utils";
import { EventTopBar } from "@/components/events/EventHero";
import { PanelRoom } from "@/components/events/PanelRoom";

// A private link — never indexed, never cached.
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * The panelists' interaction space (2026-11-13), reached only through the
 * private link generated in the admin's "Interação": the event's own top
 * bar and cover on top, then the place to write and read messages. Any
 * other token → 404.
 */
export default async function PanelRoomPage({
  params,
}: {
  params: Promise<{ locale: string; eventId: string; token: string }>;
}) {
  const { locale, eventId, token } = await params;
  setRequestLocale(locale);
  if (!isSupabaseConfigured) notFound();

  const ok = await isValidPanelToken(eventId, token).catch(() => false);
  if (!ok) notFound();

  const [{ event }, override, t] = await Promise.all([
    getEvent(eventId),
    getEventOverride(eventId),
    getTranslations({ locale, namespace: "panelRoom" }),
  ]);
  if (!event) notFound();

  const coverUrl = override?.coverImageUrl ?? event.coverUrl;
  const overlay = override?.overlayColor
    ? override.overlayColor.includes(",")
      ? `linear-gradient(100deg, ${override.overlayColor.split(",").join(", ")})`
      : override.overlayColor
    : undefined;
  const style = {
    ...(override?.accentColor
      ? { "--brand-red": override.accentColor, "--brand-red-deep": darkenHex(override.accentColor) }
      : {}),
    ...(overlay ? { "--event-overlay": overlay } : {}),
  } as React.CSSProperties;

  return (
    <div style={style} className="bg-white">
      <EventTopBar logoUrl={override?.logoUrl ?? null} title={event.title} />

      <section className="px-4 pb-8 sm:px-6 lg:px-10">
        <div className="relative mx-auto flex min-h-[15rem] max-w-[1600px] items-center justify-center overflow-hidden rounded-[1.25rem] bg-brand-navy px-6 py-12 text-center text-white sm:min-h-[19rem] sm:rounded-[1.75rem]">
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- remote Pulse / Supabase media
            <img src={coverUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          )}
          <span
            aria-hidden
            className="absolute inset-0"
            style={{ background: "var(--event-overlay, rgb(0 27 50 / 0.6))" }}
          />
          <div className="relative">
            <p className="font-body text-xs font-bold tracking-[0.2em] uppercase opacity-90 sm:text-sm">{t("kicker")}</p>
            <h1 className="mt-3 text-white">
              <span className="block font-body text-3xl leading-tight font-bold uppercase sm:text-5xl">{event.title}</span>
            </h1>
            {override?.tagline && (
              <p className="mx-auto mt-3 max-w-3xl font-body text-sm font-bold uppercase sm:text-base">
                {override.tagline}
              </p>
            )}
          </div>
        </div>
      </section>

      <PanelRoom eventId={eventId} token={token} />
    </div>
  );
}
