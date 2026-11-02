"use client";

import { useRouter } from "next/navigation";

export function EventPicker({
  events,
  selectedEventId,
  basePath,
  allLabel,
}: {
  events: { id: string; title: string }[];
  selectedEventId: string | undefined;
  basePath: string;
  /** When given, the empty option is selectable (not just a disabled
   * placeholder) and represents "every event" rather than "pick one". */
  allLabel?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedEventId ?? ""}
      onChange={(e) => router.push(e.target.value ? `${basePath}?eventId=${e.target.value}` : basePath)}
      className="h-11 w-full max-w-sm rounded-brand border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red"
    >
      <option value="" disabled={!allLabel}>
        {allLabel ?? "Escolhe o evento…"}
      </option>
      {events.map((e) => (
        <option key={e.id} value={e.id}>
          {e.title}
        </option>
      ))}
    </select>
  );
}
