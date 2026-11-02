import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Newspaper,
  Mail,
  MessageCircleQuestion,
  Radio,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SourceTag } from "./SourceTag";
import type { AdminView } from "./ConsoleShell";

const ITEMS: { view: AdminView; icon: typeof LayoutDashboard; source: "pulse" | "bff" }[] = [
  { view: "dashboard", icon: LayoutDashboard, source: "pulse" },
  { view: "events", icon: CalendarDays, source: "pulse" },
  { view: "create", icon: PlusCircle, source: "pulse" },
  { view: "publications", icon: Newspaper, source: "bff" },
  { view: "communications", icon: Mail, source: "pulse" },
  { view: "qa", icon: MessageCircleQuestion, source: "bff" },
  { view: "live", icon: Radio, source: "pulse" },
  { view: "report", icon: BarChart3, source: "pulse" },
];

export function ConsoleNav({
  active,
  onChange,
}: {
  active: AdminView;
  onChange: (view: AdminView) => void;
}) {
  const t = useTranslations("pulse.nav");

  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map(({ view, icon: Icon, source }) => (
        <button
          key={view}
          type="button"
          onClick={() => onChange(view)}
          className={cn(
            "flex items-center gap-3 rounded-brand px-3 py-2.5 text-left text-sm transition-colors",
            active === view
              ? "bg-paper-2 font-semibold text-brand-navy"
              : "text-slate hover:bg-paper-2",
          )}
        >
          <Icon size={16} className="shrink-0 text-brand-red" />
          <span className="flex-1">{t(view)}</span>
          {source === "bff" && <SourceTag source="bff" className="px-1.5 py-0.5" />}
        </button>
      ))}
    </nav>
  );
}
