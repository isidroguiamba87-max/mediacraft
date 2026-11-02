"use client";

import { useRouter, useSearchParams } from "next/navigation";

/** Session + date-range filters, synced to the URL's query params
 * (2026-10-12 spec: "filtro por sessão e por intervalo de datas
 * (sincronizado com os query params do URL)") — the mock data underneath
 * doesn't actually change with these yet (see lib/networking/endpoints.ts),
 * but the real endpoint will read them the moment it exists, no UI change
 * needed. */
export function NetworkingFilters({ sessions }: { sessions: { key: string; title: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/networking?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {sessions.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate">Sessão</label>
          <select
            value={searchParams.get("sessionId") ?? ""}
            onChange={(e) => updateParam("sessionId", e.target.value)}
            className="h-10 rounded-brand border border-line bg-paper px-3 text-sm outline-none focus-visible:border-brand-red sm:w-56"
          >
            <option value="">Todas as sessões</option>
            {sessions.map((s) => (
              <option key={s.key} value={s.key}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate">De</label>
        <input
          type="date"
          value={searchParams.get("from") ?? ""}
          onChange={(e) => updateParam("from", e.target.value)}
          className="h-10 rounded-brand border border-line bg-paper px-3 text-sm outline-none focus-visible:border-brand-red"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate">Até</label>
        <input
          type="date"
          value={searchParams.get("to") ?? ""}
          onChange={(e) => updateParam("to", e.target.value)}
          className="h-10 rounded-brand border border-line bg-paper px-3 text-sm outline-none focus-visible:border-brand-red"
        />
      </div>
    </div>
  );
}
