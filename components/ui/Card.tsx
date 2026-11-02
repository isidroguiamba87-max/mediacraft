import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-brand border border-line bg-paper shadow-brand",
        className,
      )}
      {...props}
    />
  );
}
