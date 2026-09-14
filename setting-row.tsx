import * as React from "react";
import type { LucideIcon } from "lucide-react";
// lyra-ui lives as a sibling folder — imported straight from its source
// rather than the built package, since this component isn't (yet) part of
// the lyra-ui library itself.
import { cn, Icon, Tooltip } from "../lyra-ui/src";

/* ── Types ── */

export interface SettingRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lucide icon rendered in the row's leading icon slot */
  icon: LucideIcon;
  /** Row label */
  label: React.ReactNode;
  /** Trailing control — a `Switch`, `Select`, or any other input */
  control: React.ReactNode;
  /**
   * Renders the row in its locked/read-only state: label and icon dim to
   * the disabled tokens and `control` is wrapped so a tooltip can explain
   * why (see `disabledMessage`). The control itself must still be given
   * its own `disabled` prop by the caller — this only affects the row's
   * chrome, it can't reach into an arbitrary `control` node to disable it.
   */
  disabled?: boolean;
  /**
   * Tooltip shown on hover over the control when `disabled` is true (e.g.
   * "Setting cannot be edited" for a Desktop Profile–locked setting).
   * Ignored when `disabled` is false.
   */
  disabledMessage?: string;
}

/* ── Component ── */

const SettingRow = React.forwardRef<HTMLDivElement, SettingRowProps>(
  ({ className, icon, label, control, disabled, disabledMessage, ...props }, ref) => {
    const controlNode =
      disabled && disabledMessage ? (
        <Tooltip content={disabledMessage} placement="top">
          {/* span wrapper: Tooltip clones its trigger, and `control` itself
             may not always forward a ref (e.g. a bare Select trigger) */}
          <span tabIndex={-1} className="inline-flex">
            {control}
          </span>
        </Tooltip>
      ) : (
        control
      );

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between gap-6 py-3",
          className
        )}
        {...props}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Icon
            icon={icon}
            size="lg"
            color={disabled ? "disabled" : "secondary"}
            decorative
          />
          <span
            className={cn(
              "lyra-body-md truncate",
              disabled ? "text-lyra-fg-disabled" : "text-lyra-fg-default"
            )}
          >
            {label}
          </span>
        </div>
        <div className="shrink-0">{controlNode}</div>
      </div>
    );
  }
);
SettingRow.displayName = "SettingRow";

export { SettingRow };
