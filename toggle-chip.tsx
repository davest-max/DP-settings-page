import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../lyra-ui/src";

/**
 * A single selectable pill — the "Directory App" / "Outbound Calling" chip
 * rows on the Create Desktop Profile page. Not (yet) part of lyra-ui: none
 * of its existing components match this exact shape (`Chip` is a
 * non-interactive tag, `FilterChip` is a single dropdown-summary trigger,
 * `ToggleGroup` is one connected segmented control) — this is a row of
 * always-visible, independently-toggleable pills instead. Worth promoting
 * into lyra-ui proper if a second consumer needs the same pattern (per its
 * CONTRIBUTING.md §3, "brand-new primitive" bar).
 */
export interface ToggleChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function ToggleChip({ label, selected, onToggle, disabled }: ToggleChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-lyra-md border px-2 lyra-body-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-1",
        selected
          ? "border-lyra-border-active bg-lyra-bg-active-subtle text-lyra-fg-active-strong hover:bg-lyra-state-hover-active-subtle active:bg-lyra-state-pressed-active-subtle"
          : "border-lyra-border-default bg-lyra-bg-surface-base text-lyra-fg-secondary hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {selected && <Check className="h-3 w-3 flex-shrink-0" strokeWidth={2.5} aria-hidden="true" />}
      {label}
    </button>
  );
}

export interface ToggleChipOption {
  value: string;
  label: string;
}

export interface ToggleChipGroupProps {
  options: ToggleChipOption[];
  values: string[];
  onValuesChange: (values: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function ToggleChipGroup({
  options,
  values,
  onValuesChange,
  disabled,
  className,
}: ToggleChipGroupProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {options.map((opt) => {
        const selected = values.includes(opt.value);
        return (
          <ToggleChip
            key={opt.value}
            label={opt.label}
            selected={selected}
            disabled={disabled}
            onToggle={() =>
              onValuesChange(
                selected ? values.filter((v) => v !== opt.value) : [...values, opt.value]
              )
            }
          />
        );
      })}
    </div>
  );
}
