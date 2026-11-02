import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { PulseRole } from "./ConsoleShell";

const ROLES: PulseRole[] = ["admin", "panelist", "participant", "checkin"];

export function RoleSwitcher({
  role,
  onChange,
}: {
  role: PulseRole;
  onChange: (role: PulseRole) => void;
}) {
  const t = useTranslations("pulse");

  return (
    <div>
      <p className="mb-3 font-mono text-[10px] tracking-wide text-slate uppercase">
        {t("viewAs")}
      </p>
      <div className="flex flex-col gap-1">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={cn(
              "rounded-brand px-3 py-2.5 text-left text-sm transition-colors",
              role === r
                ? "bg-paper-2 font-semibold text-brand-navy"
                : "text-slate hover:bg-paper-2",
            )}
          >
            {t(`roles.${r}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
