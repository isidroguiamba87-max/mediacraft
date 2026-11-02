"use client";

import { useRouter, useSearchParams } from "next/navigation";

/** Session filter for the Avaliação admin page's "recent ratings" list —
 * same URL-synced pattern as NetworkingFilters, scoped down to just the
 * one field this page needs (2026-10-14: per-panel ratings now exist, so
 * the list needs a way to narrow to one panel). */
export function RatingSessionFilter({
  eventId,
  sessions,
}: {
  eventId: string;
  sessions: { key: string; title: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("eventId", eventId);
    if (value) params.set("sessionId", value);
    else params.delete("sessionId");
    router.push(`/admin/avaliacao?${params.toString()}`);
  }

  if (sessions.length === 0) return null;

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate">Painel</label>
      <select
        value={searchParams.get("sessionId") ?? ""}
        onChange={(e) => updateParam(e.target.value)}
        className="h-10 rounded-brand border border-line bg-paper px-3 text-sm outline-none focus-visible:border-brand-red sm:w-64"
      >
        <option value="">Todas as avaliações</option>
        <option value="__event__">Avaliação geral do evento</option>
        {sessions.map((s) => (
          <option key={s.key} value={s.key}>
            {s.title}
          </option>
        ))}
      </select>
    </div>
  );
}
