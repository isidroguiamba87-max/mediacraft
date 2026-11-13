"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/config/i18n";
import { PillDropdown } from "@/components/ui/PillDropdown";

/**
 * "Recentes ⌄" year filter on the events page. Selection lives in the
 * `?ano=` search param so the grid stays server-rendered and shareable.
 */
export function EventYearFilter({ years }: { years: number[] }) {
  const t = useTranslations("events.filters");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("ano", value);
    else params.delete("ano");
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }

  return (
    <PillDropdown
      ariaLabel={t("label")}
      value={searchParams.get("ano") ?? ""}
      onChange={select}
      options={[
        { value: "", label: t("recent") },
        ...years.map((y) => ({ value: String(y), label: String(y) })),
      ]}
    />
  );
}
