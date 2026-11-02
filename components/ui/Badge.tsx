import { cn } from "@/lib/utils";

type BadgeTone = "navy" | "red" | "neutral";

const tones: Record<BadgeTone, string> = {
  navy: "bg-brand-navy text-white",
  red: "bg-brand-red text-white",
  neutral: "bg-paper-2 text-slate",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
