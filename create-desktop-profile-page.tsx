import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { ArrowDown, ArrowUp, Box, CheckCircle2, ChevronDown, ChevronRight, GripVertical, MinusCircle, Trash2, X } from "lucide-react";
import {
  cn,
  AdminShell,
  Button,
  Input,
  TabList,
  Tab,
  TabPanel,
  Switch,
  Select,
  Checkbox,
  SearchInput,
  ContentArea,
  AiIcon,
  Chip,
  Tooltip,
  type SelectOption,
  type TreeMenuItem,
} from "../lyra-ui/src";
import { ToggleChip, ToggleChipGroup, type ToggleChipOption } from "./toggle-chip";
import {
  LoginVoicePreferencesTab,
  AVNotificationsTab,
  DisplayKeyboardTab,
} from "./settings-page-tile";
import { AppShellHeader } from "./app-header";

/* ── Sample data — matches the "Create Desktop Profile" Figma frame,
 * reconciled against the real production page at
 * na1.nice-incontact.com/apps/#/desktop-profiles/profiles/create for the
 * "product demo reference" build (see `DesktopProfilesDemo`): the
 * Conversations app toggle, the Skills Directory App option and singular
 * "Standard Address Book" label, and the "Defined by agent" default
 * screen size were all added to match what that page actually ships. ── */

/* Keys for the 3 rows flagged in the "agent-drafted profile" preview —
 * see `aiDraftPreview` in `CreateDesktopProfilePage`. Exported so a
 * caller (e.g. `ReviewQueuePage`, via `DesktopProfilesDemo`) can deep-link
 * straight to one of these flagged rows via `initialFocusItem`. */
export type ReviewItemKey = "queue-counter" | "outbound-calling" | "directory-app";

const NAV_ITEMS: TreeMenuItem[] = [
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "Desktop Profiles", active: true },
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "Configurations" },
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "ACS Onboarding" },
];

const AGENT_VERSION_OPTIONS: SelectOption[] = [
  { value: "current", label: "Current" },
  { value: "previous", label: "Previous" },
];

const SCREEN_SIZE_OPTIONS: SelectOption[] = [
  { value: "defined-by-agent", label: "Defined by agent" },
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
  { value: "skills", label: "Skills" },
  { value: "teams", label: "Teams" },
  { value: "standard-address-book", label: "Standard Address Book" },
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
  { key: "conversations", label: "Internal Chat" },
];

/* ── Assigned Teams — sample directory of real-looking teams (names
 * mirror the actual production "Add Team" picker), plus one standing in
 * for the new-hire cohort this whole demo is about. Assignment only
 * becomes possible once a profile exists (mode === "edit"), matching the
 * real app: the Create page has no Assigned Teams tab at all. ── */
interface TeamRow {
  id: string;
  name: string;
  assignedUsers: number;
  status: "active" | "inactive";
}

export const AVAILABLE_TEAMS: TeamRow[] = [
  { id: "auto-attendant", name: "Auto Attendant", assignedUsers: 0, status: "active" },
  { id: "cxone-agent-team", name: "CXone Agent Team", assignedUsers: 13, status: "active" },
  { id: "default-team", name: "DefaultTeam", assignedUsers: 85, status: "active" },
  { id: "others-team", name: "Others Team", assignedUsers: 1, status: "active" },
  { id: "sfa-team", name: "SFA Team", assignedUsers: 8, status: "active" },
  { id: "test-cxa-team", name: "Test CXA team", assignedUsers: 0, status: "active" },
  { id: "ppe-agent-team", name: "PPE - Agent", assignedUsers: 5, status: "active" },
  { id: "new-hire-training-team", name: "New Hire Training Team", assignedUsers: 12, status: "active" },
];

/* ── Page chrome ──
 * Outer shell (AppShellHeader) migrated from the `lyra-ux-templates-main`
 * reference app — see app-header.tsx for the source pattern. The left
 * icon rail (AppShellSidebar / app-sidebar.tsx) from that same template
 * was tried here too but removed — it's not relevant for this build,
 * since AdminShell's own inner tree already covers navigation for this
 * app. In a real consuming app this header chrome is supplied once and
 * shared across every page. */

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
 *
 * `reviewBadge` and `highlighted` are optional, used only by the
 * "agent-drafted profile" preview (see `ReviewBadge` / `aiDraftPreview`
 * below) to flag the handful of rows an AI agent drafting this profile
 * couldn't confidently set alone. Forwards its ref so that preview can
 * scroll a flagged row into view from the summary banner's jump links.
 */
const SettingsFieldRow = React.forwardRef<
  HTMLDivElement,
  {
    label: string;
    children: React.ReactNode;
    align?: "center" | "start";
    reviewBadge?: React.ReactNode;
    highlighted?: boolean;
  }
>(({ label, children, align = "center", reviewBadge, highlighted }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex gap-6 border-t border-lyra-border-subtle px-4 py-3 first:border-t-0",
        align === "center" ? "items-center" : "items-start",
        highlighted && "bg-lyra-bg-active-subtle ring-1 ring-inset ring-lyra-border-active"
      )}
    >
      <span className="flex w-[220px] flex-shrink-0 items-center gap-2 text-[14px] font-bold leading-5 text-lyra-fg-default">
        {label}
        {reviewBadge}
      </span>
      <div className="flex flex-1 items-center">{children}</div>
    </div>
  );
});
SettingsFieldRow.displayName = "SettingsFieldRow";

/* ── A row that links into a whole other page's worth of settings,
 * instead of holding a single show/hide flag like every other row in
 * this table. Still not a `SettingsFieldRow` + trailing control — the
 * whole row stays the click target (Dave's call, kept from the earlier
 * version) — but it now shares `SettingsFieldRow`'s exact two-column
 * shape (fixed label column, flex-1 second column) instead of stacking
 * label+caption inside column one, so it reads as one row among the
 * Apps table's other rows rather than a taller, differently-shaped one.
 * The description is left as plain secondary text, not link-styled —
 * with the whole row already clickable, underlining just the caption
 * would suggest only that part responds to a click.
 *
 * The "there's something to click here" signal is a small, muted
 * chevron sitting right next to the label instead of pinned to the
 * row's far edge (where it used to live, and read as disconnected from
 * the label it was meant to reinforce) — anchoring it to the label ties
 * the cue to the one piece of text every glance at the row lands on
 * first.
 *
 * Currently used for one row (Agent Settings Page), pinned first in the
 * Apps list so it doesn't get lost after nine toggle rows. The shape is
 * its own component rather than folded into `SettingsFieldRow` so more
 * pages can get the same treatment later without another one-off — see
 * Dave's framing: "a future where all pages are listed... to reveal more
 * detailed settings beyond just show/hide." */
function AppsPageLinkRow({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-6 border-t border-lyra-border-subtle px-4 py-3 text-left first:border-t-0 hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lyra-border-focus"
    >
      <span className="flex w-[220px] flex-shrink-0 items-center gap-1 text-[14px] font-bold leading-5 text-lyra-fg-default">
        {label}
        <ChevronRight className="h-3 w-3 text-lyra-fg-disabled" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="lyra-body-sm flex-1 text-lyra-fg-secondary">{description}</span>
    </button>
  );
}

/* AW-61857, rev. 2 — Dave's call: scale the first pass back. The Apps
 * rows above go back to plain toggle rows (no grip, no arrows, no
 * header caption) — reordering doesn't live there anymore. Instead one
 * collapsed-by-default accordion row, "Navigation Ordering", sits at
 * the bottom of the Apps list: its title and the "Agent Editable" chip
 * are always visible; expanding it reveals Left Navigation Order and
 * App Space Order as two independent small lists, each still
 * drag-or-arrow reorderable — the same interaction as before, just
 * relocated and, at 12px/11px, considerably more compact. Only one
 * "Agent Editable" chip governs both lists together (Dave's sketch
 * shows one chip, not two). `page-order-editor.tsx` remains untouched
 * and unused, same as the first pass. */

interface OrderListItem {
  key: string;
  label: string;
}

/** Left Nav has no existing data model anywhere in this prototype (App
 * Space already had `APPS`) — real item names per Dave's call, matching
 * his reference Agent Workspace rail screenshot. "Help" is 9th on
 * purpose, landing in More by default, so the shown/more cutoff below
 * has something to actually demonstrate rather than sitting empty at
 * exactly 8 of 8. */
const LEFT_NAV_ITEMS: OrderListItem[] = [
  { key: "nav-history", label: "History" },
  { key: "nav-search", label: "Search" },
  { key: "nav-queue", label: "Queue" },
  { key: "nav-directory", label: "Directory" },
  { key: "nav-calendar", label: "Calendar" },
  { key: "nav-desk", label: "Desk" },
  { key: "nav-library", label: "Library" },
  { key: "nav-settings", label: "Settings" },
  { key: "nav-help", label: "Help" },
];

/** How many items a rail/tab-strip can show before the rest fall into
 * its "···" overflow menu — used for both lists below. Matches
 * `RAIL_CAPACITY` in page-order-editor.tsx (kept as its own constant so
 * this section has no dependency on that now-unused file). */
const APP_RAIL_CAPACITY = 8;

/** Keyboard-reachable up/down reordering — visible at rest rather than
 * hidden behind hover, so it isn't mouse-only. */
function AppMoveButton({
  direction,
  disabled,
  onMove,
}: {
  direction: "up" | "down";
  disabled: boolean;
  onMove: () => void;
}) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  const label = direction === "up" ? "Move up" : "Move down";
  return (
    <Tooltip content={label} placement="top" asLabel disabled={disabled}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onMove();
        }}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-lyra-xs border transition-colors",
          disabled
            ? "cursor-not-allowed border-transparent text-lyra-fg-disabled"
            : "border-lyra-border-subtle text-lyra-fg-secondary hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
        )}
      >
        <Icon className="h-2.5 w-2.5" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

/** One of the two independent lists inside the expanded "Navigation
 * Ordering" row. `items` is already the caller's fully-filtered,
 * ordered list — an app that's off/hidden is never passed in at all
 * (see the App Space Order filter below), not just dimmed, so there's
 * nothing here to distinguish "off" from "not in this list." */
function MiniOrderList({
  title,
  items,
  draggingKey,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onMoveUp,
  onMoveDown,
}: {
  title: string;
  items: OrderListItem[];
  draggingKey: string | null;
  onDragStart: (key: string) => void;
  onDragEnter: (key: string) => void;
  onDragEnd: () => void;
  onMoveUp: (key: string) => void;
  onMoveDown: (key: string) => void;
}) {
  return (
    <div className="flex-1 rounded-lyra-sm border border-lyra-border-subtle">
      <div className="flex items-center gap-1 border-b border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-3 py-1.5 text-[13px] font-bold leading-5 text-lyra-fg-default">
        {title}
        <ChevronRight className="h-3 w-3 text-lyra-fg-disabled" strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="flex flex-col">
        {items.map((item, index) => (
          <React.Fragment key={item.key}>
            {index === APP_RAIL_CAPACITY && (
              <div className="border-t border-lyra-border-subtle border-b border-b-lyra-border-strong px-3 py-1 text-[11px] italic leading-4 text-lyra-fg-disabled">
                More ellipsis
              </div>
            )}
            <div
              draggable
              onDragStart={() => onDragStart(item.key)}
              onDragEnter={() => onDragEnter(item.key)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                "flex items-center gap-1.5 border-t border-lyra-border-subtle px-3 py-1.5 text-[12px] leading-4 text-lyra-fg-default first:border-t-0",
                draggingKey === item.key && "opacity-40"
              )}
            >
              <GripVertical
                className="h-3 w-3 shrink-0 cursor-grab text-lyra-fg-disabled active:cursor-grabbing"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span className="flex-1 truncate">{item.label}</span>
              <div className="flex items-center gap-0.5">
                <AppMoveButton direction="up" disabled={index === 0} onMove={() => onMoveUp(item.key)} />
                <AppMoveButton
                  direction="down"
                  disabled={index === items.length - 1}
                  onMove={() => onMoveDown(item.key)}
                />
              </div>
            </div>
          </React.Fragment>
        ))}
        {items.length === 0 && (
          <div className="px-3 py-2 text-[12px] text-lyra-fg-disabled">Nothing turned on yet.</div>
        )}
      </div>
    </div>
  );
}

/** The accordion itself: collapsed to one row (title + the shared
 * "Agent Editable" chip, both always visible) until clicked open. The
 * chip sits in a click-stopping wrapper so tapping it toggles agent
 * editability without also collapsing/expanding the row underneath it. */
function NavigationOrderingRow({
  expanded,
  onToggleExpanded,
  agentEditable,
  onToggleAgentEditable,
  leftNavItems,
  appSpaceItems,
  draggingKey,
  onDragStart,
  onDragEnd,
  onNavDragEnter,
  onAppSpaceDragEnter,
  onNavMoveUp,
  onNavMoveDown,
  onAppSpaceMoveUp,
  onAppSpaceMoveDown,
}: {
  expanded: boolean;
  onToggleExpanded: () => void;
  agentEditable: boolean;
  onToggleAgentEditable: () => void;
  leftNavItems: OrderListItem[];
  appSpaceItems: OrderListItem[];
  draggingKey: string | null;
  onDragStart: (list: "nav" | "app", key: string) => void;
  onDragEnd: () => void;
  onNavDragEnter: (key: string) => void;
  onAppSpaceDragEnter: (key: string) => void;
  onNavMoveUp: (key: string) => void;
  onNavMoveDown: (key: string) => void;
  onAppSpaceMoveUp: (key: string) => void;
  onAppSpaceMoveDown: (key: string) => void;
}) {
  const ChevronIcon = expanded ? ChevronDown : ChevronRight;
  return (
    <div className="border-t border-lyra-border-subtle">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpanded}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpanded();
          }
        }}
        aria-expanded={expanded}
        className="flex cursor-pointer items-center gap-6 px-4 py-3 hover:bg-lyra-state-hover"
      >
        <span className="flex w-[220px] flex-shrink-0 items-center gap-1.5 text-[14px] font-bold leading-5 text-lyra-fg-default">
          <ChevronIcon className="h-3.5 w-3.5 shrink-0 text-lyra-fg-disabled" strokeWidth={2} aria-hidden="true" />
          Navigation Ordering
        </span>
        <div className="flex flex-1 items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <ToggleChip label="Agent Editable" selected={agentEditable} onToggle={onToggleAgentEditable} />
        </div>
      </div>
      {expanded && (
        <div className="flex gap-4 px-4 pb-4">
          <MiniOrderList
            title="Left Navigation Order"
            items={leftNavItems}
            draggingKey={draggingKey}
            onDragStart={(key) => onDragStart("nav", key)}
            onDragEnter={onNavDragEnter}
            onDragEnd={onDragEnd}
            onMoveUp={onNavMoveUp}
            onMoveDown={onNavMoveDown}
          />
          <MiniOrderList
            title="App Space Order"
            items={appSpaceItems}
            draggingKey={draggingKey}
            onDragStart={(key) => onDragStart("app", key)}
            onDragEnter={onAppSpaceDragEnter}
            onDragEnd={onDragEnd}
            onMoveUp={onAppSpaceMoveUp}
            onMoveDown={onAppSpaceMoveDown}
          />
        </div>
      )}
    </div>
  );
}

/* ── Small "needs review" flag for a row an AI agent drafted but
 * couldn't confidently finish alone — see the `aiDraftPreview` toggle in
 * `CreateDesktopProfilePage` below. `title` carries the specific reason,
 * shown on hover, so the badge means something more than just "unsure." */
function ReviewBadge({ note }: { note: string }) {
  return (
    <span title={note}>
      <Chip
        color="orange"
        variant="subtle"
        className="px-1.5 py-0 text-[10px] font-semibold uppercase leading-4 tracking-wide"
      >
        Needs review
      </Chip>
    </span>
  );
}

/* ── Small Active/Inactive status cell, shared by the Assigned Teams
 * table here and by DesktopProfilesListPage — mirrors the real app's
 * green-check / gray-dash treatment. ── */
function StatusCell({ status }: { status: "active" | "inactive" }) {
  return status === "active" ? (
    <span className="inline-flex items-center gap-1.5 text-lyra-fg-default">
      <CheckCircle2 className="h-4 w-4 text-lyra-status-success-strong" strokeWidth={1.5} />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-lyra-fg-secondary">
      <MinusCircle className="h-4 w-4 text-lyra-fg-disabled" strokeWidth={1.5} />
      Inactive
    </span>
  );
}

/* ── "Add Team" modal — mirrors the real production picker: searchable
 * list of teams, multi-select via checkbox, Cancel/Confirm. The New Hire
 * Training Team row is highlighted since it's the one this demo's story
 * is about ("an admin has uploaded a group of new hires..."). ── */
function AddTeamModal({
  open,
  excludeIds,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  excludeIds: string[];
  onCancel: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelected([]);
    }
  }, [open]);

  if (!open) return null;

  const candidates = AVAILABLE_TEAMS.filter(
    (t) => !excludeIds.includes(t.id) && t.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[80vh] w-[640px] flex-col rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-lyra-border-subtle px-5 py-4">
          <span className="text-[16px] font-bold leading-6 text-lyra-fg-default">Add Team</span>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="flex h-6 w-6 items-center justify-center rounded-lyra-xs text-lyra-fg-secondary hover:text-lyra-fg-default"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex items-center gap-3 border-b border-lyra-border-subtle px-5 py-3">
          <span className="lyra-body-sm text-lyra-fg-secondary">{candidates.length} Teams</span>
          <span className="lyra-body-sm text-lyra-fg-secondary">·</span>
          <span className="lyra-body-sm text-lyra-fg-secondary">{selected.length} Selected</span>
          <SearchInput
            aria-label="Search for Teams"
            placeholder="Search for Teams"
            value={search}
            onValueChange={setSearch}
            className="ml-auto w-[220px]"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="lyra-label flex gap-4 border-b border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-5 py-2 text-lyra-fg-secondary">
            <span className="w-5" />
            <span className="flex-1">Name</span>
            <span className="w-[120px]">Assigned Users</span>
          </div>
          {candidates.map((t) => {
            const isNewHireTeam = t.id === "new-hire-training-team";
            return (
              <label
                key={t.id}
                className={cn(
                  "flex cursor-pointer items-center gap-4 border-b border-lyra-border-subtle px-5 py-2.5 last:border-b-0 hover:bg-lyra-state-hover",
                  isNewHireTeam && "bg-lyra-bg-active-subtle"
                )}
              >
                <Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggle(t.id)} />
                <span className="flex flex-1 items-center gap-2 text-[14px] text-lyra-fg-default">
                  {t.name}
                  {isNewHireTeam && (
                    <Chip
                      color="orange"
                      variant="subtle"
                      className="px-1.5 py-0 text-[10px] font-semibold uppercase leading-4 tracking-wide"
                    >
                      Uploaded this week
                    </Chip>
                  )}
                </span>
                <span className="w-[120px] text-[14px] text-lyra-fg-default">{t.assignedUsers}</span>
              </label>
            );
          })}
          {candidates.length === 0 && (
            <div className="px-5 py-8 text-center text-[14px] text-lyra-fg-secondary">
              No teams match your search.
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-lyra-border-subtle px-5 py-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={selected.length === 0} onClick={() => onConfirm(selected)}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CreateDesktopProfilePageProps {
  /**
   * "create" (default) mirrors the real Create page: no Assigned Teams
   * tab yet (a profile can't have teams before it exists), and the page
   * actions are the AI-draft toggle + Cancel/Create. "edit" mirrors the
   * real Update page reached from the list: Assigned Teams becomes
   * available, and page actions are just Cancel/Save.
   */
  mode?: "create" | "edit";
  /** Assigned team ids to seed an "edit" instance with. */
  initialAssignedTeamIds?: string[];
  onCreate?: (profile: { name: string; description: string }) => void;
  onCancel?: () => void;
  onSave?: () => void;
  /** Fires whenever the assigned-teams set changes, so a parent list view can keep its "Assigned Teams" count in sync. */
  onTeamsChange?: (teamIds: string[]) => void;
  /** Overrides the left nav tree — lets a caller (e.g. `DesktopProfilesDemo`) inject shared, wired-up nav items instead of this file's static default. */
  navItems?: TreeMenuItem[];
  /** Which outer tab to land on — used to deep-link here (e.g. from the Review Queue) straight to a specific surface instead of always starting on Settings. */
  initialTab?: "settings" | "teams" | "settings-page";
  /** Which Agent Settings Page inner tab to land on, when `initialTab` is "settings-page". */
  initialSettingsPageInnerTab?: "login-voice" | "av-notifications" | "display-keyboard";
  /** Scrolls to and highlights one of the 3 AI-flagged rows on mount — the same jump the in-page review banner's chips perform, reachable from outside the page (e.g. the Review Queue). Only meaningful in "create" mode, where those rows exist. */
  initialFocusItem?: ReviewItemKey;
  /**
   * Shows the "Agent-drafted profile" banner (+ the 3 flagged-row
   * highlights) on mount. Only meaningful in "create" mode. This page no
   * longer decides that for itself — a fresh "New Desktop Profile" click
   * should land on a plain, empty form, not an AI overlay the admin never
   * asked for. The caller (`DesktopProfilesDemo`) passes `true` only for
   * the two entry points that are actually reviewing an AI draft: a
   * Review Queue item (which also sets `initialFocusItem`) or the AI
   * Assistant's "create a profile" action. Defaults to `false`.
   */
  showAiDraftPreview?: boolean;
  /** Opens the docked AI Assistant panel (owned by `DesktopProfilesDemo`, shared across every screen) — renders an "Ask AI" page action when provided. */
  onOpenAssistant?: () => void;
}

export function CreateDesktopProfilePage({
  mode = "create",
  initialAssignedTeamIds = [],
  onCreate,
  onCancel,
  onSave,
  onTeamsChange,
  navItems = NAV_ITEMS,
  initialTab = "settings",
  initialSettingsPageInnerTab = "login-voice",
  initialFocusItem,
  showAiDraftPreview = false,
  onOpenAssistant,
}: CreateDesktopProfilePageProps) {
  const [tab, setTab] = useState<"settings" | "teams" | "settings-page">(initialTab);
  const [settingsPageInnerTab, setSettingsPageInnerTab] = useState<
    "login-voice" | "av-notifications" | "display-keyboard"
  >(initialSettingsPageInnerTab);

  /* Defaults reflect this build's one demo scenario — an AI agent
   * drafting a profile for a newly-uploaded new-hire cohort (see
   * `DesktopProfilesDemo`) — rather than a blank form, since that's what
   * this page now exists to preview. */
  const [profileName, setProfileName] = useState("New Employee Training");
  const [description, setDescription] = useState(
    "Onboarding profile for the new-hire training cohort uploaded to Team Management this week."
  );

  const [apps, setApps] = useState<Record<string, boolean>>({
    search: true,
    "contact-history": true,
    "queue-counter": true,
    schedule: true,
    wem: false,
    launch: true,
    "custom-workspace": false,
    reporting: true,
    conversations: true,
  });

  const [agentVersion, setAgentVersion] = useState("current");
  const [screenSize, setScreenSize] = useState("defined-by-agent");
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
  const [unassignDismissAssignments, setUnassignDismissAssignments] = useState(true);
  const [digitalContactPreview, setDigitalContactPreview] = useState("enabled-with-send");

  /* ── Planned — 27.1 (design direction, not yet spec'd) ──
   * AW-61903, AW-61857, AW-60819 — all still status "New" with functional
   * requirements marked [TBD] in Jira. Defaults below reflect each
   * capability's stated "today's default behavior", not a finalized spec. */
  const [typingIndicators, setTypingIndicators] = useState(true);
  const [quickBarAgentCustomization, setQuickBarAgentCustomization] = useState(true);
  const [screenPopAlwaysStealFocus, setScreenPopAlwaysStealFocus] = useState(false);

  /* AW-61857, rev. 2 — order lives in the "Navigation Ordering"
   * accordion at the bottom of Apps (see `NavigationOrderingRow`
   * above), not on the Apps rows themselves. Left Nav and App Space
   * order independently; a single shared drag-state tags which list is
   * mid-drag, since only one list is ever being dragged at a time. */
  const [navOrderingExpanded, setNavOrderingExpanded] = useState(false);
  const [leftNavOrder, setLeftNavOrder] = useState<string[]>(() => LEFT_NAV_ITEMS.map((i) => i.key));
  const [appSpaceOrder, setAppSpaceOrder] = useState<string[]>(() => APPS.map((app) => app.key));
  const [orderDrag, setOrderDrag] = useState<{ list: "nav" | "app"; key: string } | null>(null);

  function swapAdjacent(order: string[], key: string, direction: "up" | "down"): string[] {
    const idx = order.indexOf(key);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= order.length) return order;
    const next = [...order];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    return next;
  }

  function reorderTo(order: string[], draggedKey: string, overKey: string): string[] {
    const next = order.filter((k) => k !== draggedKey);
    next.splice(next.indexOf(overKey), 0, draggedKey);
    return next;
  }

  function moveNavItem(key: string, direction: "up" | "down") {
    setLeftNavOrder((prev) => swapAdjacent(prev, key, direction));
  }
  function moveAppSpaceItem(key: string, direction: "up" | "down") {
    setAppSpaceOrder((prev) => swapAdjacent(prev, key, direction));
  }
  /* Reorders live as the dragged row passes over another one, rather
   * than waiting for a drop — one less event to wire up. */
  function dragNavOver(overKey: string) {
    if (orderDrag?.list !== "nav" || orderDrag.key === overKey) return;
    setLeftNavOrder((prev) => reorderTo(prev, orderDrag.key, overKey));
  }
  function dragAppSpaceOver(overKey: string) {
    if (orderDrag?.list !== "app" || orderDrag.key === overKey) return;
    setAppSpaceOrder((prev) => reorderTo(prev, orderDrag.key, overKey));
  }

  const leftNavItems = leftNavOrder.map((key) => LEFT_NAV_ITEMS.find((i) => i.key === key)!);
  // Dave's call: an app that's off/hidden doesn't appear in this list at
  // all, not just dimmed — its slot in `appSpaceOrder` is kept, though,
  // so re-enabling it restores wherever it was left.
  const appSpaceItems = appSpaceOrder
    .filter((key) => apps[key])
    .map((key) => APPS.find((app) => app.key === key)!);

  /* ── "Agent-drafted profile" preview ──
   * A sketch of what this screen looks like when it's showing a profile an
   * AI agent (working from an uploaded new-hire roster elsewhere in the
   * app) actually drafted: most fields set with high confidence, a handful
   * flagged because they're real policy calls only a human admin should
   * make (does this training cohort get live Queue Counter access yet,
   * which Outbound Calling actions, how wide a Directory scope).
   *
   * Driven entirely by the `showAiDraftPreview` prop now, not a button on
   * this page — a fresh "New Desktop Profile" click should show a plain
   * empty form, since nothing has drafted anything yet. The banner only
   * has a reason to exist when the admin is actually reviewing something
   * the agent already produced, i.e. arrived here via a Review Queue item
   * or the AI Assistant's "create a profile" action — both set
   * `showAiDraftPreview`/`initialFocusItem` from outside (see
   * `DesktopProfilesDemo`). "edit" mode never shows it. */
  const aiDraftPreview = mode === "create" && showAiDraftPreview;
  const [pendingReviewJump, setPendingReviewJump] = useState<ReviewItemKey | null>(initialFocusItem ?? null);

  const queueCounterRowRef = useRef<HTMLDivElement>(null);
  const outboundCallingRowRef = useRef<HTMLDivElement>(null);
  const directoryAppRowRef = useRef<HTMLDivElement>(null);

  const reviewItemRefs: Record<ReviewItemKey, React.RefObject<HTMLDivElement | null>> = {
    "queue-counter": queueCounterRowRef,
    "outbound-calling": outboundCallingRowRef,
    "directory-app": directoryAppRowRef,
  };

  function jumpToReviewItem(key: ReviewItemKey) {
    setPendingReviewJump(key);
    setTab("settings");
  }

  // Runs after the "settings" tab has actually mounted (TabPanel unmounts
  // inactive tabs entirely), so the target row's ref is guaranteed to
  // exist by the time this scrolls to it — whether or not a tab switch
  // was needed to get there.
  useEffect(() => {
    if (!pendingReviewJump || tab !== "settings") return;
    reviewItemRefs[pendingReviewJump].current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setPendingReviewJump(null);
  }, [pendingReviewJump, tab]);

  /* ── Assigned Teams (edit mode only) ── */
  const [assignedTeamIds, setAssignedTeamIds] = useState<string[]>(initialAssignedTeamIds);
  const [teamsSearch, setTeamsSearch] = useState("");
  const [selectedForRemoval, setSelectedForRemoval] = useState<string[]>([]);
  const [addTeamOpen, setAddTeamOpen] = useState(false);

  useEffect(() => {
    onTeamsChange?.(assignedTeamIds);
    // Only the ids themselves matter to a parent tracking the count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedTeamIds]);

  const assignedTeams = assignedTeamIds
    .map((id) => AVAILABLE_TEAMS.find((t) => t.id === id))
    .filter((t): t is TeamRow => !!t)
    .filter((t) => t.name.toLowerCase().includes(teamsSearch.toLowerCase()));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-lyra-bg-surface-shell">
      <AppShellHeader />
      <ContentArea>
          <AdminShell
            storageKeyPrefix="create-desktop-profile-preview"
            navTitle=""
            navItems={navItems}
            defaultLeftPinned
            roundedContent
            showPageHeader
            pageTitle={mode === "edit" ? "Update Desktop Profile" : "Create Desktop Profile"}
            pageBreadcrumb={onCancel ? { label: "Desktop Profiles", onClick: onCancel } : undefined}
            pageActions={
              mode === "edit" ? (
                <>
                  {onOpenAssistant && (
                    <Button variant="outline" className="gap-1.5" onClick={onOpenAssistant}>
                      <AiIcon className="h-4 w-4" />
                      Ask AI
                    </Button>
                  )}
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button onClick={onSave}>Save</Button>
                </>
              ) : (
                <>
                  {onOpenAssistant && (
                    <Button variant="outline" className="gap-1.5" onClick={onOpenAssistant}>
                      <AiIcon className="h-4 w-4" />
                      Ask AI
                    </Button>
                  )}
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button onClick={() => onCreate?.({ name: profileName, description })}>Create</Button>
                </>
              )
            }
          >
            <div className="flex flex-1 flex-col overflow-y-auto">
              {aiDraftPreview && (
                <div className="mx-6 mt-4 flex items-start gap-3 rounded-lyra-md border border-lyra-border-active bg-lyra-bg-active-subtle px-4 py-3">
                  <AiIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div className="flex flex-1 flex-col gap-2">
                    <p className="lyra-body-md-emphasis text-lyra-fg-default">
                      Agent-drafted profile — 3 items need your review
                    </p>
                    <p className="lyra-body-sm max-w-[560px] text-lyra-fg-secondary">
                      Drafted for the "New Employee Training" cohort uploaded in Team
                      Management. Everything else was set with high confidence — these
                      three are policy calls worth a quick look before you create it.
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <button
                        onClick={() => jumpToReviewItem("queue-counter")}
                        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
                      >
                        <Chip color="orange" variant="subtle">Queue Counter access</Chip>
                      </button>
                      <button
                        onClick={() => jumpToReviewItem("outbound-calling")}
                        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
                      >
                        <Chip color="orange" variant="subtle">Outbound Calling permissions</Chip>
                      </button>
                      <button
                        onClick={() => jumpToReviewItem("directory-app")}
                        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
                      >
                        <Chip color="orange" variant="subtle">Directory App scope</Chip>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Hidden while viewing Agent Settings Page — it's no longer a
               * peer tab (see below), so a tab bar with nothing in it
               * active would just be confusing. The breadcrumb inside
               * that panel is the only way in or out of it now. */}
              {tab !== "settings-page" && (
                <TabList className="px-6">
                  <Tab active={tab === "settings"} onClick={() => setTab("settings")}>
                    Settings
                  </Tab>
                  {mode === "edit" && (
                    <Tab active={tab === "teams"} onClick={() => setTab("teams")}>
                      Assigned Teams
                    </Tab>
                  )}
                </TabList>
              )}

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

            {/* ── Apps ──
             * AW-61857, rev. 2 — these rows are plain again (on/off
             * only). Reordering lives in the "Navigation Ordering" row
             * at the bottom of this list instead — see
             * `NavigationOrderingRow` above for why. */}
            <section>
              <SectionHeader>Apps</SectionHeader>
              <div className="flex flex-col rounded-b-lyra-sm border border-lyra-border-subtle">
                <AppsPageLinkRow
                  label="Agent Settings Page"
                  description="3 sections"
                  onClick={() => setTab("settings-page")}
                />
                {APPS.map((app) => {
                  const isReviewItem = aiDraftPreview && app.key === "queue-counter";
                  return (
                    <SettingsFieldRow
                      key={app.key}
                      label={app.label}
                      ref={isReviewItem ? queueCounterRowRef : undefined}
                      highlighted={isReviewItem}
                      reviewBadge={
                        isReviewItem ? (
                          <ReviewBadge note="Trainees may not need live Queue Counter visibility yet — confirm before enabling for this cohort." />
                        ) : undefined
                      }
                    >
                      <Switch
                        size="sm"
                        checked={apps[app.key]}
                        onCheckedChange={(v) => setApps((prev) => ({ ...prev, [app.key]: v }))}
                        aria-label={app.label}
                      />
                    </SettingsFieldRow>
                  );
                })}
                <NavigationOrderingRow
                  expanded={navOrderingExpanded}
                  onToggleExpanded={() => setNavOrderingExpanded((v) => !v)}
                  agentEditable={quickBarAgentCustomization}
                  onToggleAgentEditable={() => setQuickBarAgentCustomization((v) => !v)}
                  leftNavItems={leftNavItems}
                  appSpaceItems={appSpaceItems}
                  draggingKey={orderDrag?.key ?? null}
                  onDragStart={(list, key) => setOrderDrag({ list, key })}
                  onDragEnd={() => setOrderDrag(null)}
                  onNavDragEnter={dragNavOver}
                  onAppSpaceDragEnter={dragAppSpaceOver}
                  onNavMoveUp={(key) => moveNavItem(key, "up")}
                  onNavMoveDown={(key) => moveNavItem(key, "down")}
                  onAppSpaceMoveUp={(key) => moveAppSpaceItem(key, "up")}
                  onAppSpaceMoveDown={(key) => moveAppSpaceItem(key, "down")}
                />
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
                <SettingsFieldRow
                  label="Directory App"
                  align="start"
                  ref={aiDraftPreview ? directoryAppRowRef : undefined}
                  highlighted={aiDraftPreview}
                  reviewBadge={
                    aiDraftPreview ? (
                      <ReviewBadge note="Narrowed to this training team by default — confirm that's the right directory scope for new hires." />
                    ) : undefined
                  }
                >
                  <ToggleChipGroup
                    options={DIRECTORY_APP_OPTIONS}
                    values={directoryApp}
                    onValuesChange={setDirectoryApp}
                  />
                </SettingsFieldRow>
                <SettingsFieldRow
                  label="Outbound Calling"
                  align="start"
                  ref={aiDraftPreview ? outboundCallingRowRef : undefined}
                  highlighted={aiDraftPreview}
                  reviewBadge={
                    aiDraftPreview ? (
                      <ReviewBadge note="Trainees may not be ready for Transfer or Elevation yet — confirm which outbound actions this cohort should have." />
                    ) : undefined
                  }
                >
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
                <SettingsFieldRow label="Unassign & Dismiss Assignments">
                  <Switch
                    size="sm"
                    checked={unassignDismissAssignments}
                    onCheckedChange={setUnassignDismissAssignments}
                    aria-label="Unassign & Dismiss Assignments"
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
                {/* AW-61857's row used to live here: an "Agent Editable"
                 * chip + a "Set page order" button opening a modal. Both
                 * moved up into the Apps section itself — the chip into
                 * that section's header, the ordering into the rows
                 * directly — so there's nothing left to configure from
                 * this section for it. */}
                <SettingsFieldRow label="Agent-to-Patron Typing Indicators">
                  <Switch
                    size="sm"
                    checked={typingIndicators}
                    onCheckedChange={setTypingIndicators}
                    aria-label="Agent-to-Patron Typing Indicators"
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

          {mode === "edit" && (
            <TabPanel active={tab === "teams"} className="flex flex-col gap-4 px-6 py-6">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-bold leading-6 text-lyra-fg-default">
                  {assignedTeamIds.length} Teams
                </span>
                <div className="flex items-center gap-2">
                  <SearchInput
                    aria-label="Search for Teams"
                    placeholder="Search for Teams"
                    value={teamsSearch}
                    onValueChange={setTeamsSearch}
                    className="w-[220px]"
                  />
                  <Button
                    variant="ghost"
                    className="gap-1.5"
                    disabled={selectedForRemoval.length === 0}
                    onClick={() => {
                      setAssignedTeamIds((prev) => prev.filter((id) => !selectedForRemoval.includes(id)));
                      setSelectedForRemoval([]);
                    }}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    Remove Teams
                  </Button>
                  {/* "outline" reads as the secondary action here — Save is
                   * this page's one primary ("default") button, and this
                   * shouldn't compete with it. */}
                  <Button variant="outline" onClick={() => setAddTeamOpen(true)}>
                    Add Teams
                  </Button>
                </div>
              </div>

              <div className="flex flex-col rounded-lyra-sm border border-lyra-border-subtle">
                <div className="lyra-label flex items-center gap-4 border-b border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-4 py-2 text-lyra-fg-secondary">
                  <span className="w-4" />
                  <span className="flex-1">Name</span>
                  <span className="w-[140px]">Assigned Users</span>
                  <span className="w-[100px]">Status</span>
                  <span className="w-[60px] text-right">Action</span>
                </div>
                {assignedTeams.length === 0 ? (
                  <div className="px-4 py-10 text-center text-[14px] text-lyra-fg-secondary">
                    No teams assigned yet. Add the new-hire cohort&apos;s team to give them
                    access to this profile.
                  </div>
                ) : (
                  assignedTeams.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-4 border-t border-lyra-border-subtle px-4 py-2.5 first:border-t-0"
                    >
                      <Checkbox
                        checked={selectedForRemoval.includes(t.id)}
                        onCheckedChange={() =>
                          setSelectedForRemoval((prev) =>
                            prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                          )
                        }
                      />
                      <span className="flex-1 text-[14px] text-lyra-fg-default">{t.name}</span>
                      <span className="w-[140px] text-[14px] text-lyra-fg-default">{t.assignedUsers}</span>
                      <span className="w-[100px] text-[14px]">
                        <StatusCell status={t.status} />
                      </span>
                      <span className="flex w-[60px] justify-end">
                        <button
                          onClick={() => setAssignedTeamIds((prev) => prev.filter((id) => id !== t.id))}
                          aria-label={`Remove ${t.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lyra-xs text-lyra-fg-secondary hover:bg-lyra-state-hover hover:text-lyra-status-critical-strong"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </span>
                    </div>
                  ))
                )}
              </div>

              <AddTeamModal
                open={addTeamOpen}
                excludeIds={assignedTeamIds}
                onCancel={() => setAddTeamOpen(false)}
                onConfirm={(ids) => {
                  setAssignedTeamIds((prev) => [...prev, ...ids]);
                  setAddTeamOpen(false);
                }}
              />
            </TabPanel>
          )}

          {/* ── Agent Settings Page (AW-35954) ──
           * Admin-facing show/hide + lock control over the agent's own
           * Settings app, mirroring that app's 3 real sub-tabs. Reuses the
           * governance components from settings-page-tile.tsx rather than
           * duplicating them, so the two stay in sync.
           *
           * No longer a peer tab next to Settings/Assigned Teams — the
           * only way in is the "Agent Settings Page" row pinned at the
           * top of the Apps grid (see `AppsPageLinkRow` above), so this
           * reads as a page you drill into rather than one more tab among
           * equals. The breadcrumb below (mirrors `PageHeader`'s own
           * "ParentName / Title" pattern, just scoped to this panel
           * instead of the page header) is the only way back. */}
          <TabPanel active={tab === "settings-page"} className="flex flex-col gap-4 px-6 py-6">
            <nav aria-label="Breadcrumb">
              <ol className="m-0 flex list-none items-center gap-2 p-0">
                <li>
                  <button
                    type="button"
                    onClick={() => setTab("settings")}
                    className="text-[14px] font-bold leading-5 text-lyra-fg-secondary transition-colors hover:text-lyra-fg-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
                  >
                    Settings
                  </button>
                </li>
                <li aria-hidden="true">
                  <span className="text-[14px] leading-5 text-lyra-fg-secondary">/</span>
                </li>
                <li aria-current="page">
                  <span className="text-[14px] font-bold leading-5 text-lyra-fg-default">
                    Agent Settings Page
                  </span>
                </li>
              </ol>
            </nav>
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
      </ContentArea>

    </div>
  );
}
