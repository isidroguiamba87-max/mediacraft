import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

/** Styled native <select>, visually-hidden label kept for a11y/screen readers. */
export function Select({ label, className, id, children, ...props }: SelectProps) {
  const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-xs font-medium text-slate">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            "h-11 w-full appearance-none rounded-brand border border-line bg-paper pr-10 pl-4 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-slate"
        />
      </div>
    </div>
  );
}
