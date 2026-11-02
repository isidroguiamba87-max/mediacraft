import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-red text-white hover:bg-brand-red-deep",
  secondary: "bg-brand-navy text-white hover:bg-brand-navy-2",
  ghost: "bg-transparent text-ink border border-line hover:bg-paper-2",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

/** Shared class builder so non-<button> elements (e.g. the locale-aware
 * `Link` from config/i18n) can look exactly like a Button. */
export function buttonVariants(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonVariants(variant, size, className)} {...props} />
  );
}
