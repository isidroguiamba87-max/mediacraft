import { cn } from "@/lib/utils";

interface SectionHeadProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

/** Consistent eyebrow + title + subtitle header, used at the top of most
 * home/about sections. */
export function SectionHead({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
}: SectionHeadProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-brand-red uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl leading-tight text-brand-navy sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-base text-slate">{subtitle}</p>}
    </div>
  );
}
