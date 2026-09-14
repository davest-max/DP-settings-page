import * as React from "react";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  AgentSettingsDisplayKeyboard,
  type AgentSettingsDisplayKeyboardProps,
} from "../agent-settings-display-keyboard";

const meta: Meta<typeof AgentSettingsDisplayKeyboard> = {
  title: "Templates/AgentSettingsDisplayKeyboard",
  component: AgentSettingsDisplayKeyboard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
  argTypes: {
    locked: { control: "boolean" },
    lockedMessage: { control: "text" },
    onTwentyFourHourTimeChange: { table: { disable: true } },
    onPanelOpenInBrowserGeneralChange: { table: { disable: true } },
    onPanelOpenInBrowserPageActionOnlyChange: { table: { disable: true } },
    onFinalMessageSortOrderChange: { table: { disable: true } },
    onSendWithEnterChange: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof AgentSettingsDisplayKeyboard>;

/** Stateful wrapper — every value/onChange pair is wired to real state, per
 *  CONTRIBUTING.md §12 (no hooks directly inside a `render` function). */
function DisplayKeyboardDemo(
  props: Partial<AgentSettingsDisplayKeyboardProps> & {
    initialGeneral?: boolean;
    initialPageActionOnly?: boolean;
  }
) {
  const [twentyFourHourTime, setTwentyFourHourTime] = useState(true);
  const [panelOpenInBrowserGeneral, setPanelOpenInBrowserGeneral] = useState(
    props.initialGeneral ?? false
  );
  const [panelOpenInBrowserPageActionOnly, setPanelOpenInBrowserPageActionOnly] =
    useState(props.initialPageActionOnly ?? false);
  const [finalMessageSortOrder, setFinalMessageSortOrder] = useState("newest-default");
  const [sendWithEnter, setSendWithEnter] = useState("all-except-email");

  return (
    <AgentSettingsDisplayKeyboard
      {...props}
      twentyFourHourTime={twentyFourHourTime}
      onTwentyFourHourTimeChange={setTwentyFourHourTime}
      panelOpenInBrowserGeneral={panelOpenInBrowserGeneral}
      onPanelOpenInBrowserGeneralChange={setPanelOpenInBrowserGeneral}
      panelOpenInBrowserPageActionOnly={panelOpenInBrowserPageActionOnly}
      onPanelOpenInBrowserPageActionOnlyChange={setPanelOpenInBrowserPageActionOnly}
      finalMessageSortOrder={finalMessageSortOrder}
      onFinalMessageSortOrderChange={setFinalMessageSortOrder}
      sendWithEnter={sendWithEnter}
      onSendWithEnterChange={setSendWithEnter}
    />
  );
}

/** Neither browser-open option enabled yet — the state an admin sees on a
 *  Desktop Profile before opting any app category in. */
export const Default: Story = {
  render: () => <DisplayKeyboardDemo />,
};

/** Both "Panel Open in Browser" options turned on. */
export const BothEnabled: Story = {
  render: () => <DisplayKeyboardDemo initialGeneral initialPageActionOnly />,
};

/** The Desktop Profile administrator has turned off agent editing for this
 *  panel — every control is disabled and explains itself via tooltip. */
export const Locked: Story = {
  render: () => (
    <DisplayKeyboardDemo
      initialGeneral
      locked
      lockedMessage="Setting cannot be edited"
    />
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      <div>
        <p className="lyra-label mb-2 text-lyra-fg-secondary">Default</p>
        <DisplayKeyboardDemo />
      </div>
      <div>
        <p className="lyra-label mb-2 text-lyra-fg-secondary">Both enabled</p>
        <DisplayKeyboardDemo initialGeneral initialPageActionOnly />
      </div>
      <div>
        <p className="lyra-label mb-2 text-lyra-fg-secondary">Locked</p>
        <DisplayKeyboardDemo initialGeneral locked />
      </div>
    </div>
  ),
};
