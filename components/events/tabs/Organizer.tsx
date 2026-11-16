import { getLocale, getTranslations } from "next-intl/server";
import { CalendarDays, MapPin } from "lucide-react";
import { PartnerCarousel, type CarouselPartner } from "@/components/events/PartnerCarousel";
import type { PulseEventDetail } from "@/lib/pulse/types";

/**
 * "Organizador" tab (2026-11-13 mock-up): the partners/supporters as a
 * single logo carousel (every partnership section flattened, section name
 * kept as each card's tooltip), then a navy→green banner closing out the
 * event — title, dates + venue, the organizer's contacts and the
 * copyright line.
 */
export async function Organizer({
  event,
}: {
  event: Pick<PulseEventDetail, "title" | "scheduleDates" | "location" | "organizedBy" | "partnershipSections">;
}) {
  const t = await getTranslations("eventTabs");
  const locale = await getLocale();

  const partners: CarouselPartner[] = event.partnershipSections.flatMap((s) =>
    s.partnerships.map((p) => ({ name: p.name, logoUrl: p.logoUrl || null, link: p.link, group: s.title })),
  );

  return (
    <div className="flex flex-col gap-10">
      {partners.length > 0 ? (
        <PartnerCarousel partners={partners} />
      ) : (
        <p className="text-sm text-slate">{t("partnersEmpty")}</p>
      )}

      <EventBanner event={event} locale={locale} rights={t("allRightsReserved")} />
    </div>
  );
}

function EventBanner({
  event,
  locale,
  rights,
}: {
  event: Pick<PulseEventDetail, "title" | "scheduleDates" | "location" | "organizedBy">;
  locale: string;
  rights: string;
}) {
  const { organizedBy, location } = event;
  const dates = splitDates(event.scheduleDates.map((d) => d.date), locale);
  const year = dates?.year ?? new Date().getFullYear();
  const contacts = [organizedBy?.mail, organizedBy?.phone].filter(Boolean) as string[];

  return (
    <section className="overflow-hidden rounded-[1.25rem] bg-gradient-to-r from-[#0b2a6b] via-[#0b4a6a] to-[#0a7a4a] px-6 py-9 text-center text-white sm:px-10 sm:py-10">
      <h3 className="font-body text-2xl leading-tight font-extrabold tracking-wide uppercase sm:text-3xl">
        {event.title}
      </h3>

      {(dates || location?.name) && (
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-body text-sm uppercase">
          {dates && (
            <span className="flex items-center gap-1.5">
              <CalendarDays aria-hidden className="h-4 w-4" />
              <span>
                {dates.days}, <strong className="font-extrabold">{dates.month}</strong>, {dates.year}
              </span>
            </span>
          )}
          {dates && location?.name && <span aria-hidden className="h-4 w-0.5 bg-white" />}
          {location?.name && (
            <span className="flex items-center gap-1.5">
              <MapPin aria-hidden className="h-4 w-4" />
              <span>
                <strong className="font-extrabold">{location.name}</strong>
                {location.address?.city && `, ${location.address.city}`}
              </span>
            </span>
          )}
        </p>
      )}

      {contacts.length > 0 && (
        <>
          <span aria-hidden className="mx-auto mt-5 block h-px w-full max-w-md bg-white/30" />
          <div className="mt-4 flex flex-col items-center gap-1 font-body text-base sm:text-lg">
            {organizedBy?.mail && (
              <a href={`mailto:${organizedBy.mail}`} className="hover:underline">
                {organizedBy.mail}
              </a>
            )}
            {organizedBy?.phone && (
              <a href={`tel:${organizedBy.phone.replace(/\s+/g, "")}`} className="hover:underline">
                {organizedBy.phone}
              </a>
            )}
          </div>
        </>
      )}

      <span aria-hidden className="mx-auto mt-5 block h-px w-full max-w-md bg-white/30" />
      <p className="mt-4 font-body text-xs text-white/85">
        © {year} {event.title} · {rights}
      </p>
    </section>
  );
}

/** "22 e 23" + "Julho" + 2026 from the schedule (first month's days only
 * when it spans months — rare, and the line is meant to stay short). */
function splitDates(isoDates: string[], locale: string) {
  if (isoDates.length === 0) return null;
  const dates = [...new Set(isoDates.map((d) => d.slice(0, 10)))]
    .sort()
    .map((d) => new Date(`${d}T12:00:00`));
  const first = dates[0];
  const sameMonth = dates.filter(
    (d) => d.getMonth() === first.getMonth() && d.getFullYear() === first.getFullYear(),
  );
  const and = locale === "en" ? "and" : locale === "fr" ? "et" : "e";
  const nums = sameMonth.map((d) => String(d.getDate()));
  const days = nums.length === 1 ? nums[0] : `${nums.slice(0, -1).join(", ")} ${and} ${nums[nums.length - 1]}`;
  return {
    days,
    month: new Intl.DateTimeFormat(locale, { month: "long" }).format(first),
    year: first.getFullYear(),
  };
}
