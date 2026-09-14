import * as React from "react";
import { Clock, AppWindow, ListFilter, Send } from "lucide-react";
import { SettingRow } from "./setting-row";
// lyra-ui lives as a sibling folder — imported straight from its source.
import { cn, Switch, Select, type SelectOption, Divider } from "../lyra-ui/src";

/* ── Types ── */

const DEFAULT_FINAL_MESSAGE_SORT_ORDER_OPTIONS: SelectOption[] = [
  { value: "newest-default", label: "Default to newest (default)" },
  { value: "oldest", label: "Default to oldest" },
];

const DEFAULT_SEND_WITH_ENTER_OPTIONS: SelectOption[] = [
  { value: "all-except-email", label: "All channels except email" },
  { value: "all-channels", label: "All channels" },
  { value: "off", label: "Off" },
];

export interface AgentSettingsDisplayKeyboardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /* ── Display: 24 Hour Time ── */
  twentyFourHourTime: boolean;
  onTwentyFourHourTimeChange: (value: boolean) => void;

  /* ── Display: Panel Open in Browser ──
   * These two are independent — a Desktop Profile can allow either, both,
   * or neither app category to pop its panel out into a browser tab. */
  /** Apps configured as "General" may open their panel in a browser tab */
  panelOpenInBrowserGeneral: boolean;
  onPanelOpenInBrowserGeneralChange: (value: boolean) => void;
  /** Apps configured as "Page Action Only" may open their panel in a browser tab */
  panelOpenInBrowserPageActionOnly: boolean;
  onPanelOpenInBrowserPageActionOnlyChange: (value: boolean) => void;

  /* ── Display: Final Message Sort Order ── */
  finalMessageSortOrder: string;
  onFinalMessageSortOrderChange: (value: string) => void;
  /** Override the option list (defaults to Newest/Oldest) */
  finalMessageSortOrderOptions?: SelectOption[];

  /* ── Keyboard: Send with Enter ── */
  sendWithEnter: string;
  onSendWithEnterChange: (value: string) => void;
  /** Override the option list */
  sendWithEnterOptions?: SelectOption[];

  /**
   * The Desktop Profile administrator has turned off agent editing for
   * this whole panel — every control renders disabled with a "Setting
   * cannot be edited" tooltip instead of being individually locked.
   * (Per-row admin lock isn't modeled yet; see the component's own
   * doc comment for why.)
   */
  locked?: boolean;
  /** Overrides the tooltip text shown on a locked control (default: "Setting cannot be edited") */
  lockedMessage?: string;
}

/* ── Component ──
 *
 * The agent-facing "Display & Keyboard" tab of the Settings panel
 * (Agent Workspace → Settings). Built from AW-61850's "Panel Open in
 * Browser" setting: two independent switches let the agent choose whether
 * "General" apps and/or "Page Action Only" apps may pop their panel out
 * into a full browser tab, alongside the existing 24-hour-time and
 * message-order/keyboard settings on the same tab.
 *
 * Fully controlled, per CONTRIBUTING.md §4 — this component owns no
 * internal state for any setting's value; the caller wires every
 * value/onChange pair to its own Desktop Profile / agent-preferences state.
 */
const AgentSettingsDisplayKeyboard = React.forwardRef<
  HTMLDivElement,
  AgentSettingsDisplayKeyboardProps
>(
  (
    {
      className,
      twentyFourHourTime,
      onTwentyFourHourTimeChange,
      panelOpenInBrowserGeneral,
      onPanelOpenInBrowserGeneralChange,
      panelOpenInBrowserPageActionOnly,
      onPanelOpenInBrowserPageActionOnlyChange,
      finalMessageSortOrder,
      onFinalMessageSortOrderChange,
      finalMessageSortOrderOptions = DEFAULT_FINAL_MESSAGE_SORT_ORDER_OPTIONS,
      sendWithEnter,
      onSendWithEnterChange,
      sendWithEnterOptions = DEFAULT_SEND_WITH_ENTER_OPTIONS,
      locked = false,
      lockedMessage = "Setting cannot be edited",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-[680px] rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base p-6",
          className
        )}
        {...props}
      >
        {/* ── Display ── */}
        <section aria-labelledby="display-section-title">
          <h3 id="display-section-title" className="lyra-label text-lyra-fg-default">
            Display
          </h3>
          <div className="mt-2 flex flex-col divide-y divide-lyra-border-subtle">
            <SettingRow
              icon={Clock}
              label="24 Hour Time"
              disabled={locked}
              disabledMessage={lockedMessage}
              control={
                <Switch
                  checked={twentyFourHourTime}
                  onCheckedChange={onTwentyFourHourTimeChange}
                  disabled={locked}
                  aria-label="24 Hour Time"
                />
              }
            />
            <SettingRow
              icon={AppWindow}
              label="Panel Open in Browser: General"
              disabled={locked}
              disabledMessage={lockedMessage}
              control={
                <Switch
                  checked={panelOpenInBrowserGeneral}
                  onCheckedChange={onPanelOpenInBrowserGeneralChange}
                  disabled={locked}
                  aria-label="Panel Open in Browser: General"
                />
              }
            />
            <SettingRow
              icon={AppWindow}
              label="Panel Open in Browser: Page Action Only"
              disabled={locked}
              disabledMessage={lockedMessage}
              control={
                <Switch
                  checked={panelOpenInBrowserPageActionOnly}
                  onCheckedChange={onPanelOpenInBrowserPageActionOnlyChange}
                  disabled={locked}
                  aria-label="Panel Open in Browser: Page Action Only"
                />
              }
            />
            <SettingRow
              icon={ListFilter}
              label="Final Message Sort Order"
              disabled={locked}
              disabledMessage={lockedMessage}
              control={
                <Select
                  options={finalMessageSortOrderOptions}
                  value={finalMessageSortOrder}
                  onValueChange={onFinalMessageSortOrderChange}
                  disabled={locked}
                  className="w-[223px]"
                />
              }
            />
          </div>
        </section>

        <Divider className="my-6" />

        {/* ── Keyboard ── */}
        <section aria-labelledby="keyboard-section-title">
          <h3 id="keyboard-section-title" className="lyra-label text-lyra-fg-default">
            Keyboard
          </h3>
          <div className="mt-2 flex flex-col divide-y divide-lyra-border-subtle">
            <SettingRow
              icon={Send}
              label="Send with Enter"
              disabled={locked}
              disabledMessage={lockedMessage}
              control={
                <Select
                  options={sendWithEnterOptions}
                  value={sendWithEnter}
                  onValueChange={onSendWithEnterChange}
                  disabled={locked}
                  className="w-[218px]"
                />
              }
            />
          </div>
        </section>
      </div>
    );
  }
);
AgentSettingsDisplayKeyboard.displayName = "AgentSettingsDisplayKeyboard";

export { AgentSettingsDisplayKeyboard };
export type { SelectOption };
