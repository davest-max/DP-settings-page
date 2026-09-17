import * as React from "react";
import { useState } from "react";
import { Box, CheckCircle2, ChevronRight, MinusCircle, MoreVertical } from "lucide-react";
import {
  cn,
  AdminShell,
  Button,
  SearchInput,
  Select,
  ContentArea,
  Chip,
  AiIcon,
  type SelectOption,
  type TreeMenuItem,
} from "../lyra-ui/src";
import { AppShellHeader } from "./app-header";

/**
 * Desktop Profiles list page — reconstructed from the real production
 * page at na1.nice-incontact.com/apps/#/desktop-profiles/profiles for the
 * "New Employee Training" product demo (see `DesktopProfilesDemo`).
 * Reuses the same rounded-shell chrome as `CreateDesktopProfilePage` so
 * the two feel like one consistent app rather than two different builds.
 */

export interface DesktopProfileRow {
  id: string;
  name: string;
  /** Ids into `AVAILABLE_TEAMS` (create-desktop-profile-page.tsx) — the list only needs the count, the Assigned Teams tab needs the ids. */
  assignedTeamIds: string[];
  status: "active" | "inactive";
  /** Highlights a just-created row and shows a "New" chip next to its name. */
  isNew?: boolean;
}

const NAV_ITEMS: TreeMenuItem[] = [
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "Desktop Profiles", active: true },
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "Configurations" },
  { icon: <Box className="h-4 w-4" strokeWidth={1.5} />, label: "ACS Onboarding" },
];

const FILTER_OPTIONS: SelectOption[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

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

interface DesktopProfilesListPageProps {
  profiles: DesktopProfileRow[];
  onNewProfile: () => void;
  onOpenProfile?: (id: string) => void;
  /** Overrides the left nav tree — lets a caller (e.g. `DesktopProfilesDemo`) inject shared, wired-up nav items instead of this file's static default. */
  navItems?: TreeMenuItem[];
  /** Count of AI-drafted decisions pending review, across any profile/surface — drives the notification strip above the table. Omitted or 0 renders nothing (no notification when there's nothing to notify about). */
  pendingReviewCount?: number;
  /** Opens the Review Queue page — required for the notification strip to render, since it exists only to get you there. */
  onOpenReviewQueue?: () => void;
  /** Opens the docked AI Assistant panel (owned by `DesktopProfilesDemo`, shared across every screen) — renders an "Ask AI" page action when provided. */
  onOpenAssistant?: () => void;
}

export function DesktopProfilesListPage({
  profiles,
  onNewProfile,
  onOpenProfile,
  navItems = NAV_ITEMS,
  pendingReviewCount = 0,
  onOpenReviewQueue,
  onOpenAssistant,
}: DesktopProfilesListPageProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = profiles.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-lyra-bg-surface-shell">
      <AppShellHeader />
      <ContentArea>
        <AdminShell
          storageKeyPrefix="desktop-profiles-list-preview"
          navTitle=""
          navItems={navItems}
          defaultLeftPinned
          roundedContent
          showPageHeader
          pageTitle="Desktop Profiles"
          pageActions={
            <>
              {onOpenAssistant && (
                <Button variant="outline" className="gap-1.5" onClick={onOpenAssistant}>
                  <AiIcon className="h-4 w-4" />
                  Ask AI
                </Button>
              )}
              <Button onClick={onNewProfile}>New Desktop Profile</Button>
            </>
          }
        >
          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
            {/* ── Review Queue notification ──
             * Deliberately just an alert, not a preview: with potentially
             * dozens of saved profiles, this page's job is browsing the
             * table, so nothing about what's pending is summarized or
             * expanded here — a single clickable line saying something
             * needs attention, and Review Queue (a separate page) is
             * where you actually work through it. Renders nothing at all
             * when there's nothing pending, same as a notification bell
             * with no notifications. */}
            {pendingReviewCount > 0 && onOpenReviewQueue && (
              <button
                onClick={onOpenReviewQueue}
                className="mb-4 flex w-full items-center justify-between gap-3 rounded-lyra-md border border-lyra-border-active bg-lyra-bg-active-subtle px-4 py-2.5 text-left transition-colors hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
              >
                <span className="flex items-center gap-2.5">
                  <AiIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="lyra-body-sm text-lyra-fg-default">
                    <span className="font-bold">
                      {pendingReviewCount} {pendingReviewCount === 1 ? "item" : "items"}
                    </span>{" "}
                    across your profiles need your review.
                  </span>
                </span>
                <span className="flex flex-shrink-0 items-center gap-1 text-lyra-fg-action">
                  <span className="lyra-body-sm font-bold">Open Review Queue</span>
                  <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                </span>
              </button>
            )}

            <div className="mb-4 flex items-center justify-between">
              <span className="text-[16px] font-bold leading-6 text-lyra-fg-default">
                {profiles.length} Profiles
              </span>
              <div className="flex items-center gap-2">
                <SearchInput
                  aria-label="Search for Profiles"
                  placeholder="Search for Profiles"
                  value={search}
                  onValueChange={setSearch}
                  className="w-[260px]"
                />
                <Select
                  options={FILTER_OPTIONS}
                  value={filter}
                  onValueChange={setFilter}
                  className="w-[120px]"
                />
              </div>
            </div>

            <div className="flex flex-col rounded-lyra-sm border border-lyra-border-subtle">
              <div className="lyra-label flex gap-6 border-b border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-4 py-2 text-lyra-fg-secondary">
                <span className="flex-1">Name</span>
                <span className="w-[160px]">Assigned Teams</span>
                <span className="w-[140px]">Status</span>
                <span className="w-[60px] text-right">Actions</span>
              </div>
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center gap-6 border-t border-lyra-border-subtle px-4 py-3 first:border-t-0",
                    p.isNew && "bg-lyra-bg-active-subtle"
                  )}
                >
                  <span className="flex flex-1 items-center gap-2 text-[14px] text-lyra-fg-default">
                    <button
                      className="text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
                      onClick={() => onOpenProfile?.(p.id)}
                    >
                      {p.name}
                    </button>
                    {p.isNew && (
                      <Chip
                        color="orange"
                        variant="subtle"
                        className="px-1.5 py-0 text-[10px] font-semibold uppercase leading-4 tracking-wide"
                      >
                        New
                      </Chip>
                    )}
                  </span>
                  <span className="w-[160px] text-[14px] text-lyra-fg-default">{p.assignedTeamIds.length}</span>
                  <span className="w-[140px] text-[14px]">
                    <StatusCell status={p.status} />
                  </span>
                  <span className="flex w-[60px] justify-end">
                    <button
                      aria-label={`Actions for ${p.name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lyra-xs text-lyra-fg-secondary hover:bg-lyra-state-hover hover:text-lyra-fg-default"
                    >
                      <MoreVertical className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-10 text-center text-[14px] text-lyra-fg-secondary">
                  No profiles match your search.
                </div>
              )}
            </div>
          </div>
        </AdminShell>
      </ContentArea>
    </div>
  );
}
