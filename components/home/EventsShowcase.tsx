import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/config/i18n";
import { getPublicEvents } from "@/lib/pulse/endpoints";
import { EventCard } from "@/components/events/EventCard";
import { SectionHead } from "@/components/ui/SectionHead";
import { buttonVariants } from "@/components/ui/Button";

export async function EventsShowcase() {
  const t = await getTranslations("eventsShowcase");
  const { events } = await getPublicEvents({ status: "upcoming" });
  const featured = events.slice(0, 3);

  return (
    <section className="bg-paper-2">
      <div className="mx-auto max-w-container px-6 pt-10 pb-20 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead title={t("title")} />
          <Link
            href="/eventos"
            className={buttonVariants("ghost", "md", "shrink-0")}
          >
            {t("viewAll")}
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* No placeholder copy when there's nothing upcoming — the section
            just quietly has no cards, same as a "live now" badge elsewhere
            simply isn't there when nothing's live. It reappears on its own
            the moment a real upcoming event exists in Pulse. */}
        {featured.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:flex sm:flex-wrap sm:gap-6">
            {featured.map((event) => (
              <div key={event.id} className="sm:w-72">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
