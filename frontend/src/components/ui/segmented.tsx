"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

/**
 * Single-select control used for format / quality / cover mode. Implemented as
 * a real radiogroup with roving arrow-key focus rather than a row of buttons.
 */
function Segmented<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  disabled?: boolean;
  label: string;
  className?: string;
}) {
  const move = (direction: 1 | -1) => {
    const index = options.findIndex((option) => option.value === value);
    const next = options[(index + direction + options.length) % options.length];
    if (next) onChange(next.value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          move(1);
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          move(-1);
        }
      }}
      className={cn(
        "bg-surface border-line grid auto-cols-fr grid-flow-col gap-0.5 rounded-md border p-0.5",
        disabled && "pointer-events-none opacity-45",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            tabIndex={selected && !disabled ? 0 : -1}
            title={option.hint}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-sm px-2 py-1.5 text-[12px] font-medium transition-colors duration-150 ease-out",
              selected
                ? "bg-canvas text-ink shadow-float"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export { Segmented };
