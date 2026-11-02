import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getNewsById, listNewsMedia } from "@/lib/supabase/news";
import { getPublicEvents } from "@/lib/pulse/endpoints";
import { NewsForm } from "@/components/admin/news/NewsForm";
import { NewsMediaManager } from "@/components/admin/news/NewsMediaManager";
import { updateNewsAction } from "../actions";

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, media, { events }] = await Promise.all([
    getNewsById(id),
    listNewsMedia(id),
    getPublicEvents({ status: "all" }),
  ]);

  if (!item) notFound();

  const boundAction = updateNewsAction.bind(null, item.id, item.coverUrl);

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/novidades"
        className="inline-flex items-center gap-2 text-sm text-slate hover:text-ink"
      >
        <ArrowLeft size={15} />
        Novidades
      </Link>

      <h1 className="mt-4 font-display text-2xl text-brand-navy">Editar novidade</h1>

      <div className="mt-6">
        <NewsForm events={events.map((e) => ({ id: e.id, title: e.title }))} initial={item} action={boundAction} />
      </div>

      <div className="mt-10 border-t border-line pt-8">
        <NewsMediaManager newsId={item.id} media={media} />
      </div>
    </div>
  );
}
