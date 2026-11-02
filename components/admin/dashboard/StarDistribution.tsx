import { Star } from "lucide-react";
import type { DashboardStats } from "@/lib/supabase/dashboard";

export function StarDistribution({ distribution, total }: { distribution: DashboardStats["starDistribution"]; total: number }) {
  return (
    <div className="flex flex-col gap-2">
      {([5, 4, 3, 2, 1] as const).map((n) => {
        const count = distribution[n];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={n} className="flex items-center gap-2 text-xs">
            <span className="flex w-10 shrink-0 items-center gap-0.5 text-slate">
              {n} <Star size={11} className="fill-current" />
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-2">
              <div className="h-full rounded-full bg-brand-red" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-6 shrink-0 text-right text-slate">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
