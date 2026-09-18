import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Box, CheckCircle2, ChevronRight, MinusCircle, Trash2, X } from "lucide-react";
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
  type SelectOption,
  type TreeMenuItem,
} from "../lyra-ui/src";
import { ToggleChip, ToggleChipGroup, type ToggleChipOption } from "./toggle-chip";
import { PageOrderEditorModal, type PageOrderItem } from "./page-order-editor";
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

/* AW-61857 — default page order for the "Allow Agents to Reorder & Pin
 * Quick Bar / App Space" row's editor. Meant to read as "every page that
 * could exist" (Dave's reference screenshot of the real Agent Workspace
 * nav), not just the 9 apps this one profile's Apps table happens to
 * toggle — so pages with no Apps-table entry anywhere in this prototype
 * (Directory, Settings, Help) are included too, defaulting into More
 * ellipsis (`band: "more"`) rather than competing for a rail slot right
 * away. "Internal Chat" from that screenshot is the same real page as
 * this profile's "conversations" app — the Apps table row above was
 * renamed "Internal Chat" too (was "Conversations"), so both stay in
 * sync; "Queue Counter" → "Queue" here is display-only in this list, the
 * Apps table row above still reads "Queue Counter" (the
 * `APPS_TABLE_PAGE_KEYS`/"desk" special cases below key off `key`, not
 * `label`, so neither rename affects anything else).
 * Order below is a starting point the editor is built to change, not a
 * rule. */
const DEFAULT_PAGE_ORDER_ITEMS: PageOrderItem[] = [
  { key: "desk", label: "Desk" },
  { key: "search", label: "Search" },
  { key: "contact-history", label: "Contact History" },
  { key: "queue-counter", label: "Queue" },
  { key: "directory", label: "Directory", band: "more" },
  { key: "schedule", label: "Schedule" },
  { key: "custom-workspace", label: "Custom Workspace" },
  { key: "conversations", label: "Internal Chat" },
  { key: "launch", label: "Launch" },
  { key: "wem", label: "WEM" },
  { key: "settings-nav", label: "Settings", band: "more" },
  { key: "reporting", label: "Reporting" },
  { key: "help", label: "Help", band: "more" },
];

/* Keys whose visibility is governed by a real Switch in the Apps table
 * above (see `apps` state) — Hidden is ONLY ever true for these (Dave's
 * call: only a page that's also a real Apps-table toggle can be hidden
 * at all), and only via that Switch, never by dragging in the Page
 * Order modal. Everything else in `DEFAULT_PAGE_ORDER_ITEMS` — "desk"
 * and the 3 no-Apps-table pages above — is always visible; the modal
 * only ever moves those between Shown and More. */
const APPS_TABLE_PAGE_KEYS = new Set(APPS.map((app) => app.key));

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
 * this table. Deliberately NOT a `SettingsFieldRow` + trailing control —
 * the whole row is the click target (no separate button inside it, per
 * Dave's call on how to treat this), and it carries a secondary caption
 * so its scope reads as "there's more here," not just another toggle.
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
      <span className="flex w-[220px] flex-shrink-0 flex-col gap-0.5">
        <span className="text-[14px] font-bold leading-5 text-lyra-fg-default">{label}</span>
        <span className="lyra-body-sm text-lyra-fg-secondary">{description}</span>
      </span>
      <span className="flex flex-1 items-center justify-end">
        <ChevronRight className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} />
      </span>
    </button>
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
  const [pageOrderItems, setPageOrderItems] = useState<PageOrderItem[]>(
    DEFAULT_PAGE_ORDER_ITEMS
  );
  const [pageOrderEditorOpen, setPageOrderEditorOpen] = useState(false);
  // Only Apps-table pages can ever be hidden (Dave's call) — everything
  // else (Desk, Directory, Settings, Help) is always visible here,
  // regardless of any `hidden` a stale save might carry.
  const pageOrderItemsWithVisibility = useMemo<PageOrderItem[]>(
    () =>
      pageOrderItems.map((item) =>
        APPS_TABLE_PAGE_KEYS.has(item.key)
          ? { ...item, hidden: apps[item.key] === false }
          : { ...item, hidden: false }
      ),
    [pageOrderItems, apps]
  );
  const [screenPopAlwaysStealFocus, setScreenPopAlwaysStealFocus] = useState(false);

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

            {/* ── Apps ── */}
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
                <SettingsFieldRow label="Allow Agents to Reorder & Pin Quick Bar / App Space">
                  <div className="flex items-center gap-3">
                    {/* AW-61857 — a chip instead of a plain toggle: "Agent
                     * Editable" (selected) / not (unselected) is more
                     * specific about what this actually controls than a
                     * bare on/off switch was. */}
                    <ToggleChip
                      label="Agent Editable"
                      selected={quickBarAgentCustomization}
                      onToggle={() => setQuickBarAgentCustomization((v) => !v)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageOrderEditorOpen(true)}
                    >
                      Set page order
                    </Button>
                  </div>
                </SettingsFieldRow>
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

      <PageOrderEditorModal
        open={pageOrderEditorOpen}
        items={pageOrderItemsWithVisibility}
        onCancel={() => setPageOrderEditorOpen(false)}
        onSave={(items) => {
          // `hidden` is always Apps-table-derived (recomputed above), never
          // worth persisting; only `band` (Shown vs. More) is real state.
          setPageOrderItems(
            items.map(({ key, label, band }) => ({
              key,
              label,
              ...(band ? { band } : {}),
            }))
          );
          setPageOrderEditorOpen(false);
        }}
      />
    </div>
  );
}
