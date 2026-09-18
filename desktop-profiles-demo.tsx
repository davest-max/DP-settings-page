import * as React from "react";
import { useState } from "react";
import { Box, History as HistoryIcon } from "lucide-react";
import {
  ToastContainer,
  Toast,
  useToast,
  AiPanel,
  AiIndicatorSmall,
  AIProcess,
  type TreeMenuItem,
  type AiPanelSuggestion,
  type AIProcessStep,
} from "../lyra-ui/src";
import { DesktopProfilesListPage, type DesktopProfileRow } from "./desktop-profiles-list-page";
import { CreateDesktopProfilePage, type ReviewItemKey } from "./create-desktop-profile-page";
import { ReviewQueuePage, type ReviewQueueItem } from "./review-queue-page";

/**
 * Product-demo reference flow (AW-61850 follow-on): an AI agent drafts a
 * "New Employee Training" desktop profile from an uploaded new-hire
 * roster, an admin reviews the flagged policy calls (now via the Review
 * Queue — see below) and saves it, the new profile shows up in the
 * Desktop Profiles list, and the admin opens it again to assign the
 * new-hire cohort's team.
 *
 * Sourced from the real production app at
 * na1.nice-incontact.com/apps/#/desktop-profiles/profiles (list, create,
 * and update/edit pages, plus the Add Team picker) — see
 * `desktop-profiles-list-page.tsx` and `create-desktop-profile-page.tsx`
 * for the per-page reconciliation notes. This component is just the
 * glue: it owns the state a real app would keep on a server, so all the
 * screens read as one continuous flow instead of disconnected mockups.
 *
 * ── Review Queue (future-state sketch) ──
 * The design idea Dave and I talked through: once an AI agent is doing
 * the day-to-day configuring across every surface in Agent Workspace
 * (not just this one profile), an admin needs a triage list of
 * everything the agent wasn't confident enough to decide alone,
 * regardless of which surface or profile it came from — the "3 items
 * need your review" banner from Create Desktop Profile, generalized
 * into its own page instead of living on just one.
 *
 * It deliberately does NOT live in the left nav tree, and it's not this
 * demo's landing screen either. With potentially dozens of saved
 * profiles, Desktop Profiles' whole job is being a fast, uncluttered
 * table to browse — so Review Queue is reached only via a single
 * clickable notification line above that table (see
 * `pendingReviewCount`/`onOpenReviewQueue` on `DesktopProfilesListPage`),
 * the way a notification bell surfaces something without previewing or
 * summarizing it in place. Nothing pending, no notification, nothing to
 * click — the page doesn't exist as far as the admin's day is concerned.
 *
 * ── AI Assistant (future-state sketch) ──
 * Dave's reference: an "Ask AI" button that opens a docked AI Assistant
 * panel, so an admin can prompt the assistant to create/edit/manage
 * profiles instead of doing it by hand. Built from the design system's own
 * `AiPanel` (already wraps `Draggable` for the dock ⇄ float toggle, plus
 * new-conversation/history/close) rather than a bespoke panel — composition
 * over reimplementation, and it's why the header already has a Move icon
 * to undock it, matching the reference screenshot exactly. It's owned here
 * (not by any one screen) so the conversation and open/closed state
 * survive navigating between List, Create/Edit, and Review Queue.
 *
 * Only one path is actually wired end-to-end: asking it to create a
 * profile for the new training cohort drops you into the same Create
 * Desktop Profile draft (with the same "N items need your review" banner)
 * this file already builds — i.e. this is option 3 from that discussion
 * with Dave, reusing 100% of what's already here rather than a separate
 * chat-only flow. Every other suggested prompt gets an honest, grounded
 * canned reply describing what it *would* do — no prompt claims to do
 * more than this prototype can actually show.
 *
 * That one wired reply also carries an `AIProcess` "thought process" trace
 * (Reviewing roster → Drafting settings → Flagging items) — the design
 * system's own component for this, already collapsed by default so it
 * doesn't compete with the reply text, just gives an admin who wants the
 * "why" somewhere to look. The History tab shows a few illustrative past
 * conversations (clearly labeled as such, same convention as Review
 * Queue's one illustrative item) rather than the panel's default empty
 * state — this prototype doesn't persist real history, so the label says
 * so instead of pretending it does.
 */

const INITIAL_PROFILES: DesktopProfileRow[] = [
  {
    id: "desktop-profile-test",
    name: "Desktop Profile TEST",
    assignedTeamIds: ["cxone-agent-team"],
    status: "inactive",
  },
  {
    id: "default-team-profile",
    name: "Default Team Profile",
    assignedTeamIds: ["default-team"],
    status: "active",
  },
  {
    id: "ppe-agent",
    name: "PPE_Agent",
    assignedTeamIds: ["ppe-agent-team"],
    status: "active",
  },
];

/* Seeds the Review Queue with the same 3 policy calls already flagged
 * inside Create Desktop Profile's "New Employee Training" draft, plus a
 * 4th real one from a different profile and surface entirely (PPE_Agent's
 * Agent Settings Page) to show this isn't scoped to one page, and a 5th,
 * clearly-labeled illustrative one to gesture at the scale beyond what's
 * actually built here. */
interface QueueItemDef {
  id: string;
  profileName: string;
  surfacePath: string;
  question: string;
  wired: boolean;
  target?:
    | { kind: "create"; focusItem: ReviewItemKey }
    | { kind: "edit"; profileId: string; tab: "settings" | "teams" | "settings-page"; innerTab?: "login-voice" | "av-notifications" | "display-keyboard" };
}

const INITIAL_QUEUE_ITEMS: QueueItemDef[] = [
  {
    id: "queue-counter",
    profileName: "New Employee Training",
    surfacePath: "Create Desktop Profile → Apps",
    question: "Trainees may not need live Queue Counter visibility yet — confirm before enabling for this cohort.",
    wired: true,
    target: { kind: "create", focusItem: "queue-counter" },
  },
  {
    id: "outbound-calling",
    profileName: "New Employee Training",
    surfacePath: "Create Desktop Profile → Additional Settings",
    question: "Trainees may not be ready for Transfer or Elevation yet — confirm which outbound actions this cohort should have.",
    wired: true,
    target: { kind: "create", focusItem: "outbound-calling" },
  },
  {
    id: "directory-app",
    profileName: "New Employee Training",
    surfacePath: "Create Desktop Profile → Additional Settings",
    question: "Narrowed to this training team by default — confirm that's the right directory scope for new hires.",
    wired: true,
    target: { kind: "create", focusItem: "directory-app" },
  },
  {
    id: "ppe-24hr",
    profileName: "PPE_Agent",
    surfacePath: "Agent Settings Page → Display & Keyboard",
    question: "24 Hour Time was drafted off for this cohort — most of this team is EU-based and expects it on. Confirm before locking it.",
    wired: true,
    target: { kind: "edit", profileId: "ppe-agent", tab: "settings-page", innerTab: "display-keyboard" },
  },
  {
    id: "seasonal-volume",
    profileName: "Seasonal Support (planned)",
    surfacePath: "Agent Settings Page → Login & Voice Preferences",
    question: "Softphone default volume drafted at 40% for seasonal hires — confirm this matches the headset policy for that cohort.",
    wired: false,
  },
];

type Screen =
  | { name: "review-queue" }
  | { name: "list" }
  /**
   * `focusItem` (set by Review Queue) and `aiDrafted` (set by the AI
   * Assistant's "create a profile" action) both mean the same thing to
   * `CreateDesktopProfilePage`'s `showAiDraftPreview` prop — "this is an
   * agent-drafted profile the admin is reviewing," not a blank form. A
   * plain "New Desktop Profile" click sets neither, so it lands clean.
   */
  | { name: "create"; focusItem?: ReviewItemKey; aiDrafted?: boolean }
  | { name: "edit"; profileId: string; tab?: "settings" | "teams" | "settings-page"; innerTab?: "login-voice" | "av-notifications" | "display-keyboard" };

/* Shared left nav — identical across every screen so it reads as one app,
 * not three. No "Review Queue" entry here on purpose (see the file
 * doc-comment above) — it's reached only from the notification on
 * Desktop Profiles, not browsed to. "Desktop Profiles" stays highlighted
 * through list/create/edit since they're all part of that same section;
 * it's simply not lit up while on Review Queue, since that page isn't
 * really "inside" Desktop Profiles, just reachable from it. */
function buildNavItems(screenName: Screen["name"], go: (s: Screen) => void): TreeMenuItem[] {
  return [
    {
      icon: <Box className="h-4 w-4" strokeWidth={1.5} />,
      label: "Desktop Profiles",
      active: screenName === "list" || screenName === "create" || screenName === "edit",
      onClick: () => go({ name: "list" }),
    },
    { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "Configurations" },
    { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "ACS Onboarding" },
  ];
}

/* Contextual suggestion chips for the AI Assistant's empty state — what an
 * admin is plausibly asking about changes with what they're looking at, the
 * same way the reference screenshot's suggestions ("Summarise this
 * contact's history") were specific to the record open behind the panel. */
function buildAssistantSuggestions(screenName: Screen["name"]): AiPanelSuggestion[] {
  switch (screenName) {
    case "list":
      return [
        { id: "create", label: "Create a profile for the new training cohort" },
        { id: "pending", label: "Which profiles have pending review items?" },
        { id: "ppe", label: "Tell me about the PPE_Agent profile" },
      ];
    case "create":
      return [
        { id: "summarize", label: "Summarize what's changed in this draft" },
        { id: "why-queue-counter", label: "Why was Queue Counter turned off?" },
        { id: "add-team", label: "Add the New Hire Training team to this profile" },
      ];
    case "edit":
      return [
        { id: "summarize-profile", label: "Summarize this profile's settings" },
        { id: "pending-profile", label: "Does this profile have anything pending review?" },
        { id: "add-team", label: "Add a team to this profile" },
      ];
    case "review-queue":
      return [
        { id: "pending-count", label: "How many items are waiting on me?" },
        { id: "explain-ppe", label: "Why does PPE_Agent need a 24 Hour Time review?" },
        { id: "confident", label: "Approve everything you're highly confident about" },
      ];
    default:
      return [];
  }
}

/* One canned reply per topic an admin is likely to ask about, grounded in
 * this file's actual state (`queueItems`) rather than invented numbers.
 * Exactly one topic is wired to a real action (`action: "create-profile"`)
 * — drafting the New Employee Training profile, which is the one scenario
 * this whole prototype already builds end-to-end. Everything else answers
 * honestly, including saying plainly when this prototype can't yet do
 * something (see the "add-team"/"confident" cases) rather than pretending
 * to. */
/* The one wired reply's thought-process trace — all "done" since this is a
 * completed draft the admin is now reviewing, not a live in-progress run. */
const CREATE_PROFILE_PROCESS_STEPS: AIProcessStep[] = [
  {
    id: "roster",
    label: "Reviewing roster",
    description: "Cross-checked the new-hire upload against existing teams",
    status: "done",
  },
  {
    id: "draft",
    label: "Drafting settings",
    description: "Applied the standard training-cohort defaults",
    status: "done",
  },
  {
    id: "flag",
    label: "Flagging items",
    description: "3 settings I wasn't fully confident about",
    status: "done",
  },
];

function getAssistantReply(
  promptText: string,
  queueItems: QueueItemDef[]
): { text: string; action?: "create-profile"; processSteps?: AIProcessStep[] } {
  const p = promptText.toLowerCase();

  if (p.includes("creat") && (p.includes("training") || p.includes("profile") || p.includes("cohort"))) {
    return {
      text:
        "On it — drafting a New Employee Training profile from the new-hire roster now. I've flagged 3 settings I wasn't fully confident about, so take a look before you save it.",
      action: "create-profile",
      processSteps: CREATE_PROFILE_PROCESS_STEPS,
    };
  }
  if (p.includes("confiden")) {
    return {
      text:
        "I don't have an autonomous-approval mode wired up yet in this prototype — every item in Review Queue needs a human look for now, even the ones I'm fairly confident about.",
    };
  }
  if (p.includes("pending") || (p.includes("review") && !p.includes("why"))) {
    const names = Array.from(new Set(queueItems.map((i) => i.profileName)));
    return {
      text:
        queueItems.length === 0
          ? "Nothing's pending review right now — you're all caught up."
          : `${queueItems.length} item${queueItems.length === 1 ? "" : "s"} across ${names.length} profile${
              names.length === 1 ? "" : "s"
            } ${names.length === 1 ? "is" : "are"} waiting on you: ${names.join(
              ", "
            )}. Open Review Queue and I can walk through them with you.`,
    };
  }
  if (p.includes("ppe")) {
    return {
      text:
        "PPE_Agent is active, assigned to the PPE - Agent team (5 users). It has one item in Review Queue — the 24 Hour Time setting on its Display & Keyboard tab was drafted off, but most of that team is EU-based, so I'd confirm before locking it in.",
    };
  }
  if (p.includes("queue counter")) {
    return {
      text:
        "I turned Queue Counter visibility off in this draft because new trainees usually aren't ready to see live queue depth on day one — it can be a distraction before they've built up call-handling confidence. Happy to turn it back on if you'd rather they see it from the start.",
    };
  }
  if (p.includes("summar")) {
    return {
      text:
        "This draft creates \"New Employee Training\": most apps are on by default, Queue Counter and two outbound actions are held back pending your review, and the Directory app is scoped to just this training team for now.",
    };
  }
  if (p.includes("add") && p.includes("team")) {
    return {
      text:
        "I can't add a team directly from chat yet in this prototype — the fastest path today is the Assigned Teams tab's \"Add Teams\" button, searching for New Hire Training Team.",
    };
  }
  return {
    text:
      "I can help draft new profiles and answer questions about what's already in Review Queue — try asking me to create a profile, or ask about a specific one like PPE_Agent.",
  };
}

interface AssistantMessage {
  role: "user" | "assistant";
  text: string;
  /** Only ever set on the one wired create-profile reply — renders as a collapsed `AIProcess` trace under the reply text. */
  processSteps?: AIProcessStep[];
}

function AssistantMessageBubble({ message }: { message: AssistantMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lyra-lg bg-lyra-bg-active-subtle px-3.5 py-2.5">
          <p className="lyra-body-sm text-lyra-fg-default">{message.text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5">
      <AiIndicatorSmall className="h-6 w-6 shrink-0" />
      <div className="flex max-w-[85%] flex-col gap-2 pt-0.5">
        <p className="lyra-body-sm text-lyra-fg-default">{message.text}</p>
        {message.processSteps && <AIProcess steps={message.processSteps} label="Thought process" />}
      </div>
    </div>
  );
}

/* Illustrative only — this prototype doesn't persist real conversation
 * history yet, so the History tab says as much rather than implying these
 * rows are reopenable (same convention as Review Queue's one illustrative,
 * clearly-labeled item). */
const ASSISTANT_HISTORY_ITEMS: { id: string; title: string; timestamp: string }[] = [
  { id: "h1", title: "Drafted the New Employee Training profile", timestamp: "Today, 9:14 AM" },
  { id: "h2", title: "Explained the PPE_Agent 24 Hour Time flag", timestamp: "Yesterday, 3:52 PM" },
  { id: "h3", title: "Summarized what was pending in Review Queue", timestamp: "Monday, 8:03 AM" },
];

const assistantHistoryContent = (
  <>
    <p className="px-3 pb-2 lyra-body-sm text-lyra-fg-disabled">
      Illustrative — conversation history isn&apos;t saved in this prototype yet.
    </p>
    {ASSISTANT_HISTORY_ITEMS.map((h) => (
      <div key={h.id} className="flex items-start gap-2.5 rounded-lyra-sm px-3 py-2.5">
        <HistoryIcon className="mt-0.5 h-4 w-4 shrink-0 text-lyra-fg-secondary" strokeWidth={1.5} />
        <div className="flex flex-col gap-0.5">
          <span className="lyra-body-sm text-lyra-fg-default">{h.title}</span>
          <span className="lyra-body-sm text-lyra-fg-disabled">{h.timestamp}</span>
        </div>
      </div>
    ))}
  </>
);

export function DesktopProfilesDemo() {
  // Landing screen is Desktop Profile TEST's settings table (Update Desktop
  // Profile → Settings tab) rather than the Desktop Profiles list — a Dave
  // request so this profile's settings are front and center on load.
  const [screen, setScreen] = useState<Screen>({
    name: "edit",
    profileId: "desktop-profile-test",
  });
  const [profiles, setProfiles] = useState<DesktopProfileRow[]>(INITIAL_PROFILES);
  const [queueItems, setQueueItems] = useState<QueueItemDef[]>(INITIAL_QUEUE_ITEMS);
  const { toasts, addToast, dismissToast } = useToast();

  // AI Assistant — open/closed and its conversation live here so both
  // survive navigating between screens (see the file doc-comment).
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);

  function handleAssistantPrompt(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAssistantMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    const reply = getAssistantReply(trimmed, queueItems);
    // Small delay so a reply reads as "thought about it" rather than an
    // instant canned lookup — not a real latency simulation, just pacing.
    window.setTimeout(() => {
      setAssistantMessages((prev) => [
        ...prev,
        { role: "assistant", text: reply.text, processSteps: reply.processSteps },
      ]);
      if (reply.action === "create-profile") {
        setScreen({ name: "create", aiDrafted: true });
      }
    }, 450);
  }

  function handleCreate(profile: { name: string; description: string }) {
    const name = profile.name || "New Employee Training";
    const id = `new-${Date.now()}`;
    setProfiles((prev) => [
      { id, name, assignedTeamIds: [], status: "active", isNew: true },
      ...prev,
    ]);
    addToast({
      variant: "success",
      title: "Desktop profile created",
      message: `"${name}" was created. Open it to assign the new-hire team.`,
      duration: 6000,
    });
    // Creating it resolves whichever of its 3 flagged items were still
    // sitting in the queue.
    setQueueItems((prev) => prev.filter((i) => i.profileName !== "New Employee Training"));
    setScreen({ name: "list" });
  }

  function handleTeamsChange(profileId: string, teamIds: string[]) {
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, assignedTeamIds: teamIds } : p))
    );
  }

  function handleSave() {
    addToast({ variant: "success", title: "Changes saved", duration: 4000 });
    setScreen({ name: "list" });
  }

  function handleApproveQueueItem(id: string) {
    setQueueItems((prev) => prev.filter((i) => i.id !== id));
    addToast({ variant: "success", title: "Approved as drafted", duration: 3000 });
  }

  const editingProfile = screen.name === "edit" ? profiles.find((p) => p.id === screen.profileId) : undefined;

  const navItems = buildNavItems(screen.name, setScreen);

  const reviewQueueViewItems: ReviewQueueItem[] = queueItems.map((item) => {
    const target = item.target;
    let onOpen: (() => void) | undefined;
    if (target?.kind === "create") {
      const focusItem = target.focusItem;
      onOpen = () => setScreen({ name: "create", focusItem });
    } else if (target?.kind === "edit") {
      const { profileId, tab, innerTab } = target;
      onOpen = () => setScreen({ name: "edit", profileId, tab, innerTab });
    }
    return {
      id: item.id,
      profileName: item.profileName,
      surfacePath: item.surfacePath,
      question: item.question,
      wired: item.wired,
      onOpen,
    };
  });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-lyra-bg-surface-shell">
      <div className="min-w-0 flex-1 overflow-hidden">
        {screen.name === "review-queue" && (
          <ReviewQueuePage
            items={reviewQueueViewItems}
            onApprove={handleApproveQueueItem}
            navItems={navItems}
            onBack={() => setScreen({ name: "list" })}
            onOpenAssistant={() => setAiPanelOpen(true)}
          />
        )}

        {screen.name === "list" && (
          <DesktopProfilesListPage
            profiles={profiles}
            onNewProfile={() => setScreen({ name: "create" })}
            onOpenProfile={(id) => setScreen({ name: "edit", profileId: id })}
            navItems={navItems}
            // Hidden per Dave's request — was `queueItems.length`. Restore
            // that (and keep onOpenReviewQueue below) to bring the banner
            // back; Review Queue itself is untouched, just unreachable from
            // this page while the banner is suppressed.
            pendingReviewCount={0}
            onOpenReviewQueue={() => setScreen({ name: "review-queue" })}
            onOpenAssistant={() => setAiPanelOpen(true)}
          />
        )}

        {screen.name === "create" && (
          <CreateDesktopProfilePage
            key={screen.focusItem ?? "create"}
            mode="create"
            onCreate={handleCreate}
            onCancel={() => setScreen({ name: "list" })}
            navItems={navItems}
            initialFocusItem={screen.focusItem}
            showAiDraftPreview={!!screen.focusItem || !!screen.aiDrafted}
            onOpenAssistant={() => setAiPanelOpen(true)}
          />
        )}

        {screen.name === "edit" && editingProfile && (
          <CreateDesktopProfilePage
            key={`${editingProfile.id}-${screen.tab ?? "default"}`}
            mode="edit"
            initialAssignedTeamIds={editingProfile.assignedTeamIds}
            onCancel={() => setScreen({ name: "list" })}
            onSave={handleSave}
            onTeamsChange={(ids) => handleTeamsChange(editingProfile.id, ids)}
            navItems={navItems}
            initialTab={screen.tab}
            initialSettingsPageInnerTab={screen.innerTab}
            onOpenAssistant={() => setAiPanelOpen(true)}
          />
        )}
      </div>

      {/* ── AI Assistant — docked by default, undockable to float via the
          Move icon (built into `AiPanel`/`Draggable`). Lives outside the
          per-screen switch above so it stays mounted (and its conversation
          intact) across every navigation this demo does. */}
      {aiPanelOpen && (
        <div className="my-3 mr-3 shrink-0">
          <AiPanel
            draggable
            draggableVariant="docked"
            title="AI Assistant"
            greeting="How can I help?"
            suggestions={buildAssistantSuggestions(screen.name)}
            onSuggestion={(s) => handleAssistantPrompt(s.label)}
            onNewConversation={() => setAssistantMessages([])}
            onClose={() => setAiPanelOpen(false)}
            historyContent={assistantHistoryContent}
            inputProps={{ onSubmit: handleAssistantPrompt }}
          >
            {assistantMessages.length > 0
              ? assistantMessages.map((m, i) => <AssistantMessageBubble key={i} message={m} />)
              : undefined}
          </AiPanel>
        </div>
      )}

      <ToastContainer>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            title={t.title}
            duration={t.duration}
            onDismiss={() => dismissToast(t.id)}
          >
            {t.message}
          </Toast>
        ))}
      </ToastContainer>
    </div>
  );
}
