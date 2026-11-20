import { listGallery } from "@/lib/supabase/gallery";
import { getEvent, getPublicEvents } from "@/lib/pulse/endpoints";
import { UploadForms } from "@/components/admin/gallery/UploadForms";
import { GalleryItemCard } from "@/components/admin/gallery/GalleryItemCard";

export default async function AdminGalleryPage() {
  const [items, { events }] = await Promise.all([listGallery(), getPublicEvents({ status: "all" })]);
  const eventTitle = new Map(events.map((e) => [e.id, e.title]));
  // Each event's own sections (its Pulse agenda sections, set up when the
  // event is created) — offered as the photo's "Secção" so the public
  // /galeria and the event's Gallery tab can filter by them consistently.
  const details = await Promise.all(events.map((e) => getEvent(e.id)));
  const uploadEvents = events.map((e, i) => ({
    id: e.id,
    title: e.title,
    sections: [...new Set((details[i].event?.sections ?? []).map((s) => s.title.trim()).filter(Boolean))],
  }));

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-navy">Galeria</h1>
      <p className="mt-1 text-sm text-slate">
        Imagens e vídeos dos eventos. Cada evento é um álbum na Galeria do site: a foto com a ⭐ é a capa do álbum, e dentro dele as fotos ficam organizadas por momento (o campo &ldquo;Dia/sessão&rdquo;).
      </p>

      <div className="mt-6">
        <UploadForms events={uploadEvents} />
      </div>

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-brand border border-dashed border-line bg-paper px-6 py-16 text-center">
          <p className="text-sm text-slate">Ainda não há nada na galeria.</p>
        </div>
      ) : (
        // One block per event (= one album on the site); the star on a photo
        // makes it that album's cover.
        <div className="mt-8 flex flex-col gap-10">
          {[...new Set(items.map((i) => i.eventId))].map((eventId) => {
            const albumItems = items.filter((i) => i.eventId === eventId);
            const hasCover = albumItems.some((i) => i.isCover);
            return (
              <section key={eventId}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="font-display text-lg text-brand-navy">{eventTitle.get(eventId) ?? eventId}</h2>
                  <span className="text-xs text-slate">
                    {albumItems.length} {albumItems.length === 1 ? "item" : "itens"}
                    {hasCover ? "" : " · sem capa escolhida (usa a 1.ª foto) — carrega na ⭐ de uma foto"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {albumItems.map((item) => (
                    <GalleryItemCard key={item.id} item={item} eventTitle={eventTitle.get(item.eventId) ?? item.eventId} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
