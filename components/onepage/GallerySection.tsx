import { getTranslations } from "next-intl/server";
import { getAllGallery } from "@/lib/bff/gallery";
import { getEvent, getPublicEvents } from "@/lib/pulse/endpoints";
import { GlobalGallery, type GalleryEventOption } from "@/components/gallery/GlobalGallery";

/** #galeria on the one-page home — every event's published photos, filter
 * by event then by section (same component the old /galeria page used). */
export async function GallerySection() {
  const t = await getTranslations("galeria");
  const [items, { events }] = await Promise.all([getAllGallery(), getPublicEvents({ status: "all" })]);

  const order = [...new Set(items.map((i) => i.eventId))];
  const title = new Map(events.map((e) => [e.id, e.title]));
  const details = await Promise.all(order.map((id) => getEvent(id)));
  const eventOptions: GalleryEventOption[] = order.map((id, i) => ({
    id,
    title: title.get(id) ?? details[i].event?.title ?? id,
    sections: (details[i].event?.sections ?? []).map((s) => s.title.trim()).filter(Boolean),
  }));

  return (
    <div className="mx-auto max-w-container px-6 py-14 sm:py-20 lg:px-10">
      <div className="inline-block">
        <h2 className="text-brand-navy">
          <span className="font-body text-4xl font-bold uppercase sm:text-5xl">{t("title")}</span>
        </h2>
        <span aria-hidden className="mt-3 block h-px w-[calc(100%+0.5rem)] bg-brand-red" />
      </div>
      <div className="mt-6">
        <GlobalGallery items={items} events={eventOptions} />
      </div>
    </div>
  );
}
