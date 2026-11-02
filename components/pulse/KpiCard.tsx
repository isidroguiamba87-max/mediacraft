import { cn } from "@/lib/utils";

export function KpiCard({
  value,
  label,
  trend,
  trendTone = "success",
}: {
  value: React.ReactNode;
  label: string;
  trend?: string;
  trendTone?: "success" | "alert";
}) {
  return (
    <div className="rounded-brand border border-line bg-paper p-5">
      <p className="font-display text-3xl text-brand-navy">{value}</p>
      <p className="mt-1.5 font-mono text-xs text-slate">{label}</p>
      {trend && (
        <p
          className={cn(
            "mt-2 font-mono text-[11px]",
            trendTone === "success" ? "text-success" : "text-alert",
          )}
        >
          {trend}
        </p>
      )}
    </div>
  );
}
