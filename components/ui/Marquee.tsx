import { cn } from "@/lib/utils";

/** Infinite horizontal scroller — duplicates children once so the loop is
 * seamless, pauses on hover, and disables itself under
 * prefers-reduced-motion (see .marquee-track in app/globals.css). */
export function Marquee({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("marquee overflow-hidden", className)}>
      <div className="marquee-track flex w-max items-center gap-6 sm:gap-10 lg:gap-12">
        <div className="flex items-center gap-6 sm:gap-10 lg:gap-12">{children}</div>
        <div className="flex items-center gap-6 sm:gap-10 lg:gap-12" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
