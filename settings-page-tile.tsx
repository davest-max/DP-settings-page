import * as React from "react";
import { useState } from "react";
import { Box, Eye, EyeOff, Lock, Volume2 } from "lucide-react";
import {
  cn,
  AdminShell,
  Button,
  TabList,
  Tab,
  TabPanel,
  Switch,
  Select,
  Slider,
  ContentArea,
  Tooltip,
  type SelectOption,
  type TreeMenuItem,
} from "../lyra-ui/src";
import { AppShellHeader } from "./app-header";
import { playTonePreview } from "./tone-preview";

/**
 * AW-35954 exploration — "Agent Settings Page" tile.
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
 * real tabs as sub-navigation *inside* a new "Agent Settings Page" tab,
 * rather than flattening ~21 settings into one list.
 *
 * Governance model — 3 columns split by widget role, not by row-by-row
 * judgment call:
 *   1. Visibility  — any on/off Switch for the row lives here, whether
 *      it's a real "does this exist in Agent Workspace at all" show/hide
 *      (the two "Panel Open in Browser" rows, verified live) or a plain
 *      enable/disable preference (Auto Accept, 24 Hour Time, Visual
 *      Notification, the Mic/Speaker Noise Cancellation on/off itself).
 *      A toggle reads as on-or-present vs. off-or-absent either way, so it
 *      belongs in the same column regardless of which the real app treats
 *      it as. Left blank for rows with no Switch at all.
 *   2. Component Used — the setting's actual VALUE control once it's on:
 *      a Select or Slider (Ringtone, Secondary Ringer Device/Delay,
 *      Softphone Volume, Mic/Speaker Sensitivity, Tone). Left blank for a
 *      row that's only ever a plain Switch with nothing further to
 *      configure. Jabra Call Control has neither a Switch nor a Select/
 *      Slider — a plain descriptive line stands in here instead, since it
 *      has no single value to show.
 *   3. Agent Access — a single 3-state choice (Hidden / Visible — Agent
 *      Can Edit / Visible — Locked) governing what the agent can do with
 *      the row. "Hidden" is dropped from this list for every row that
 *      already has its own Visibility switch — a second "Hidden" would
 *      just be a redundant way to do what that switch already does — and
 *      kept only for rows with no Visibility switch at all, where Agent
 *      Access is the sole way to hide them (Softphone Volume, Ringtone,
 *      Secondary Ringer Device/Delay, Email Message Sort Order, Send with
 *      Enter, Jabra Call Control).
 *
 *      Every row with a Visibility switch also disables its own Agent
 *      Access dropdown (`governanceDisabled`) whenever that switch is
 *      off, same as Component Used already did — there's nothing left to
 *      grant edit/lock access to once the row itself is off. This started
 *      as a Panel-rows-only behavior; it's now applied to every row that
 *      has a Visibility switch, for the same reason.
 */

/* ── Shared page chrome — same pattern as create-desktop-profile-page.tsx:
 * reproduced locally rather than imported so this preview stays
 * self-contained (see that file's own note on this). ── */
const NAV_ITEMS: TreeMenuItem[] = [
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "Desktop Profiles", active: true },
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "ACS Onboarding" },
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "CRM Integrations" },
];

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

/* ── Same 3 states minus "Hidden" — for every row that already has its
 * own Visibility switch (the two Panel Open in Browser rows, Auto
 * Accept, 24 Hour Time, Visual Notification, Mic/Speaker Noise
 * Cancellation, Audio Notification). That switch already removes or
 * mutes the row, so a second "Hidden" in this list would just be a
 * redundant way to do the same thing. Rows with no Visibility switch at
 * all (Softphone Volume, Ringtone, Secondary Ringer Device/Delay, Email
 * Message Sort Order, Send with Enter, Jabra Call Control) keep the full
 * `GOVERNANCE_OPTIONS` below, since Agent Access is their only way to be
 * hidden. ── */
const GOVERNANCE_OPTIONS_NO_HIDDEN: SelectOption[] = [
  { value: "editable", label: "Visible — Agent Can Edit" },
  { value: "locked", label: "Visible — Locked" },
];

function GovernanceIcon({ governance, muted }: { governance: Governance; muted?: boolean }) {
  const cls = cn(
    "h-3.5 w-3.5 flex-shrink-0",
    muted ? "text-lyra-fg-disabled" : "text-lyra-fg-secondary"
  );
  if (governance === "hidden") {
    return <EyeOff className={cls} strokeWidth={1.75} aria-hidden="true" />;
  }
  if (governance === "locked") {
    return <Lock className={cls} strokeWidth={1.75} aria-hidden="true" />;
  }
  return <Eye className={cls} strokeWidth={1.75} aria-hidden="true" />;
}

/* ── Plays the row's currently-selected Tone (see `tone-preview.ts`).
 * The shared `Select` has no per-option preview slot, so this can't sit
 * inside the open dropdown next to "Tone 1"/"Tone 2"/etc. — it previews
 * whichever tone is already chosen for the row instead, same as clicking
 * it after picking a new one. Sits right after the Select rather than
 * before, reading as an action on the value the Select shows, not a
 * status icon like `GovernanceIcon` before it. */
function TonePreviewButton({
  tone,
  label,
  disabled,
}: {
  tone: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Tooltip content="Preview tone" placement="top" asLabel disabled={disabled}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => playTonePreview(tone)}
        aria-label={`Preview ${label} tone`}
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lyra-xs border transition-colors",
          disabled
            ? "cursor-not-allowed border-lyra-border-subtle text-lyra-fg-disabled"
            : "border-lyra-border-subtle text-lyra-fg-secondary hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
        )}
      >
        <Volume2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

/* ── Table header row. Visibility holds a Switch for any row that has
 * one; Component Used holds that row's Select/Slider value control (or a
 * plain descriptive line for Jabra, which has neither). Both stay in
 * every row's column grid, blank where a row has nothing for them, so
 * all 4 columns line up down the whole table. ── */
function GovernanceTableHeader() {
  return (
    <div className="flex items-center gap-4 border-b border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-4 py-2">
      <span className="w-[200px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-lyra-fg-secondary">
        Setting
      </span>
      <span className="w-[110px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-lyra-fg-secondary">
        Visibility
      </span>
      <span className="w-[280px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-lyra-fg-secondary">
        Component Used
      </span>
      <span className="w-[240px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-lyra-fg-secondary">
        Agent Access
      </span>
    </div>
  );
}

/* ── One governed setting: name, then up to 3 controls.
 *
 * `children` sits in the "Visibility" column — any on/off Switch for the
 * row, and only a Switch. That covers both the two "Panel Open in
 * Browser" rows (a real show/hide of the whole component) and plain
 * enable/disable preferences elsewhere (Auto Accept, 24 Hour Time, Visual
 * Notification, Mic/Speaker Noise Cancellation, Audio Notification) —
 * a toggle reads as on-or-present vs. off-or-absent either way, so both
 * kinds live in the same column rather than splitting by which the real
 * app happens to treat as a true visibility concept. Left blank for a
 * row with no Switch (Softphone Volume, Ringtone, Secondary Ringer
 * Device/Delay, Email Message Sort Order, Send with Enter, Jabra Call
 * Control).
 *
 * `componentUsedControl` is the "Component Used" column — the setting's
 * further VALUE control once it's on: a Select or Slider. Left blank for
 * a row that's only ever a Switch with nothing else to configure (Auto
 * Accept, 24 Hour Time, Visual Notification). Jabra Call Control has
 * neither a Switch nor a Select/Slider, so a plain descriptive line goes
 * here instead — there's no single value to show. */
function GovernanceRow({
  label,
  children,
  componentUsedControl,
  governance,
  onGovernanceChange,
  governanceOptions = GOVERNANCE_OPTIONS,
  governanceDisabled,
}: {
  label: string;
  children?: React.ReactNode;
  componentUsedControl?: React.ReactNode;
  governance: Governance;
  onGovernanceChange: (v: Governance) => void;
  governanceOptions?: SelectOption[];
  governanceDisabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 border-t border-lyra-border-subtle px-4 py-3 first:border-t-0">
      <span className="w-[200px] flex-shrink-0 text-[14px] font-bold leading-5 text-lyra-fg-default">
        {label}
      </span>
      <div className="flex w-[110px] flex-shrink-0 items-center">{children}</div>
      <div className="flex w-[280px] flex-shrink-0 items-center gap-2">{componentUsedControl}</div>
      <div className="flex w-[240px] flex-shrink-0 items-center gap-2">
        <GovernanceIcon governance={governance} muted={governanceDisabled} />
        <Select
          options={governanceOptions}
          value={governance}
          onValueChange={(v) => onGovernanceChange(v as Governance)}
          className="w-full"
          disabled={governanceDisabled}
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

  const [speakerNoiseCancel, setSpeakerNoiseCancel] = useState(true);
  const [speakerNoiseCancelGov, setSpeakerNoiseCancelGov] = useState<Governance>("editable");
  const [speakerSensitivity, setSpeakerSensitivity] = useState(55);

  /* Jabra Call Control isn't a toggle in the real app (cxagent.nicecxone.com)
   * — it's an "Add Devices" button plus a Selected Devices picker, no on/off
   * value at all. No Visibility control either; it's governed by Agent
   * Access alone, with a plain descriptive line standing in for Component
   * Used since there's no single value to show. */
  const [jabraGov, setJabraGov] = useState<Governance>("editable");

  return (
    <div className="rounded-b-lyra-sm border border-lyra-border-subtle">
      <GovernanceTableHeader />
      <GovernanceRow
        label="Softphone Volume"
        governance={volumeGov}
        onGovernanceChange={setVolumeGov}
        componentUsedControl={
          <Slider value={volume} onChange={setVolume} min={0} max={100} showTicks={false} className="w-full" />
        }
      />
      <GovernanceRow
        label="Auto Accept"
        governance={autoAcceptGov}
        onGovernanceChange={setAutoAcceptGov}
        governanceOptions={GOVERNANCE_OPTIONS_NO_HIDDEN}
        governanceDisabled={!autoAccept}
      >
        <Switch size="sm" checked={autoAccept} onCheckedChange={setAutoAccept} aria-label="Auto Accept" />
      </GovernanceRow>
      <GovernanceRow
        label="Ringtone"
        governance={ringtoneGov}
        onGovernanceChange={setRingtoneGov}
        componentUsedControl={
          <Select options={RINGTONE_OPTIONS} value={ringtone} onValueChange={setRingtone} className="w-full" />
        }
      />
      <GovernanceRow
        label="Secondary Ringer Device"
        governance={secondaryDeviceGov}
        onGovernanceChange={setSecondaryDeviceGov}
        componentUsedControl={
          <Select
            options={SECONDARY_DEVICE_OPTIONS}
            value={secondaryDevice}
            onValueChange={setSecondaryDevice}
            className="w-full"
          />
        }
      />
      <GovernanceRow
        label="Secondary Ringer Delay"
        governance={secondaryDelayGov}
        onGovernanceChange={setSecondaryDelayGov}
        componentUsedControl={
          <Select
            options={SECONDARY_DELAY_OPTIONS}
            value={secondaryDelay}
            onValueChange={setSecondaryDelay}
            className="w-full"
          />
        }
      />
      {/* The enable/disable Switch is a toggle, so it sits in Visibility
       * like any other toggle — off mutes the whole row's behavior, which
       * reads the same as hiding it, even though the real app frames it as
       * a preference rather than a true show/hide. Its Sensitivity slider
       * is the actual VALUE control, so it's Component Used alone, grayed
       * out when the Visibility switch is off (verified live: the real app
       * shows the slider directly beneath this toggle and disables it the
       * same way). */}
      <GovernanceRow
        label="Microphone Noise Cancellation"
        governance={micNoiseCancelGov}
        onGovernanceChange={setMicNoiseCancelGov}
        governanceOptions={GOVERNANCE_OPTIONS_NO_HIDDEN}
        governanceDisabled={!micNoiseCancel}
        componentUsedControl={
          <Slider
            value={micSensitivity}
            onChange={setMicSensitivity}
            min={0}
            max={100}
            showTicks={false}
            className="w-full"
            disabled={!micNoiseCancel}
            aria-label="Mic Sensitivity"
          />
        }
      >
        <Switch size="sm" checked={micNoiseCancel} onCheckedChange={setMicNoiseCancel} aria-label="Microphone Noise Cancellation" />
      </GovernanceRow>
      <GovernanceRow
        label="Speaker Noise Cancellation"
        governance={speakerNoiseCancelGov}
        onGovernanceChange={setSpeakerNoiseCancelGov}
        governanceOptions={GOVERNANCE_OPTIONS_NO_HIDDEN}
        governanceDisabled={!speakerNoiseCancel}
        componentUsedControl={
          <Slider
            value={speakerSensitivity}
            onChange={setSpeakerSensitivity}
            min={0}
            max={100}
            showTicks={false}
            className="w-full"
            disabled={!speakerNoiseCancel}
            aria-label="Speaker Sensitivity"
          />
        }
      >
        <Switch size="sm" checked={speakerNoiseCancel} onCheckedChange={setSpeakerNoiseCancel} aria-label="Speaker Noise Cancellation" />
      </GovernanceRow>
      <GovernanceRow
        label="Jabra Call Control"
        governance={jabraGov}
        onGovernanceChange={setJabraGov}
        componentUsedControl={
          <span className="lyra-body-sm text-lyra-fg-secondary">
            Managed via Add Devices — no single on/off value
          </span>
        }
      />
    </div>
  );
}

/* ── Sub-tab 2: A/V Notifications ── */
interface NotificationEvent {
  key: string;
  label: string;
}
const NOTIFICATION_EVENTS: NotificationEvent[] = [
  { key: "new-voice-call", label: "New Voice Call" },
  { key: "new-agent-message", label: "New Agent Message" },
  { key: "new-contact", label: "New Digital Contact" },
  { key: "new-contact-reply", label: "New Contact Reply" },
  { key: "end-chat-or-call", label: "End Chat or Call" },
];

export function AVNotificationsTab() {
  const [audioOn, setAudioOn] = useState<Record<string, boolean>>({
    "new-agent-message": true,
    "new-voice-call": true,
    "new-contact": true,
    "new-contact-reply": true,
    "end-chat-or-call": true,
  });
  const [audioTone, setAudioTone] = useState<Record<string, string>>({
    "new-agent-message": "tone-1",
    "new-voice-call": "tone-1",
    "new-contact": "tone-2",
    "new-contact-reply": "tone-3",
    "end-chat-or-call": "tone-4",
  });
  const [audioGov, setAudioGov] = useState<Record<string, Governance>>(
    Object.fromEntries(NOTIFICATION_EVENTS.map((e) => [e.key, "editable"]))
  );

  const [visualOn, setVisualOn] = useState<Record<string, boolean>>({
    "new-agent-message": true,
    "new-voice-call": true,
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
          governanceOptions={GOVERNANCE_OPTIONS_NO_HIDDEN}
          governanceDisabled={!audioOn[evt.key]}
          componentUsedControl={
            <>
              <Select
                options={TONE_OPTIONS}
                value={audioTone[evt.key]}
                onValueChange={(v) => setAudioTone((p) => ({ ...p, [evt.key]: v }))}
                className="w-full"
                disabled={!audioOn[evt.key]}
                aria-label={`${evt.label} tone`}
              />
              <TonePreviewButton
                tone={audioTone[evt.key]}
                label={evt.label}
                disabled={!audioOn[evt.key]}
              />
            </>
          }
        >
          <Switch
            size="sm"
            checked={audioOn[evt.key]}
            onCheckedChange={(v) => setAudioOn((p) => ({ ...p, [evt.key]: v }))}
            aria-label={`${evt.label} audio`}
          />
        </GovernanceRow>
      ))}
      <SubGroupLabel>Visual Notifications</SubGroupLabel>
      {NOTIFICATION_EVENTS.map((evt) => (
        <GovernanceRow
          key={evt.key}
          label={evt.label}
          governance={visualGov[evt.key]}
          onGovernanceChange={(v) => setVisualGov((p) => ({ ...p, [evt.key]: v }))}
          governanceOptions={GOVERNANCE_OPTIONS_NO_HIDDEN}
          governanceDisabled={!visualOn[evt.key]}
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

  const [panelGeneralUsed, setPanelGeneralUsed] = useState(true);
  const [panelGeneral, setPanelGeneral] = useState(false);
  const [panelGeneralGov, setPanelGeneralGov] = useState<Governance>("editable");

  const [panelPageActionUsed, setPanelPageActionUsed] = useState(true);
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
        <GovernanceRow
          label="24 Hour Time"
          governance={twentyFourHourGov}
          onGovernanceChange={setTwentyFourHourGov}
          governanceOptions={GOVERNANCE_OPTIONS_NO_HIDDEN}
          governanceDisabled={!twentyFourHour}
        >
          <Switch size="sm" checked={twentyFourHour} onCheckedChange={setTwentyFourHour} aria-label="24 Hour Time" />
        </GovernanceRow>
        {/* These are the only 2 rows on the whole page where the
         * Visibility switch is a true show/hide of the component and
         * still has its own separate Component Used value underneath
         * (the grayscale switch) — every other Visibility switch on this
         * page (Auto Accept, 24 Hour Time, etc.) is just that row's own
         * plain enable/disable value, with nothing further in Component
         * Used. */}
        <GovernanceRow
          label="Panel Open in Browser: General"
          governance={panelGeneralGov}
          onGovernanceChange={setPanelGeneralGov}
          governanceOptions={GOVERNANCE_OPTIONS_NO_HIDDEN}
          governanceDisabled={!panelGeneralUsed}
          componentUsedControl={
            <span title="Component Used — the behavior's own on/off default once the feature is present">
              <Switch
                size="sm"
                checked={panelGeneral}
                onCheckedChange={setPanelGeneral}
                disabled={!panelGeneralUsed}
                aria-label="Panel Open in Browser: General — Component Used (what the agent sees in Agent Workspace)"
              />
            </span>
          }
        >
          <Switch
            size="sm"
            checked={panelGeneralUsed}
            onCheckedChange={setPanelGeneralUsed}
            aria-label="Panel Open in Browser: General — Visibility (show/hide)"
          />
        </GovernanceRow>
        <GovernanceRow
          label="Panel Open in Browser: Page Action Only"
          governance={panelPageActionGov}
          onGovernanceChange={setPanelPageActionGov}
          governanceOptions={GOVERNANCE_OPTIONS_NO_HIDDEN}
          governanceDisabled={!panelPageActionUsed}
          componentUsedControl={
            <span title="Component Used — the behavior's own on/off default once the feature is present">
              <Switch
                size="sm"
                checked={panelPageAction}
                onCheckedChange={setPanelPageAction}
                disabled={!panelPageActionUsed}
                aria-label="Panel Open in Browser: Page Action Only — Component Used (what the agent sees in Agent Workspace)"
              />
            </span>
          }
        >
          <Switch
            size="sm"
            checked={panelPageActionUsed}
            onCheckedChange={setPanelPageActionUsed}
            aria-label="Panel Open in Browser: Page Action Only — Visibility (show/hide)"
          />
        </GovernanceRow>
        <GovernanceRow
          label="Email Message Sort Order"
          governance={sortOrderGov}
          onGovernanceChange={setSortOrderGov}
          componentUsedControl={
            <Select options={SORT_ORDER_OPTIONS} value={sortOrder} onValueChange={setSortOrder} className="w-full" />
          }
        />
        <GovernanceRow
          label="Send with Enter"
          governance={sendWithEnterGov}
          onGovernanceChange={setSendWithEnterGov}
          componentUsedControl={
            <Select options={SEND_WITH_ENTER_OPTIONS} value={sendWithEnter} onValueChange={setSendWithEnter} className="w-full" />
          }
        />
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
 * show where "Agent Settings Page" sits relative to them. ── */
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
      <AppShellHeader />
      <ContentArea>
          <AdminShell
            storageKeyPrefix="settings-page-tile-preview"
            navTitle=""
            navItems={NAV_ITEMS}
            defaultLeftPinned
            roundedContent
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
          {/* ── Outer tabs — where "Agent Settings Page" sits alongside the
           * existing Settings / Assigned Teams tabs. This nested-tab
           * placement is one of the open IA questions from the critique:
           * worth judging here whether a tab-inside-a-tab reads clearly. */}
          <TabList className="px-6">
            <Tab active={outerTab === "settings"} onClick={() => setOuterTab("settings")}>
              Settings
            </Tab>
            <Tab active={outerTab === "settings-page"} onClick={() => setOuterTab("settings-page")}>
              Agent Settings Page
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
      </ContentArea>
    </div>
  );
}
