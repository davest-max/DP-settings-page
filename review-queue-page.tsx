import * as React from "react";
import { useState } from "react";
import { ArrowRight, Check, MessageSquarePlus } from "lucide-react";
import { cn, AdminShell, Button, Input, ContentArea, Chip, AiIcon, type TreeMenuItem } from "../lyra-ui/src";
import { AppShellHeader } from "./app-header";

/**
 * Review Queue — the future-state sketch discussed with Dave: rather than
 * the "N items need your review" banner living only inside Create Desktop
 * Profile, this promotes that same pattern to its own home, aggregating
 * AI-drafted decisions across every profile and surface in Agent
 * Workspace. The tree nav (left) stays for structural browsing — this is
 * the review-first surface admins are expected to actually work from once
 * an agent is doing the day-to-day configuring.
 *
 * A few of the items below (`wired: true`) deep-link into the real,
 * working pages already in this prototype (Create Desktop Profile's
 * flagged rows, PPE_Agent's Display & Keyboard tab); one (`wired: false`)
 * is left illustrative, labeled as such, to show the pattern generalizing
 * to surfaces this prototype hasn't built out yet — not to pretend it's
 * further along than it is.
 */

export interface ReviewQueueItem {
  id: string;
  profileName: string;
  /** e.g. "Create Desktop Profile → Apps" — where this decision lives. */
  surfacePath: string;
  /** The specific question/flag an admin needs to weigh in on. */
  question: string;
  /** False = illustrative only; no working destination in this prototype yet. */
  wired: boolean;
  onOpen?: () => void;
}

interface ReviewQueuePageProps {
  items: ReviewQueueItem[];
  onApprove: (id: string) => void;
  navItems: TreeMenuItem[];
  /** Returns to Desktop Profiles — powers the "Desktop Profiles / Review Queue" breadcrumb in the header, since this page is reached from there and nowhere else (see the file doc-comment). */
  onBack?: () => void;
  /** Opens the docked AI Assistant panel (owned by `DesktopProfilesDemo`, shared across every screen) — renders an "Ask AI" page action when provided. */
  onOpenAssistant?: () => void;
}

function ReviewQueueCard({
  item,
  onApprove,
}: {
  item: ReviewQueueItem;
  onApprove: (id: string) => void;
}) {
  const [askOpen, setAskOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [thread, setThread] = useState<string[]>([]);

  function sendMessage() {
    const trimmed = draftMessage.trim();
    if (!trimmed) return;
    setThread((prev) => [...prev, trimmed]);
    setDraftMessage("");
    setAskOpen(false);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-base p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AiIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-bold leading-5 text-lyra-fg-default">{item.profileName}</span>
              <span className="lyra-body-sm text-lyra-fg-secondary">{item.surfacePath}</span>
              {!item.wired && (
                <Chip
                  color="slate"
                  variant="subtle"
                  className="px-1.5 py-0 text-[10px] font-semibold uppercase leading-4 tracking-wide"
                >
                  Illustrative — surface not built yet
                </Chip>
              )}
            </div>
            <p className="lyra-body-sm max-w-[600px] text-lyra-fg-secondary">{item.question}</p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => setAskOpen((v) => !v)}>
            <MessageSquarePlus className="h-4 w-4" strokeWidth={1.5} />
            Ask
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => onApprove(item.id)}>
            <Check className="h-4 w-4" strokeWidth={1.5} />
            Approve as drafted
          </Button>
          <Button
            disabled={!item.wired}
            title={item.wired ? undefined : "Illustrative — this surface isn't built in the prototype yet"}
            className="gap-1.5"
            onClick={item.onOpen}
          >
            Review
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      {thread.length > 0 && (
        <div className="ml-8 flex flex-col gap-1.5 border-l-2 border-lyra-border-subtle pl-3">
          {thread.map((msg, i) => (
            <p key={i} className="lyra-body-sm text-lyra-fg-default">
              <span className="font-bold">You: </span>
              {msg}
            </p>
          ))}
        </div>
      )}

      {askOpen && (
        <div className="ml-8 flex items-center gap-2">
          <Input
            placeholder="Ask the agent a question about this..."
            value={draftMessage}
            onChange={(e) => setDraftMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            className="flex-1"
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      )}
    </div>
  );
}

export function ReviewQueuePage({ items, onApprove, navItems, onBack, onOpenAssistant }: ReviewQueuePageProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-lyra-bg-surface-shell">
      <AppShellHeader />
      <ContentArea>
        <AdminShell
          storageKeyPrefix="review-queue-preview"
          navTitle=""
          navItems={navItems}
          defaultLeftPinned
          roundedContent
          showPageHeader
          pageTitle="Review Queue"
          pageBreadcrumb={onBack ? { label: "Desktop Profiles", onClick: onBack } : undefined}
          pageChip={items.length > 0 ? `${items.length} pending` : undefined}
          pageChipColor={items.length > 0 ? "orange" : undefined}
          pageActions={
            onOpenAssistant && (
              <Button variant="outline" className="gap-1.5" onClick={onOpenAssistant}>
                <AiIcon className="h-4 w-4" />
                Ask AI
              </Button>
            )
          }
        >
          <div className={cn("flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6")}>
            <div className="flex items-start gap-3 rounded-lyra-md border border-lyra-border-active bg-lyra-bg-active-subtle px-4 py-3">
              <AiIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="lyra-body-sm max-w-[720px] text-lyra-fg-secondary">
                Everything an AI agent drafted across Agent Workspace lands here if it's
                confident enough to act on its own, or here for a look if it isn't — one
                queue instead of one banner per page. Everything the agent set with high
                confidence needs no action from you at all.
              </p>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lyra-md border border-dashed border-lyra-border-subtle py-16 text-center">
                <Check className="h-6 w-6 text-lyra-status-success-strong" strokeWidth={1.5} />
                <p className="lyra-body-md-emphasis text-lyra-fg-default">You&apos;re all caught up</p>
                <p className="lyra-body-sm text-lyra-fg-secondary">Nothing needs your review right now.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <ReviewQueueCard key={item.id} item={item} onApprove={onApprove} />
                ))}
              </div>
            )}
          </div>
        </AdminShell>
      </ContentArea>
    </div>
  );
}
