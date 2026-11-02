"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/config/i18n";
import { Select } from "@/components/ui/Select";

/**
 * Period filter, driven by a URL search param so results stay
 * server-rendered and the filtered view is shareable. There used to be a
 * category filter too, but Pulse's event list payload has no category
 * field to filter by (confirmed 2026-09-14) — dropped until/unless
 * backend adds one.
 */
export function EventFilters() {
  const t = useTranslations("events.filters");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const period = searchParams.get("period") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
      <Select
        label={t("period")}
        value={period}
        onChange={(e) => updateParam("period", e.target.value)}
        className="sm:w-56"
      >
        <option value="">{t("periodAll")}</option>
        <option value="upcoming">{t("periodUpcoming")}</option>
        <option value="past">{t("periodPast")}</option>
      </Select>
    </div>
  );
}
