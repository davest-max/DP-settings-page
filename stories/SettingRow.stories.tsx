import * as React from "react";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Clock, AppWindow, ListFilter } from "lucide-react";
import { SettingRow } from "../setting-row";
import { Switch, Select } from "../../lyra-ui/src";

const meta: Meta<typeof SettingRow> = {
  title: "Atoms/SettingRow",
  component: SettingRow,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
  argTypes: {
    icon: { table: { disable: true } },
    label: { control: "text" },
    control: { table: { disable: true } },
    disabled: { control: "boolean" },
    disabledMessage: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof SettingRow>;

function SwitchRowDemo(props: {
  label: string;
  icon?: typeof AppWindow;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const [checked, setChecked] = useState(true);
  return (
    <SettingRow
      icon={props.icon ?? AppWindow}
      label={props.label}
      disabled={props.disabled}
      disabledMessage={props.disabledMessage}
      control={
        <Switch
          checked={checked}
          onCheckedChange={setChecked}
          disabled={props.disabled}
          aria-label={props.label}
        />
      }
    />
  );
}

export const Default: Story = {
  render: () => (
    <div className="max-w-[520px] divide-y divide-lyra-border-subtle">
      <SwitchRowDemo label="Panel Open in Browser: General" />
    </div>
  ),
};

export const Locked: Story = {
  render: () => (
    <div className="max-w-[520px] divide-y divide-lyra-border-subtle">
      <SwitchRowDemo
        label="Panel Open in Browser: General"
        disabled
        disabledMessage="Setting cannot be edited"
      />
    </div>
  ),
};

function SelectRowDemo() {
  const [value, setValue] = useState("newest-default");
  return (
    <SettingRow
      icon={ListFilter}
      label="Final Message Sort Order"
      control={
        <Select
          options={[
            { value: "newest-default", label: "Default to newest (default)" },
            { value: "oldest", label: "Default to oldest" },
          ]}
          value={value}
          onValueChange={setValue}
          className="w-[223px]"
        />
      }
    />
  );
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex max-w-[520px] flex-col divide-y divide-lyra-border-subtle">
      <SwitchRowDemo label="24 Hour Time" icon={Clock} />
      <SwitchRowDemo label="Panel Open in Browser: General" />
      <SwitchRowDemo
        label="Panel Open in Browser: Page Action Only"
        disabled
        disabledMessage="Setting cannot be edited"
      />
      <SelectRowDemo />
    </div>
  ),
};
