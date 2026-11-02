import { listGallery } from "@/lib/supabase/gallery";
import { getPublicEvents } from "@/lib/pulse/endpoints";
import { UploadForms } from "@/components/admin/gallery/UploadForms";
import { GalleryItemCard } from "@/components/admin/gallery/GalleryItemCard";

export default async function AdminGalleryPage() {
  const [items, { events }] = await Promise.all([listGallery(), getPublicEvents({ status: "all" })]);
  const eventTitle = new Map(events.map((e) => [e.id, e.title]));

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-navy">Galeria</h1>
      <p className="mt-1 text-sm text-slate">
        Imagens e vídeos do evento — publicados aqui aparecem na aba &ldquo;Galeria&rdquo; do site.
      </p>

      <div className="mt-6">
        <UploadForms events={events.map((e) => ({ id: e.id, title: e.title }))} />
      </div>

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-brand border border-dashed border-line bg-paper px-6 py-16 text-center">
          <p className="text-sm text-slate">Ainda não há nada na galeria.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <GalleryItemCard key={item.id} item={item} eventTitle={eventTitle.get(item.eventId) ?? item.eventId} />
          ))}
        </div>
      )}
    </div>
  );
}
