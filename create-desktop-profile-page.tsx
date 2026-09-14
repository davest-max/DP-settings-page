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
import {
  LoginVoicePreferencesTab,
  AVNotificationsTab,
  DisplayKeyboardTab,
} from "./settings-page-tile";

/* ── Sample data — matches the "Create Desktop Profile" Figma frame ── */

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

/* AW-64046 — Digital Channels: control whether agents can preview Digital
 * Contacts from the Interactions tab of Search, and whether they can send
 * messages on ones they don't own. Three levels per the capability's
 * high-level overview (no partial/indeterminate state — always exactly one
 * of these). */
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

/* ── Page chrome (AppHeader + AdminShell) ──
 * In a real consuming app this outer chrome is supplied once (see
 * lyra-ui's own AdminShell.stories.tsx `AdminShellDemo`) and shared across
 * every page — reproduced here only so this preview matches the full
 * Figma frame, chrome included. */
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

/* ── A section header bar ("Apps" / "Additional Settings") ── */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="lyra-label rounded-t-lyra-sm border border-b-0 border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-4 py-2 text-lyra-fg-secondary">
      {children}
    </div>
  );
}

/*
 * A label + trailing-control row inside a section. Shared by both the
 * "Apps" switches and the "Additional Settings" fields so every row's
 * control (switch, select, chip group) starts in the exact same column —
 * the label cell is a fixed width and the control cell always begins
 * right after it, regardless of section.
 */
function SettingsFieldRow({
  label,
  children,
  align = "center",
}: {
  label: string;
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
      <span className="w-[220px] flex-shrink-0 text-[14px] font-bold leading-5 text-lyra-fg-default">
        {label}
      </span>
      <div className="flex flex-1 items-center">{children}</div>
    </div>
  );
}

export function CreateDesktopProfilePage() {
  const [tab, setTab] = useState<"settings" | "teams" | "settings-page">("settings");
  const [settingsPageInnerTab, setSettingsPageInnerTab] = useState<
    "login-voice" | "av-notifications" | "display-keyboard"
  >("av-notifications");

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

  const [agentVersion, setAgentVersion] = useState("current");
  const [screenSize, setScreenSize] = useState("full-screen");
  const [directoryApp, setDirectoryApp] = useState<string[]>([
    "search",
    "favorites",
    "agents",
    "teams",
  ]);
  const [outboundCalling, setOutboundCalling] = useState<string[]>([
    "ad-hoc",
    "agent",
    "address-book",
    "skill",
  ]);
  const [closedContactConfirmation, setClosedContactConfirmation] = useState(true);
  const [showCallerPhoneNumber, setShowCallerPhoneNumber] = useState(true);
  const [digitalContactPreview, setDigitalContactPreview] = useState("enabled-with-send");

  /* ── Planned — 27.1 (design direction, not yet spec'd) ──
   * AW-61903, AW-61857, AW-60819 — all still status "New" with functional
   * requirements marked [TBD] in Jira. Defaults below reflect each
   * capability's stated "today's default behavior", not a finalized spec. */
  const [typingIndicators, setTypingIndicators] = useState(true);
  const [quickBarAgentCustomization, setQuickBarAgentCustomization] = useState(true);
  const [screenPopAlwaysStealFocus, setScreenPopAlwaysStealFocus] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-lyra-bg-surface-shell">
      <AppHeader
        appName={<AppName name="Agent Configuration" icon={<CXoneSmiley />} />}
        actions={HEADER_ACTIONS}
        className="border-b border-lyra-border-subtle bg-lyra-bg-surface-base"
      />
      <AdminShell
        storageKeyPrefix="create-desktop-profile-preview"
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
            <Tab active={tab === "settings-page"} onClick={() => setTab("settings-page")}>
              Settings Page
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

            {/* ── Apps ── */}
            <section>
              <SectionHeader>Apps</SectionHeader>
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

            {/* ── Additional Settings ── */}
            <section>
              <SectionHeader>Additional Settings</SectionHeader>
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
                <SettingsFieldRow label="Closed Contact Confirmation">
                  <Switch
                    size="sm"
                    checked={closedContactConfirmation}
                    onCheckedChange={setClosedContactConfirmation}
                    aria-label="Closed Contact Confirmation"
                  />
                </SettingsFieldRow>
                <SettingsFieldRow label="Show Caller Phone Number">
                  <Switch
                    size="sm"
                    checked={showCallerPhoneNumber}
                    onCheckedChange={setShowCallerPhoneNumber}
                    aria-label="Show Caller Phone Number"
                  />
                </SettingsFieldRow>
              </div>
            </section>

            {/* ── (Planned — 27.1) ──
             * Design direction for capabilities not yet built: AW-64046
             * (Digital Contact preview/send), AW-61903 (typing
             * indicators), AW-61857 (Quick Bar / App Space ordering &
             * pinning), AW-60819 (Screen Pop steal-focus). Kept in its
             * own section, separate from Additional Settings, so it
             * reads as forward-looking exploration rather than finished,
             * shipped configuration. */}
            <section>
              <SectionHeader>(Planned — 27.1)</SectionHeader>
              <div className="flex flex-col rounded-b-lyra-sm border border-lyra-border-subtle">
                <SettingsFieldRow label="Digital Contact Preview">
                  <Select
                    options={DIGITAL_CONTACT_PREVIEW_OPTIONS}
                    value={digitalContactPreview}
                    onValueChange={setDigitalContactPreview}
                    className="w-[220px]"
                  />
                </SettingsFieldRow>
                <SettingsFieldRow label="Agent-to-Patron Typing Indicators">
                  <Switch
                    size="sm"
                    checked={typingIndicators}
                    onCheckedChange={setTypingIndicators}
                    aria-label="Agent-to-Patron Typing Indicators"
                  />
                </SettingsFieldRow>
                <SettingsFieldRow label="Allow Agents to Reorder & Pin Quick Bar / App Space">
                  <Switch
                    size="sm"
                    checked={quickBarAgentCustomization}
                    onCheckedChange={setQuickBarAgentCustomization}
                    aria-label="Allow Agents to Reorder & Pin Quick Bar / App Space"
                  />
                </SettingsFieldRow>
                <SettingsFieldRow label="Screen Pops Always Steal Focus">
                  <Switch
                    size="sm"
                    checked={screenPopAlwaysStealFocus}
                    onCheckedChange={setScreenPopAlwaysStealFocus}
                    aria-label="Screen Pops Always Steal Focus"
                  />
                </SettingsFieldRow>
              </div>
            </section>
          </TabPanel>

          <TabPanel active={tab === "teams"} className="px-6 py-6">
            <p className="lyra-body-md text-lyra-fg-secondary">
              Assigned Teams content isn&apos;t part of AW-61850 — placeholder only.
            </p>
          </TabPanel>

          {/* ── Settings Page (AW-35954) ──
           * Admin-facing show/hide + lock control over the agent's own
           * Settings app, mirroring that app's 3 real sub-tabs. Reuses the
           * governance components from settings-page-tile.tsx rather than
           * duplicating them, so the two stay in sync. */}
          <TabPanel active={tab === "settings-page"} className="flex flex-col gap-4 px-6 py-6">
            <p className="lyra-body-md max-w-[720px] text-lyra-fg-secondary">
              AW-35954 — mirrors the real Settings app&apos;s own tabs. Each
              row&apos;s <strong>Agent Access</strong> control is a single
              3-state choice — Hidden, Visible &amp; Editable, or Visible
              &amp; Locked — instead of two separate switches, so there&apos;s
              no way to configure a meaningless state like &quot;hidden but
              editable.&quot; The value control itself (switch, select, or
              slider) is what the admin sets as the enforced default in
              every case.
            </p>
            <TabList>
              <Tab
                active={settingsPageInnerTab === "login-voice"}
                onClick={() => setSettingsPageInnerTab("login-voice")}
              >
                Login & Voice Preferences
              </Tab>
              <Tab
                active={settingsPageInnerTab === "av-notifications"}
                onClick={() => setSettingsPageInnerTab("av-notifications")}
              >
                A/V Notifications
              </Tab>
              <Tab
                active={settingsPageInnerTab === "display-keyboard"}
                onClick={() => setSettingsPageInnerTab("display-keyboard")}
              >
                Display & Keyboard
              </Tab>
            </TabList>
            <TabPanel active={settingsPageInnerTab === "login-voice"}>
              <LoginVoicePreferencesTab />
            </TabPanel>
            <TabPanel active={settingsPageInnerTab === "av-notifications"}>
              <AVNotificationsTab />
            </TabPanel>
            <TabPanel active={settingsPageInnerTab === "display-keyboard"}>
              <DisplayKeyboardTab />
            </TabPanel>
          </TabPanel>
        </div>
      </AdminShell>
    </div>
  );
}
