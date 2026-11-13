"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PillDropdownOption {
  value: string;
  label: string;
}

/**
 * Red pill button ("Recentes ⌄", "Todos os dias ⌄") that opens a white,
 * shadowed popover of radio options floating over the content below.
 * Closes on selection, outside click or Escape.
 */
export function PillDropdown({
  options,
  value,
  onChange,
  ariaLabel,
  align = "right",
  size = "lg",
}: {
  options: PillDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  align?: "left" | "right";
  size?: "md" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const currentLabel = options.find((o) => o.value === value)?.label ?? options[0]?.label;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-brand-red font-body font-bold text-white transition-colors hover:bg-brand-red/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red",
          size === "lg" ? "min-w-[8.5rem] gap-2 px-5 py-1.5 text-sm" : "gap-2 px-4 py-1.5 text-sm",
        )}
      >
        {currentLabel}
        <ChevronDown
          aria-hidden
          className={cn(
            "transition-transform duration-200",
            "h-4 w-4",
            open && "rotate-180",
          )}
          strokeWidth={3}
        />
      </button>

      {open && (
        <div
          id={listId}
          role="radiogroup"
          aria-label={ariaLabel}
          className={cn(
            "absolute top-[calc(100%+0.5rem)] z-30 w-[11rem] rounded-2xl bg-white px-4 py-3 shadow-[0_6px_18px_rgba(0,0,0,0.35)]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {options.map((o) => {
            const checked = o.value === value;
            return (
              <button
                key={o.value || "__all"}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 py-1 text-left font-body text-sm text-brand-navy hover:text-brand-red focus-visible:text-brand-red focus-visible:outline-none"
              >
                <span className="truncate">{o.label}</span>
                <span
                  aria-hidden
                  className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border border-brand-navy"
                >
                  {checked && <span className="h-2 w-2 rounded-full bg-brand-navy" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
