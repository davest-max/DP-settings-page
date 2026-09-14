import * as React from "react";
import { useState } from "react";
import { CircleHelp, LayoutGrid, Bell, Box, Eye, EyeOff, Lock } from "lucide-react";
import {
  cn,
  AppHeader,
  AppName,
  AdminShell,
  Button,
  TabList,
  Tab,
  TabPanel,
  Switch,
  Select,
  Slider,
  ActionIconButton,
  ProfileMenu,
  CXoneSmiley,
  defaultProfileMenuGroups,
  type SelectOption,
  type TreeMenuItem,
} from "../lyra-ui/src";

/**
 * AW-35954 exploration — "Settings Page" tile.
 *
 * DWP wants admins to be able to (1) show/hide entire tabs and setting
 * areas in the agent's own Settings app, and (2) lock individual settings
 * from agent editing, down to things as granular as volume. The ticket's
 * own stated standard (from the H&R Block ask) is: still SHOW the setting,
 * just lock it from editing — never silently remove it. That means every
 * row here needs an admin governance control on top of the setting's own
 * value — not just one control doing double duty.
 *
 * The real Settings app (cxagent.nicecxone.com) has 6 tabs; only 3 are
 * actual agent-configurable preferences — Login & Voice Preferences,
 * A/V Notifications, Display & Keyboard. Information, Agent Skills, and
 * Report Issue are read-only diagnostics / an assigned-skills list / a
 * support form, so they're out of scope here. This mock mirrors those 3
 * real tabs as sub-navigation *inside* a new "Settings Page" tab, rather
 * than flattening ~21 settings into one list.
 *
 * Governance model — REVISED from an earlier two-switch version (separate
 * Visible / Can Edit switches) after two problems surfaced in review:
 * (1) Visible and Can Edit aren't actually independent — if a setting is
 * hidden, whether it's "editable" is meaningless, so two switches implied
 * a 4th, invalid state (hidden-but-editable) that can't mean anything.
 * (2) A plain on/off switch for governance sitting right next to the
 * row's own Default Value switch was visually indistinguishable from it —
 * an admin had to keep re-reading the column header to remember which
 * switch meant "the setting's value" vs. "does the agent see this at
 * all." Collapsing to one 3-state control (Hidden / Visible — Agent Can
 * Edit / Visible — Locked) fixes both: only real states are selectable,
 * and a Select reads nothing like the value control's Switch.
 *
 * Design decision, made explicit rather than silently assumed: the row's
 * own value control (Switch / Select / Slider) IS the enforced value when
 * governance is "locked" — there's no separate "enforced value" widget.
 * On this admin screen the value control stays interactive regardless of
 * governance state, since an admin may want to pre-set a default even for
 * a setting they're hiding. What governance controls is agent behavior at
 * *runtime*, not anything on this config screen.
 *
 * Jabra Call Control's real UI is a device-pairing flow (Add Devices,
 * Selected Devices) that only makes sense with physical hardware present —
 * simplified here to a single feature-level governance row rather than
 * reproducing that pairing UI in an admin context.
 */

/* ── Shared page chrome — same pattern as create-desktop-profile-page.tsx:
 * reproduced locally rather than imported so this preview stays
 * self-contained (see that file's own note on this). ── */
const NAV_ITEMS: TreeMenuItem[] = [
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "Desktop Profiles", active: true },
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "ACS Onboarding" },
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "CRM Integrations" },
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

/* ── Option groups for the Select-based rows ── */
const RINGTONE_OPTIONS: SelectOption[] = [
  { value: "ring-1", label: "Ring 1" },
  { value: "ring-2", label: "Ring 2" },
  { value: "ring-3", label: "Ring 3" },
  { value: "ring-4", label: "Ring 4" },
];
const TONE_OPTIONS: SelectOption[] = [
  { value: "tone-1", label: "Tone 1" },
  { value: "tone-2", label: "Tone 2" },
  { value: "tone-3", label: "Tone 3" },
  { value: "tone-4", label: "Tone 4" },
];
const SECONDARY_DEVICE_OPTIONS: SelectOption[] = [
  { value: "none", label: "None" },
  { value: "speaker", label: "Speaker" },
  { value: "headset", label: "Headset" },
];
const SECONDARY_DELAY_OPTIONS: SelectOption[] = [
  { value: "none", label: "None" },
  { value: "5s", label: "5 seconds" },
  { value: "10s", label: "10 seconds" },
  { value: "15s", label: "15 seconds" },
];
const SORT_ORDER_OPTIONS: SelectOption[] = [
  { value: "oldest-newest", label: "Oldest to newest (default)" },
  { value: "newest-oldest", label: "Newest to oldest" },
];
const SEND_WITH_ENTER_OPTIONS: SelectOption[] = [
  { value: "all-except-email", label: "All channels except email" },
  { value: "all-channels", label: "All channels" },
  { value: "no-channels", label: "No channels" },
];

/* ── The 3 real, mutually-exclusive governance states for a setting row.
 * "hidden-but-editable" and "hidden-but-locked" are deliberately not
 * representable — they'd mean nothing to an agent who never sees the row. ── */
type Governance = "hidden" | "editable" | "locked";

const GOVERNANCE_OPTIONS: SelectOption[] = [
  { value: "hidden", label: "Hidden" },
  { value: "editable", label: "Visible — Agent Can Edit" },
  { value: "locked", label: "Visible — Locked" },
];

function GovernanceIcon({ governance }: { governance: Governance }) {
  if (governance === "hidden") {
    return <EyeOff className="h-3.5 w-3.5 flex-shrink-0 text-lyra-fg-secondary" strokeWidth={1.75} aria-hidden="true" />;
  }
  if (governance === "locked") {
    return <Lock className="h-3.5 w-3.5 flex-shrink-0 text-lyra-fg-secondary" strokeWidth={1.75} aria-hidden="true" />;
  }
  return <Eye className="h-3.5 w-3.5 flex-shrink-0 text-lyra-fg-secondary" strokeWidth={1.75} aria-hidden="true" />;
}

/* ── Table header row — labels the setting-value column and the single
 * governance column every row has beyond the setting's own name. ── */
function GovernanceTableHeader() {
  return (
    <div className="flex items-center gap-4 border-b border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-4 py-2">
      <span className="w-[200px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-lyra-fg-secondary">
        Setting
      </span>
      <span className="w-[260px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-lyra-fg-secondary">
        Default Value
      </span>
      <span className="w-[240px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-lyra-fg-secondary">
        Agent Access
      </span>
    </div>
  );
}

/* ── One governed setting: name, its own value control, then the single
 * 3-state Agent Access control (replaces the earlier separate Visible /
 * Can Edit switches — see file header note). ── */
function GovernanceRow({
  label,
  children,
  governance,
  onGovernanceChange,
}: {
  label: string;
  children: React.ReactNode;
  governance: Governance;
  onGovernanceChange: (v: Governance) => void;
}) {
  return (
    <div className="flex items-center gap-4 border-t border-lyra-border-subtle px-4 py-3 first:border-t-0">
      <span className="w-[200px] flex-shrink-0 text-[14px] font-bold leading-5 text-lyra-fg-default">
        {label}
      </span>
      <div className="flex w-[260px] flex-shrink-0 items-center">{children}</div>
      <div className="flex w-[240px] flex-shrink-0 items-center gap-2">
        <GovernanceIcon governance={governance} />
        <Select
          options={GOVERNANCE_OPTIONS}
          value={governance}
          onValueChange={(v) => onGovernanceChange(v as Governance)}
          className="w-full"
          aria-label={`${label} — agent access`}
        />
      </div>
    </div>
  );
}

/* ── A group divider inside a sub-tab (e.g. "Audio Notifications" vs.
 * "Visual Notifications") — same lightweight pattern explored in
 * settings-pattern-comparison.tsx's Option 3. ── */
function SubGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-lyra-fg-secondary first:border-t-0">
      {children}
    </div>
  );
}

/* ── Sub-tab 1: Login & Voice Preferences ── */
export function LoginVoicePreferencesTab() {
  const [volume, setVolume] = useState(70);
  const [volumeGov, setVolumeGov] = useState<Governance>("editable");

  const [autoAccept, setAutoAccept] = useState(false);
  const [autoAcceptGov, setAutoAcceptGov] = useState<Governance>("editable");

  const [ringtone, setRingtone] = useState("ring-1");
  const [ringtoneGov, setRingtoneGov] = useState<Governance>("editable");

  const [secondaryDevice, setSecondaryDevice] = useState("none");
  const [secondaryDeviceGov, setSecondaryDeviceGov] = useState<Governance>("editable");

  const [secondaryDelay, setSecondaryDelay] = useState("none");
  const [secondaryDelayGov, setSecondaryDelayGov] = useState<Governance>("editable");

  const [micNoiseCancel, setMicNoiseCancel] = useState(true);
  const [micNoiseCancelGov, setMicNoiseCancelGov] = useState<Governance>("editable");
  const [micSensitivity, setMicSensitivity] = useState(60);
  const [micSensitivityGov, setMicSensitivityGov] = useState<Governance>("editable");

  const [speakerNoiseCancel, setSpeakerNoiseCancel] = useState(true);
  const [speakerNoiseCancelGov, setSpeakerNoiseCancelGov] = useState<Governance>("editable");
  const [speakerSensitivity, setSpeakerSensitivity] = useState(55);
  const [speakerSensitivityGov, setSpeakerSensitivityGov] = useState<Governance>("editable");

  const [jabra, setJabra] = useState(true);
  const [jabraGov, setJabraGov] = useState<Governance>("editable");

  return (
    <div className="rounded-b-lyra-sm border border-lyra-border-subtle">
      <GovernanceTableHeader />
      <GovernanceRow label="Softphone Volume" governance={volumeGov} onGovernanceChange={setVolumeGov}>
        <Slider value={volume} onChange={setVolume} min={0} max={100} className="w-[200px]" />
      </GovernanceRow>
      <GovernanceRow label="Auto Accept" governance={autoAcceptGov} onGovernanceChange={setAutoAcceptGov}>
        <Switch size="sm" checked={autoAccept} onCheckedChange={setAutoAccept} aria-label="Auto Accept" />
      </GovernanceRow>
      <GovernanceRow label="Ringtone" governance={ringtoneGov} onGovernanceChange={setRingtoneGov}>
        <Select options={RINGTONE_OPTIONS} value={ringtone} onValueChange={setRingtone} className="w-[180px]" />
      </GovernanceRow>
      <GovernanceRow
        label="Secondary Ringer Device"
        governance={secondaryDeviceGov}
        onGovernanceChange={setSecondaryDeviceGov}
      >
        <Select
          options={SECONDARY_DEVICE_OPTIONS}
          value={secondaryDevice}
          onValueChange={setSecondaryDevice}
          className="w-[180px]"
        />
      </GovernanceRow>
      <GovernanceRow
        label="Secondary Ringer Delay"
        governance={secondaryDelayGov}
        onGovernanceChange={setSecondaryDelayGov}
      >
        <Select
          options={SECONDARY_DELAY_OPTIONS}
          value={secondaryDelay}
          onValueChange={setSecondaryDelay}
          className="w-[180px]"
        />
      </GovernanceRow>
      <GovernanceRow
        label="Microphone Noise Cancellation"
        governance={micNoiseCancelGov}
        onGovernanceChange={setMicNoiseCancelGov}
      >
        <Switch size="sm" checked={micNoiseCancel} onCheckedChange={setMicNoiseCancel} aria-label="Microphone Noise Cancellation" />
      </GovernanceRow>
      <GovernanceRow label="Mic Sensitivity" governance={micSensitivityGov} onGovernanceChange={setMicSensitivityGov}>
        <Slider value={micSensitivity} onChange={setMicSensitivity} min={0} max={100} className="w-[200px]" />
      </GovernanceRow>
      <GovernanceRow
        label="Speaker Noise Cancellation"
        governance={speakerNoiseCancelGov}
        onGovernanceChange={setSpeakerNoiseCancelGov}
      >
        <Switch size="sm" checked={speakerNoiseCancel} onCheckedChange={setSpeakerNoiseCancel} aria-label="Speaker Noise Cancellation" />
      </GovernanceRow>
      <GovernanceRow
        label="Speaker Sensitivity"
        governance={speakerSensitivityGov}
        onGovernanceChange={setSpeakerSensitivityGov}
      >
        <Slider value={speakerSensitivity} onChange={setSpeakerSensitivity} min={0} max={100} className="w-[200px]" />
      </GovernanceRow>
      {/* Simplified — see file header note on Jabra Call Control */}
      <GovernanceRow label="Jabra Call Control" governance={jabraGov} onGovernanceChange={setJabraGov}>
        <Switch size="sm" checked={jabra} onCheckedChange={setJabra} aria-label="Jabra Call Control" />
      </GovernanceRow>
    </div>
  );
}

/* ── Sub-tab 2: A/V Notifications ── */
interface NotificationEvent {
  key: string;
  label: string;
}
const NOTIFICATION_EVENTS: NotificationEvent[] = [
  { key: "new-agent-message", label: "New Agent Message" },
  { key: "new-contact", label: "New Contact" },
  { key: "new-contact-reply", label: "New Contact Reply" },
  { key: "end-chat-or-call", label: "End Chat or Call" },
];

export function AVNotificationsTab() {
  const [audioOn, setAudioOn] = useState<Record<string, boolean>>({
    "new-agent-message": true,
    "new-contact": true,
    "new-contact-reply": true,
    "end-chat-or-call": true,
  });
  const [audioTone, setAudioTone] = useState<Record<string, string>>({
    "new-agent-message": "tone-1",
    "new-contact": "tone-2",
    "new-contact-reply": "tone-3",
    "end-chat-or-call": "tone-4",
  });
  const [audioGov, setAudioGov] = useState<Record<string, Governance>>(
    Object.fromEntries(NOTIFICATION_EVENTS.map((e) => [e.key, "editable"]))
  );

  const [visualOn, setVisualOn] = useState<Record<string, boolean>>({
    "new-agent-message": true,
    "new-contact": true,
    "new-contact-reply": true,
    "end-chat-or-call": true,
  });
  const [visualGov, setVisualGov] = useState<Record<string, Governance>>(
    Object.fromEntries(NOTIFICATION_EVENTS.map((e) => [e.key, "editable"]))
  );

  return (
    <div className="rounded-b-lyra-sm border border-lyra-border-subtle">
      <GovernanceTableHeader />
      <SubGroupLabel>Audio Notifications</SubGroupLabel>
      {NOTIFICATION_EVENTS.map((evt) => (
        <GovernanceRow
          key={evt.key}
          label={evt.label}
          governance={audioGov[evt.key]}
          onGovernanceChange={(v) => setAudioGov((p) => ({ ...p, [evt.key]: v }))}
        >
          <div className="flex items-center gap-3">
            <Switch
              size="sm"
              checked={audioOn[evt.key]}
              onCheckedChange={(v) => setAudioOn((p) => ({ ...p, [evt.key]: v }))}
              aria-label={`${evt.label} audio`}
            />
            <Select
              options={TONE_OPTIONS}
              value={audioTone[evt.key]}
              onValueChange={(v) => setAudioTone((p) => ({ ...p, [evt.key]: v }))}
              className="w-[140px]"
              disabled={!audioOn[evt.key]}
            />
          </div>
        </GovernanceRow>
      ))}
      <SubGroupLabel>Visual Notifications</SubGroupLabel>
      {NOTIFICATION_EVENTS.map((evt) => (
        <GovernanceRow
          key={evt.key}
          label={evt.label}
          governance={visualGov[evt.key]}
          onGovernanceChange={(v) => setVisualGov((p) => ({ ...p, [evt.key]: v }))}
        >
          <Switch
            size="sm"
            checked={visualOn[evt.key]}
            onCheckedChange={(v) => setVisualOn((p) => ({ ...p, [evt.key]: v }))}
            aria-label={`${evt.label} visual`}
          />
        </GovernanceRow>
      ))}
    </div>
  );
}

/* ── Sub-tab 3: Display & Keyboard ── */
export function DisplayKeyboardTab() {
  const [twentyFourHour, setTwentyFourHour] = useState(false);
  const [twentyFourHourGov, setTwentyFourHourGov] = useState<Governance>("editable");

  const [panelGeneral, setPanelGeneral] = useState(false);
  const [panelGeneralGov, setPanelGeneralGov] = useState<Governance>("editable");

  const [panelPageAction, setPanelPageAction] = useState(true);
  const [panelPageActionGov, setPanelPageActionGov] = useState<Governance>("editable");

  const [sortOrder, setSortOrder] = useState("oldest-newest");
  const [sortOrderGov, setSortOrderGov] = useState<Governance>("editable");

  const [sendWithEnter, setSendWithEnter] = useState("all-except-email");
  const [sendWithEnterGov, setSendWithEnterGov] = useState<Governance>("editable");

  return (
    <>
      <div className="rounded-b-lyra-sm border border-lyra-border-subtle">
        <GovernanceTableHeader />
        <GovernanceRow label="24 Hour Time" governance={twentyFourHourGov} onGovernanceChange={setTwentyFourHourGov}>
          <Switch size="sm" checked={twentyFourHour} onCheckedChange={setTwentyFourHour} aria-label="24 Hour Time" />
        </GovernanceRow>
        <GovernanceRow
          label="Panel Open in Browser: General"
          governance={panelGeneralGov}
          onGovernanceChange={setPanelGeneralGov}
        >
          <Switch size="sm" checked={panelGeneral} onCheckedChange={setPanelGeneral} aria-label="Panel Open in Browser: General" />
        </GovernanceRow>
        <GovernanceRow
          label="Panel Open in Browser: Page Action Only"
          governance={panelPageActionGov}
          onGovernanceChange={setPanelPageActionGov}
        >
          <Switch size="sm" checked={panelPageAction} onCheckedChange={setPanelPageAction} aria-label="Panel Open in Browser: Page Action Only" />
        </GovernanceRow>
        <GovernanceRow label="Email Message Sort Order" governance={sortOrderGov} onGovernanceChange={setSortOrderGov}>
          <Select options={SORT_ORDER_OPTIONS} value={sortOrder} onValueChange={setSortOrder} className="w-[220px]" />
        </GovernanceRow>
        <GovernanceRow label="Send with Enter" governance={sendWithEnterGov} onGovernanceChange={setSendWithEnterGov}>
          <Select options={SEND_WITH_ENTER_OPTIONS} value={sendWithEnter} onValueChange={setSendWithEnter} className="w-[220px]" />
        </GovernanceRow>
      </div>
      <p className="lyra-body-sm mt-3 text-lyra-fg-secondary">
        The real Display &amp; Keyboard tab also has a read-only Keyboard
        Shortcuts reference table — not a setting, so it's out of scope
        here and not shown in this mock.
      </p>
    </>
  );
}

/* ── Placeholder for the page's other two top-level tabs, just enough to
 * show where "Settings Page" sits relative to them. ── */
function OtherTabPlaceholder({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lyra-sm border border-dashed border-lyra-border-subtle px-6 py-16 text-center">
      <p className="lyra-body-md-emphasis text-lyra-fg-secondary">{name}</p>
      <p className="lyra-body-sm max-w-[360px] text-lyra-fg-secondary">
        Not part of this mock — see the "Create Desktop Profile" view for
        the real content on this tab.
      </p>
    </div>
  );
}

type OuterTab = "settings" | "teams" | "settings-page";
type InnerTab = "login-voice" | "av-notifications" | "display-keyboard";

export function SettingsPageTile() {
  const [outerTab, setOuterTab] = useState<OuterTab>("settings-page");
  const [innerTab, setInnerTab] = useState<InnerTab>("av-notifications");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-lyra-bg-surface-shell">
      <AppHeader
        appName={<AppName name="Agent Configuration" icon={<CXoneSmiley />} />}
        actions={HEADER_ACTIONS}
        className="border-b border-lyra-border-subtle bg-lyra-bg-surface-base"
      />
      <AdminShell
        storageKeyPrefix="settings-page-tile-preview"
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
          {/* ── Outer tabs — where "Settings Page" sits alongside the
           * existing Settings / Assigned Teams tabs. This nested-tab
           * placement is one of the open IA questions from the critique:
           * worth judging here whether a tab-inside-a-tab reads clearly. */}
          <TabList className="px-6">
            <Tab active={outerTab === "settings"} onClick={() => setOuterTab("settings")}>
              Settings
            </Tab>
            <Tab active={outerTab === "settings-page"} onClick={() => setOuterTab("settings-page")}>
              Settings Page
            </Tab>
            <Tab active={outerTab === "teams"} onClick={() => setOuterTab("teams")}>
              Assigned Teams
            </Tab>
          </TabList>

          <TabPanel active={outerTab === "settings"} className="px-6 py-6">
            <OtherTabPlaceholder name="Settings" />
          </TabPanel>
          <TabPanel active={outerTab === "teams"} className="px-6 py-6">
            <OtherTabPlaceholder name="Assigned Teams" />
          </TabPanel>
          <TabPanel active={outerTab === "settings-page"} className="flex flex-col gap-4 px-6 py-6">
            <p className="lyra-body-md max-w-[720px] text-lyra-fg-secondary">
              AW-35954 — mirrors the real Settings app's own tabs. Each
              row's <strong>Agent Access</strong> control is a single
              3-state choice — Hidden, Visible &amp; Editable, or
              Visible &amp; Locked — instead of two separate switches, so
              there's no way to configure a meaningless state like
              "hidden but editable." The value control itself (switch,
              select, or slider) is what the admin sets as the enforced
              default in every case.
            </p>
            <TabList>
              <Tab active={innerTab === "login-voice"} onClick={() => setInnerTab("login-voice")}>
                Login & Voice Preferences
              </Tab>
              <Tab active={innerTab === "av-notifications"} onClick={() => setInnerTab("av-notifications")}>
                A/V Notifications
              </Tab>
              <Tab active={innerTab === "display-keyboard"} onClick={() => setInnerTab("display-keyboard")}>
                Display & Keyboard
              </Tab>
            </TabList>
            <TabPanel active={innerTab === "login-voice"}>
              <LoginVoicePreferencesTab />
            </TabPanel>
            <TabPanel active={innerTab === "av-notifications"}>
              <AVNotificationsTab />
            </TabPanel>
            <TabPanel active={innerTab === "display-keyboard"}>
              <DisplayKeyboardTab />
            </TabPanel>
          </TabPanel>
        </div>
      </AdminShell>
    </div>
  );
}
