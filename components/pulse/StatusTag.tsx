import { cn } from "@/lib/utils";

type Tone = "success" | "alert" | "navy" | "neutral" | "red";

const tones: Record<Tone, string> = {
  success: "bg-success/15 text-success",
  alert: "bg-alert/15 text-alert",
  navy: "bg-brand-navy/10 text-brand-navy",
  neutral: "bg-paper-2 text-slate",
  red: "bg-brand-red/10 text-brand-red",
};

export function StatusTag({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
