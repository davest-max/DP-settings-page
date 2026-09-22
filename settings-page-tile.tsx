import * as React from "react";
import { useState } from "react";
import { Box, Eye, Lock, Volume2 } from "lucide-react";
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
 * Governance model v2 — 4 columns, each answering exactly one question,
 * in dependency order left to right. Revised from v1 (see git history):
 * v1 had only 3 columns and let "Visibility" do double duty as either a
 * true agent-facing show/hide OR the setting's own on/off value,
 * depending on the row — the same-looking Switch meant two different
 * things and nothing in the UI told you which. v2 gives every question
 * its own column, always in the same place, always meaning the same
 * thing:
 *
 *   1. Component Enabled — does this capability exist for this profile
 *      at all? Admin-only, nothing to do with the agent. Off means there
 *      is nothing left to configure, so it disables every other column
 *      in the row (Visibility, Value, and Agent Access all grey out).
 *      Only shown where an existence question is actually meaningful —
 *      the two "Panel Open in Browser" rows, which are optional
 *      capabilities that may not be part of a given profile at all.
 *      Left blank everywhere else: Softphone Volume, Ringtone, Auto
 *      Accept, and the rest are core built-in preferences that are
 *      always "there" — for them there's no separate existence question
 *      to ask, only whether the agent can see and edit the setting.
 *   2. Visibility — given the component is enabled, can the agent see
 *      this row in their own Settings app at all? This is now the ONE
 *      thing Visibility ever means, on every row, full stop — never a
 *      stand-in for the setting's own value the way v1 used it for Auto
 *      Accept, 24 Hour Time, Mic/Speaker Noise Cancellation, and the
 *      notification switches. Off disables Agent Access (nothing to
 *      grant edit/lock permission on for a row the agent can't see) but
 *      deliberately leaves Value still editable — the admin is often
 *      pre-setting what the value *will* be once visibility is turned
 *      on, not just reacting to what's visible right now.
 *   3. Value — the setting's actual value control: a Select, a Slider,
 *      or a plain Switch when the setting itself is a yes/no (Auto
 *      Accept, 24 Hour Time, the notification on/off switches, both
 *      Panel Open in Browser rows). Jabra Call Control has neither — a
 *      plain descriptive line stands in, since there's no single value
 *      to show.
 *   4. Agent Access — a single 2-state choice: Agent Can Edit, or
 *      Locked. v1 had a third "Hidden" state on rows with no Visibility
 *      switch, since Agent Access was their only way to be hidden at
 *      all. Now that every row has a real Visibility switch, hiding is
 *      fully and only Visibility's job — a third "Hidden" state here
 *      would just be a second, overlapping way to do what Visibility (or
 *      Component Enabled) already does, so it's gone everywhere, not
 *      just on the rows that happened to have a switch before.
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

/* ── The 2 real, mutually-exclusive Agent Access states for a setting
 * row. "Hidden" deliberately isn't representable here in v2 — hiding a
 * row is Visibility's (and Component Enabled's) job now; see the model
 * note above. ── */
type Governance = "editable" | "locked";

const GOVERNANCE_OPTIONS: SelectOption[] = [
  { value: "editable", label: "Agent Can Edit" },
  { value: "locked", label: "Locked" },
];

/* ── Color-codes Agent Access so a whole column reads as a strip of
 * green/amber dots at a glance, instead of the same gray icon shape
 * repeated down every row. `muted` (the row's Visibility is off, or its
 * Component Enabled is off) drops back to plain gray so a genuinely
 * inert row doesn't compete for attention with the real states. */
function GovernanceIcon({ governance, muted }: { governance: Governance; muted?: boolean }) {
  const Icon = governance === "locked" ? Lock : Eye;
  const swatchCls = muted
    ? "bg-lyra-bg-surface-container-subtle text-lyra-fg-disabled"
    : governance === "locked"
    ? "bg-lyra-status-warning-subtle text-lyra-status-warning-strong"
    : "bg-lyra-status-success-subtle text-lyra-status-success-strong";

  return (
    <span
      className={cn(
        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
        swatchCls
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
    </span>
  );
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
  ariaLabel,
  disabled,
}: {
  tone: string;
  /** Full accessible name for the button, e.g. "Preview New Voice Call
   * tone" or "Preview Ringtone" -- composed by the caller rather than
   * templated in here, since "Preview Ringtone tone" reads as a
   * duplicated word once "Ringtone" is itself the sound's name. */
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <Tooltip content="Preview tone" placement="top" asLabel disabled={disabled}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => playTonePreview(tone)}
        aria-label={ariaLabel}
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

/* ── Table header row — the 4 columns from the model note above, always
 * in this order, always present, blank where a given row has nothing
 * for that column (Component Enabled is blank on all but the 2 Panel
 * Open in Browser rows; Value is a plain descriptive line for Jabra
 * Call Control, which has no single value to show). ── */
function GovernanceTableHeader() {
  return (
    <div className="flex items-center gap-4 border-b border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-4 py-2">
      <span className="w-[190px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-lyra-fg-secondary">
        Setting
      </span>
      <span className="w-[70px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-lyra-fg-secondary">
        Component Enabled
      </span>
      <span className="w-[80px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-lyra-fg-secondary">
        Visibility
      </span>
      <span className="w-[330px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-lyra-fg-secondary">
        Value
      </span>
      <span className="w-[200px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-lyra-fg-secondary">
        Agent Access
      </span>
    </div>
  );
}

/* ── One governed setting: name, then the 4 columns from the model note
 * above. `componentEnabled`/`onComponentEnabledChange` are left
 * undefined for a row with no existence question to ask — the column
 * renders blank but still holds its place, so every row's Visibility /
 * Value / Agent Access line up regardless. Cascade: Component Enabled
 * off disables Visibility, Value, and Agent Access together (there's
 * nothing left to configure); Visibility off disables only Agent Access
 * — Value stays editable, since the admin is often pre-setting what the
 * value *will* be once visibility is turned back on, not just reacting
 * to what's visible right now. */
function GovernanceRow({
  label,
  componentEnabled,
  onComponentEnabledChange,
  visible,
  onVisibleChange,
  value,
  governance,
  onGovernanceChange,
}: {
  label: string;
  componentEnabled?: boolean;
  onComponentEnabledChange?: (v: boolean) => void;
  visible: boolean;
  onVisibleChange: (v: boolean) => void;
  value?: React.ReactNode;
  governance: Governance;
  onGovernanceChange: (v: Governance) => void;
}) {
  const hasComponentEnabled = componentEnabled !== undefined;
  const gatedOff = hasComponentEnabled && !componentEnabled;
  const governanceDisabled = gatedOff || !visible;

  return (
    <div className="flex items-center gap-4 border-t border-lyra-border-subtle px-4 py-3 first:border-t-0">
      <span className="w-[190px] flex-shrink-0 text-[14px] font-bold leading-5 text-lyra-fg-default">
        {label}
      </span>
      <div className="flex w-[70px] flex-shrink-0 items-center">
        {hasComponentEnabled && (
          <Switch
            size="sm"
            checked={!!componentEnabled}
            onCheckedChange={onComponentEnabledChange}
            aria-label={`${label} — component enabled`}
          />
        )}
      </div>
      <div className="flex w-[80px] flex-shrink-0 items-center">
        <Switch
          size="sm"
          checked={visible}
          onCheckedChange={onVisibleChange}
          disabled={gatedOff}
          aria-label={`${label} — visibility`}
        />
      </div>
      <div className="flex w-[330px] flex-shrink-0 items-center gap-2">{value}</div>
      <div className="flex w-[200px] flex-shrink-0 items-center gap-2">
        <GovernanceIcon governance={governance} muted={governanceDisabled} />
        <Select
          options={GOVERNANCE_OPTIONS}
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
  const [volumeVisible, setVolumeVisible] = useState(true);
  const [volume, setVolume] = useState(70);
  const [volumeGov, setVolumeGov] = useState<Governance>("editable");

  const [autoAcceptVisible, setAutoAcceptVisible] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [autoAcceptGov, setAutoAcceptGov] = useState<Governance>("editable");

  const [ringtoneVisible, setRingtoneVisible] = useState(true);
  const [ringtone, setRingtone] = useState("ring-1");
  const [ringtoneGov, setRingtoneGov] = useState<Governance>("editable");

  const [secondaryDeviceVisible, setSecondaryDeviceVisible] = useState(true);
  const [secondaryDevice, setSecondaryDevice] = useState("none");
  const [secondaryDeviceGov, setSecondaryDeviceGov] = useState<Governance>("editable");

  const [secondaryDelayVisible, setSecondaryDelayVisible] = useState(true);
  const [secondaryDelay, setSecondaryDelay] = useState("none");
  const [secondaryDelayGov, setSecondaryDelayGov] = useState<Governance>("editable");

  const [micNoiseCancelVisible, setMicNoiseCancelVisible] = useState(true);
  const [micNoiseCancel, setMicNoiseCancel] = useState(true);
  const [micNoiseCancelGov, setMicNoiseCancelGov] = useState<Governance>("editable");
  const [micSensitivity, setMicSensitivity] = useState(60);

  const [speakerNoiseCancelVisible, setSpeakerNoiseCancelVisible] = useState(true);
  const [speakerNoiseCancel, setSpeakerNoiseCancel] = useState(true);
  const [speakerNoiseCancelGov, setSpeakerNoiseCancelGov] = useState<Governance>("editable");
  const [speakerSensitivity, setSpeakerSensitivity] = useState(55);

  /* Jabra Call Control isn't a toggle in the real app (cxagent.nicecxone.com)
   * — it's an "Add Devices" button plus a Selected Devices picker, no on/off
   * value at all. No Component Enabled either — it's a core built-in
   * control, same as everything else on this tab — with a plain
   * descriptive line standing in for Value since there's no single value
   * to show. */
  const [jabraVisible, setJabraVisible] = useState(true);
  const [jabraGov, setJabraGov] = useState<Governance>("editable");

  return (
    <div className="rounded-b-lyra-sm border border-lyra-border-subtle">
      <GovernanceTableHeader />
      <GovernanceRow
        label="Softphone Volume"
        visible={volumeVisible}
        onVisibleChange={setVolumeVisible}
        governance={volumeGov}
        onGovernanceChange={setVolumeGov}
        value={<Slider value={volume} onChange={setVolume} min={0} max={100} showTicks={false} className="w-full" />}
      />
      <GovernanceRow
        label="Auto Accept"
        visible={autoAcceptVisible}
        onVisibleChange={setAutoAcceptVisible}
        governance={autoAcceptGov}
        onGovernanceChange={setAutoAcceptGov}
        value={<Switch size="sm" checked={autoAccept} onCheckedChange={setAutoAccept} aria-label="Auto Accept" />}
      />
      <GovernanceRow
        label="Ringtone"
        visible={ringtoneVisible}
        onVisibleChange={setRingtoneVisible}
        governance={ringtoneGov}
        onGovernanceChange={setRingtoneGov}
        value={
          <>
            <Select options={RINGTONE_OPTIONS} value={ringtone} onValueChange={setRingtone} className="w-full" />
            <TonePreviewButton tone={ringtone} ariaLabel="Preview Ringtone" />
          </>
        }
      />
      <GovernanceRow
        label="Secondary Ringer Device"
        visible={secondaryDeviceVisible}
        onVisibleChange={setSecondaryDeviceVisible}
        governance={secondaryDeviceGov}
        onGovernanceChange={setSecondaryDeviceGov}
        value={
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
        visible={secondaryDelayVisible}
        onVisibleChange={setSecondaryDelayVisible}
        governance={secondaryDelayGov}
        onGovernanceChange={setSecondaryDelayGov}
        value={
          <Select
            options={SECONDARY_DELAY_OPTIONS}
            value={secondaryDelay}
            onValueChange={setSecondaryDelay}
            className="w-full"
          />
        }
      />
      {/* Mic/Speaker Noise Cancellation's Value column holds two controls
       * bundled together: the on/off Switch is the setting's actual value,
       * and the Sensitivity Slider is a dependent second value that only
       * means anything once that Switch is on — so the Slider disables off
       * its own Switch, same as the real app (verified live), regardless
       * of Visibility or Agent Access. */}
      <GovernanceRow
        label="Microphone Noise Cancellation"
        visible={micNoiseCancelVisible}
        onVisibleChange={setMicNoiseCancelVisible}
        governance={micNoiseCancelGov}
        onGovernanceChange={setMicNoiseCancelGov}
        value={
          <>
            <Switch size="sm" checked={micNoiseCancel} onCheckedChange={setMicNoiseCancel} aria-label="Microphone Noise Cancellation" />
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
          </>
        }
      />
      <GovernanceRow
        label="Speaker Noise Cancellation"
        visible={speakerNoiseCancelVisible}
        onVisibleChange={setSpeakerNoiseCancelVisible}
        governance={speakerNoiseCancelGov}
        onGovernanceChange={setSpeakerNoiseCancelGov}
        value={
          <>
            <Switch size="sm" checked={speakerNoiseCancel} onCheckedChange={setSpeakerNoiseCancel} aria-label="Speaker Noise Cancellation" />
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
          </>
        }
      />
      <GovernanceRow
        label="Jabra Call Control"
        visible={jabraVisible}
        onVisibleChange={setJabraVisible}
        governance={jabraGov}
        onGovernanceChange={setJabraGov}
        value={
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
  /* Whether a given event even makes a sound/visual at all is a
   * Component Enabled question, not a Value — it gates the Tone picker
   * below it (Audio) or is the entire row (Visual), same shape as Mic/
   * Speaker Noise Cancellation's on/off gating its Sensitivity slider.
   * Value holds only what's left once the row is enabled: the Tone
   * choice for Audio, nothing at all for Visual. */
  const [audioEnabled, setAudioEnabled] = useState<Record<string, boolean>>({
    "new-agent-message": true,
    "new-voice-call": true,
    "new-contact": true,
    "new-contact-reply": true,
    "end-chat-or-call": true,
  });
  const [audioVisible, setAudioVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_EVENTS.map((e) => [e.key, true]))
  );
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

  const [visualEnabled, setVisualEnabled] = useState<Record<string, boolean>>({
    "new-agent-message": true,
    "new-voice-call": true,
    "new-contact": true,
    "new-contact-reply": true,
    "end-chat-or-call": true,
  });
  const [visualVisible, setVisualVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_EVENTS.map((e) => [e.key, true]))
  );
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
          componentEnabled={audioEnabled[evt.key]}
          onComponentEnabledChange={(v) => setAudioEnabled((p) => ({ ...p, [evt.key]: v }))}
          visible={audioVisible[evt.key]}
          onVisibleChange={(v) => setAudioVisible((p) => ({ ...p, [evt.key]: v }))}
          governance={audioGov[evt.key]}
          onGovernanceChange={(v) => setAudioGov((p) => ({ ...p, [evt.key]: v }))}
          value={
            <>
              <Select
                options={TONE_OPTIONS}
                value={audioTone[evt.key]}
                onValueChange={(v) => setAudioTone((p) => ({ ...p, [evt.key]: v }))}
                className="w-full"
                disabled={!audioEnabled[evt.key]}
                aria-label={`${evt.label} tone`}
              />
              <TonePreviewButton
                tone={audioTone[evt.key]}
                ariaLabel={`Preview ${evt.label} tone`}
                disabled={!audioEnabled[evt.key]}
              />
            </>
          }
        />
      ))}
      <SubGroupLabel>Visual Notifications</SubGroupLabel>
      {NOTIFICATION_EVENTS.map((evt) => (
        <GovernanceRow
          key={evt.key}
          label={evt.label}
          componentEnabled={visualEnabled[evt.key]}
          onComponentEnabledChange={(v) => setVisualEnabled((p) => ({ ...p, [evt.key]: v }))}
          visible={visualVisible[evt.key]}
          onVisibleChange={(v) => setVisualVisible((p) => ({ ...p, [evt.key]: v }))}
          governance={visualGov[evt.key]}
          onGovernanceChange={(v) => setVisualGov((p) => ({ ...p, [evt.key]: v }))}
        />
      ))}
    </div>
  );
}

/* ── Sub-tab 3: Display & Keyboard ── */
export function DisplayKeyboardTab() {
  const [twentyFourHourVisible, setTwentyFourHourVisible] = useState(true);
  const [twentyFourHour, setTwentyFourHour] = useState(false);
  const [twentyFourHourGov, setTwentyFourHourGov] = useState<Governance>("editable");

  /* The only 2 rows on the whole page with a real Component Enabled
   * question — "Panel Open in Browser" is an optional capability that
   * may not be part of a given profile at all, unlike everything else on
   * this page, which is a core built-in preference that's always
   * present. Component Enabled off disables Visibility, Value, and
   * Agent Access together (see the model note up top). */
  const [panelGeneralEnabled, setPanelGeneralEnabled] = useState(true);
  const [panelGeneralVisible, setPanelGeneralVisible] = useState(true);
  const [panelGeneral, setPanelGeneral] = useState(false);
  const [panelGeneralGov, setPanelGeneralGov] = useState<Governance>("editable");

  const [panelPageActionEnabled, setPanelPageActionEnabled] = useState(true);
  const [panelPageActionVisible, setPanelPageActionVisible] = useState(true);
  const [panelPageAction, setPanelPageAction] = useState(true);
  const [panelPageActionGov, setPanelPageActionGov] = useState<Governance>("editable");

  const [sortOrderVisible, setSortOrderVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState("oldest-newest");
  const [sortOrderGov, setSortOrderGov] = useState<Governance>("editable");

  const [sendWithEnterVisible, setSendWithEnterVisible] = useState(true);
  const [sendWithEnter, setSendWithEnter] = useState("all-except-email");
  const [sendWithEnterGov, setSendWithEnterGov] = useState<Governance>("editable");

  return (
    <>
      <div className="rounded-b-lyra-sm border border-lyra-border-subtle">
        <GovernanceTableHeader />
        <GovernanceRow
          label="24 Hour Time"
          visible={twentyFourHourVisible}
          onVisibleChange={setTwentyFourHourVisible}
          governance={twentyFourHourGov}
          onGovernanceChange={setTwentyFourHourGov}
          value={<Switch size="sm" checked={twentyFourHour} onCheckedChange={setTwentyFourHour} aria-label="24 Hour Time" />}
        />
        <GovernanceRow
          label="Panel Open in Browser: General"
          componentEnabled={panelGeneralEnabled}
          onComponentEnabledChange={setPanelGeneralEnabled}
          visible={panelGeneralVisible}
          onVisibleChange={setPanelGeneralVisible}
          governance={panelGeneralGov}
          onGovernanceChange={setPanelGeneralGov}
          value={
            <Switch
              size="sm"
              checked={panelGeneral}
              onCheckedChange={setPanelGeneral}
              disabled={!panelGeneralEnabled}
              aria-label="Panel Open in Browser: General — value"
            />
          }
        />
        <GovernanceRow
          label="Panel Open in Browser: Page Action Only"
          componentEnabled={panelPageActionEnabled}
          onComponentEnabledChange={setPanelPageActionEnabled}
          visible={panelPageActionVisible}
          onVisibleChange={setPanelPageActionVisible}
          governance={panelPageActionGov}
          onGovernanceChange={setPanelPageActionGov}
          value={
            <Switch
              size="sm"
              checked={panelPageAction}
              onCheckedChange={setPanelPageAction}
              disabled={!panelPageActionEnabled}
              aria-label="Panel Open in Browser: Page Action Only — value"
            />
          }
        />
        <GovernanceRow
          label="Email Message Sort Order"
          visible={sortOrderVisible}
          onVisibleChange={setSortOrderVisible}
          governance={sortOrderGov}
          onGovernanceChange={setSortOrderGov}
          value={
            <Select options={SORT_ORDER_OPTIONS} value={sortOrder} onValueChange={setSortOrder} className="w-full" />
          }
        />
        <GovernanceRow
          label="Send with Enter"
          visible={sendWithEnterVisible}
          onVisibleChange={setSendWithEnterVisible}
          governance={sendWithEnterGov}
          onGovernanceChange={setSendWithEnterGov}
          value={
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
