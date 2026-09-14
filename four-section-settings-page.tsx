import * as React from "react";
import { useState } from "react";
import { CircleHelp, LayoutGrid, Bell, Box } from "lucide-react";
import {
  cn,
  AppHeader,
  AppName,
  AdminShell,
  Button,
  Input,
  TabList,
  Tab,
  TabPanel,
  Switch,
  Select,
  ActionIconButton,
  ProfileMenu,
  CXoneSmiley,
  defaultProfileMenuGroups,
  type SelectOption,
  type TreeMenuItem,
} from "../lyra-ui/src";
import { ToggleChipGroup, type ToggleChipOption } from "./toggle-chip";

/**
 * Exploration of the "four sections" idea: instead of one flat "Additional
 * Settings" bucket (plus a separate "(Planned — 27.1)" section), every
 * setting on this page is re-sorted by what KIND of setting it is —
 * Apps (show/hide), Additional Visibility, Behavior, Agent Permissions —
 * so a row's meaning is legible from which section it's in, not just its
 * label. Rows carried over from "(Planned — 27.1)" keep a small "27.1" tag
 * so their not-yet-built status stays visible even after being sorted into
 * a type-based section rather than a status-based one. This is a
 * standalone comparison page — it doesn't replace create-desktop-profile-page.tsx.
 */

const NAV_ITEMS: TreeMenuItem[] = [
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "Desktop Profiles", active: true },
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "ACS Onboarding" },
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "CRM Integrations" },
];

const AGENT_VERSION_OPTIONS: SelectOption[] = [
  { value: "current", label: "Current" },
  { value: "previous", label: "Previous" },
];
const SCREEN_SIZE_OPTIONS: SelectOption[] = [
  { value: "full-screen", label: "Full Screen" },
  { value: "windowed", label: "Windowed" },
];
const DIGITAL_CONTACT_PREVIEW_OPTIONS: SelectOption[] = [
  { value: "enabled-with-send", label: "Enabled with Send" },
  { value: "enabled-without-send", label: "Enabled without Send" },
  { value: "disabled", label: "Disabled" },
];
const DIRECTORY_APP_OPTIONS: ToggleChipOption[] = [
  { value: "search", label: "Search" },
  { value: "all", label: "All" },
  { value: "favorites", label: "Favorites" },
  { value: "agents", label: "Agents" },
  { value: "teams", label: "Teams" },
  { value: "standard-address-books", label: "Standard Address Books" },
];
const OUTBOUND_CALLING_OPTIONS: ToggleChipOption[] = [
  { value: "ad-hoc", label: "Ad Hoc" },
  { value: "redial", label: "Redial" },
  { value: "agent", label: "Agent" },
  { value: "address-book", label: "Address Book" },
  { value: "skill", label: "Skill" },
  { value: "elevation", label: "Elevation" },
  { value: "save-and-redial", label: "Save & Redial" },
  { value: "transfer", label: "Transfer" },
];

interface AppToggleDef {
  key: string;
  label: string;
}
const APPS: AppToggleDef[] = [
  { key: "search", label: "Search" },
  { key: "contact-history", label: "Contact History" },
  { key: "queue-counter", label: "Queue Counter" },
  { key: "schedule", label: "Schedule" },
  { key: "wem", label: "WEM" },
  { key: "launch", label: "Launch" },
  { key: "custom-workspace", label: "Custom Workspace" },
  { key: "reporting", label: "Reporting" },
];

const HEADER_ACTIONS = (
  <>
    <ActionIconButton size="xl" title="Help">
      <CircleHelp className="h-5 w-5" strokeWidth={1.5} />
    </ActionIconButton>
    <ActionIconButton size="xl" title="Apps">
      <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />
    </ActionIconButton>
    <ActionIconButton size="xl" title="Notifications" badge={5}>
      <Bell className="h-5 w-5" strokeWidth={1.5} />
    </ActionIconButton>
    <ProfileMenu initials="JS" avatarColor="#5d6a79" groups={defaultProfileMenuGroups} className="ml-1" />
  </>
);

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="lyra-label rounded-t-lyra-sm border border-b-0 border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-4 py-2 text-lyra-fg-secondary">
      {children}
    </div>
  );
}

/* ── Small provenance tag for rows carried over from "(Planned — 27.1)" —
 * keeps that signal even once sorted by type instead of by status. ── */
function PlannedTag() {
  return (
    <span className="lyra-body-xs rounded-lyra-sm border border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-1.5 py-0.5 text-lyra-fg-secondary">
      27.1
    </span>
  );
}

function SettingsFieldRow({
  label,
  planned = false,
  children,
  align = "center",
}: {
  label: string;
  planned?: boolean;
  children: React.ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "flex gap-6 border-t border-lyra-border-subtle px-4 py-3 first:border-t-0",
        align === "center" ? "items-center" : "items-start"
      )}
    >
      <span className="flex w-[260px] flex-shrink-0 items-center gap-1.5 text-[14px] font-bold leading-5 text-lyra-fg-default">
        {label}
        {planned && <PlannedTag />}
      </span>
      <div className="flex flex-1 items-center">{children}</div>
    </div>
  );
}

export function FourSectionSettingsPage() {
  const [tab, setTab] = useState<"settings" | "teams">("settings");

  const [profileName, setProfileName] = useState("");
  const [description, setDescription] = useState("");

  const [apps, setApps] = useState<Record<string, boolean>>({
    search: true,
    "contact-history": true,
    "queue-counter": true,
    schedule: true,
    wem: false,
    launch: true,
    "custom-workspace": false,
    reporting: true,
  });

  // Additional Visibility
  const [showCallerPhoneNumber, setShowCallerPhoneNumber] = useState(true);
  const [directoryApp, setDirectoryApp] = useState<string[]>(["search", "favorites", "agents", "teams"]);
  const [outboundCalling, setOutboundCalling] = useState<string[]>(["ad-hoc", "agent", "address-book", "skill"]);

  // Behavior
  const [agentVersion, setAgentVersion] = useState("current");
  const [screenSize, setScreenSize] = useState("full-screen");
  const [closedContactConfirmation, setClosedContactConfirmation] = useState(true);
  const [digitalContactPreview, setDigitalContactPreview] = useState("enabled-with-send");
  const [typingIndicators, setTypingIndicators] = useState(true);
  const [screenPopAlwaysStealFocus, setScreenPopAlwaysStealFocus] = useState(false);

  // Agent Permissions
  const [quickBarAgentCustomization, setQuickBarAgentCustomization] = useState(true);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-lyra-bg-surface-shell">
      <AppHeader
        appName={<AppName name="Agent Configuration" icon={<CXoneSmiley />} />}
        actions={HEADER_ACTIONS}
        className="border-b border-lyra-border-subtle bg-lyra-bg-surface-base"
      />
      <AdminShell
        storageKeyPrefix="four-section-settings-preview"
        navTitle="Agent Configuration"
        navItems={NAV_ITEMS}
        defaultLeftPinned
        showPageHeader
        pageTitle="Create Desktop Profile"
        pageActions={
          <>
            <Button variant="outline">Cancel</Button>
            <Button>Create</Button>
          </>
        }
      >
        <div className="flex flex-1 flex-col overflow-y-auto">
          <TabList className="px-6">
            <Tab active={tab === "settings"} onClick={() => setTab("settings")}>
              Settings
            </Tab>
            <Tab active={tab === "teams"} onClick={() => setTab("teams")}>
              Assigned Teams
            </Tab>
          </TabList>

          <TabPanel active={tab === "settings"} className="flex flex-col gap-6 px-6 py-6">
            <div className="flex gap-6">
              <Input
                label="Desktop Profile Name"
                placeholder="Text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-[280px]"
              />
              <Input
                label="Description"
                placeholder="Text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-[420px]"
              />
            </div>

            {/* ── 1. Apps (show/hide) — unchanged from the current page ── */}
            <section>
              <SectionHeader>Apps (show/hide)</SectionHeader>
              <div className="flex flex-col rounded-b-lyra-sm border border-lyra-border-subtle">
                {APPS.map((app) => (
                  <SettingsFieldRow key={app.key} label={app.label}>
                    <Switch
                      size="sm"
                      checked={apps[app.key]}
                      onCheckedChange={(v) => setApps((prev) => ({ ...prev, [app.key]: v }))}
                      aria-label={app.label}
                    />
                  </SettingsFieldRow>
                ))}
              </div>
            </section>

            {/* ── 2. Additional Visibility — what information or options
             * are shown to the agent, beyond whole-app show/hide. ── */}
            <section>
              <SectionHeader>Additional Visibility</SectionHeader>
              <div className="flex flex-col rounded-b-lyra-sm border border-lyra-border-subtle">
                <SettingsFieldRow label="Show Caller Phone Number">
                  <Switch
                    size="sm"
                    checked={showCallerPhoneNumber}
                    onCheckedChange={setShowCallerPhoneNumber}
                    aria-label="Show Caller Phone Number"
                  />
                </SettingsFieldRow>
                <SettingsFieldRow label="Directory App" align="start">
                  <ToggleChipGroup
                    options={DIRECTORY_APP_OPTIONS}
                    values={directoryApp}
                    onValuesChange={setDirectoryApp}
                  />
                </SettingsFieldRow>
                <SettingsFieldRow label="Outbound Calling" align="start">
                  <ToggleChipGroup
                    options={OUTBOUND_CALLING_OPTIONS}
                    values={outboundCalling}
                    onValuesChange={setOutboundCalling}
                  />
                </SettingsFieldRow>
              </div>
            </section>

            {/* ── 3. Behavior — which of two (or more) mechanisms the
             * system uses, not presence/absence of something. ── */}
            <section>
              <SectionHeader>Behavior</SectionHeader>
              <div className="flex flex-col rounded-b-lyra-sm border border-lyra-border-subtle">
                <SettingsFieldRow label="Agent Version">
                  <Select
                    options={AGENT_VERSION_OPTIONS}
                    value={agentVersion}
                    onValueChange={setAgentVersion}
                    className="w-[220px]"
                  />
                </SettingsFieldRow>
                <SettingsFieldRow label="Default Screen Size">
                  <Select
                    options={SCREEN_SIZE_OPTIONS}
                    value={screenSize}
                    onValueChange={setScreenSize}
                    className="w-[220px]"
                  />
                </SettingsFieldRow>
                <SettingsFieldRow label="Closed Contact Confirmation">
                  <Switch
                    size="sm"
                    checked={closedContactConfirmation}
                    onCheckedChange={setClosedContactConfirmation}
                    aria-label="Closed Contact Confirmation"
                  />
                </SettingsFieldRow>
                <SettingsFieldRow label="Digital Contact Preview" planned>
                  <Select
                    options={DIGITAL_CONTACT_PREVIEW_OPTIONS}
                    value={digitalContactPreview}
                    onValueChange={setDigitalContactPreview}
                    className="w-[220px]"
                  />
                </SettingsFieldRow>
                <SettingsFieldRow label="Agent-to-Patron Typing Indicators" planned>
                  <Switch
                    size="sm"
                    checked={typingIndicators}
                    onCheckedChange={setTypingIndicators}
                    aria-label="Agent-to-Patron Typing Indicators"
                  />
                </SettingsFieldRow>
                <SettingsFieldRow label="Screen Pops Always Steal Focus" planned>
                  <Switch
                    size="sm"
                    checked={screenPopAlwaysStealFocus}
                    onCheckedChange={setScreenPopAlwaysStealFocus}
                    aria-label="Screen Pops Always Steal Focus"
                  />
                </SettingsFieldRow>
              </div>
            </section>

            {/* ── 4. Agent Permissions — admin controls whether AGENTS can
             * act, not what agents see or how the system behaves. Thin
             * today (one row), built to grow — this is also where a
             * future summary/link into the AW-35954 Settings Page tile's
             * per-setting "Locked" controls could reasonably live. ── */}
            <section>
              <SectionHeader>Agent Permissions</SectionHeader>
              <div className="flex flex-col rounded-b-lyra-sm border border-lyra-border-subtle">
                <SettingsFieldRow label="Allow Agents to Reorder & Pin Quick Bar / App Space" planned>
                  <Switch
                    size="sm"
                    checked={quickBarAgentCustomization}
                    onCheckedChange={setQuickBarAgentCustomization}
                    aria-label="Allow Agents to Reorder & Pin Quick Bar / App Space"
                  />
                </SettingsFieldRow>
              </div>
            </section>
          </TabPanel>

          <TabPanel active={tab === "teams"} className="px-6 py-6">
            <p className="lyra-body-md text-lyra-fg-secondary">
              Assigned Teams content isn&apos;t part of this exploration —
              placeholder only.
            </p>
          </TabPanel>
        </div>
      </AdminShell>
    </div>
  );
}
