import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Marks a section as backed by real Pulse data vs. this site's interim
 * BFF (see lib/bff) — helps distinguish what migrates once Pulse grows
 * these endpoints. */
export function SourceTag({ source, className }: { source: "pulse" | "bff"; className?: string }) {
  const t = useTranslations("pulse.source");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide",
        source === "pulse" ? "bg-paper-2 text-brand-navy" : "bg-brand-red/10 text-brand-red",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          source === "pulse" ? "bg-brand-navy" : "bg-brand-red",
        )}
      />
      {t(source)}
    </span>
  );
}
