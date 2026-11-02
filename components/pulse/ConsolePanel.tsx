import { cn } from "@/lib/utils";

export function ConsolePanel({
  title,
  subtitle,
  className,
  children,
}: {
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-brand border border-line bg-paper p-6", className)}>
      <h3 className="flex items-center gap-2 text-base font-semibold text-ink">{title}</h3>
      {subtitle && <p className="mt-1 font-mono text-xs text-slate">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}
