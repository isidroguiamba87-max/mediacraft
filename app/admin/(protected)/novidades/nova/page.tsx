import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPublicEvents } from "@/lib/pulse/endpoints";
import { NewsForm } from "@/components/admin/news/NewsForm";
import { createNewsAction } from "../actions";

export default async function NewNewsPage() {
  const { events } = await getPublicEvents({ status: "all" });

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/novidades"
        className="inline-flex items-center gap-2 text-sm text-slate hover:text-ink"
      >
        <ArrowLeft size={15} />
        Novidades
      </Link>

      <h1 className="mt-4 font-display text-2xl text-brand-navy">Nova novidade</h1>
      <p className="mt-1 text-sm text-slate">
        Depois de guardar, és levado para a página de edição, onde podes juntar fotos extra e vídeo.
      </p>

      <div className="mt-6">
        <NewsForm events={events.map((e) => ({ id: e.id, title: e.title }))} action={createNewsAction} />
      </div>
    </div>
  );
}
