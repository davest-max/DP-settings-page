import * as React from "react";
import { useState } from "react";
import { Lock } from "lucide-react";
import { Switch } from "../lyra-ui/src";

/**
 * Side-by-side comparison of two ways to disambiguate "show/hide" rows from
 * "agent permission" rows within a settings section that otherwise uses the
 * same Switch component for both. Exploratory only — not the production
 * "Create Desktop Profile" page (see create-desktop-profile-page.tsx).
 *
 * Option 2 — a small lock icon flags the one row that controls a
 * *permission* (can agents customize something) rather than *visibility*
 * (is something shown). Cheap, no new section chrome, but only
 * distinguishes at the single-row level.
 *
 * Option 3 — rows are grouped under small subheadings by what kind of
 * setting they are (Visibility / Behavior / Agent Permissions). No new
 * components needed, but adds vertical space and another layer of section
 * chrome to an already-long settings page.
 */

/* ── Shared row primitive (same shape as create-desktop-profile-page's
 * SettingsFieldRow) with an optional leading icon in the label cell — the
 * only variation from the production component, added just for Option 2. */
function ComparisonRow({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-6 border-t border-lyra-border-subtle px-4 py-3 first:border-t-0">
      <span className="flex w-[260px] flex-shrink-0 items-center gap-1.5 text-[14px] font-bold leading-5 text-lyra-fg-default">
        {icon}
        {label}
      </span>
      <div className="flex flex-1 items-center">{children}</div>
    </div>
  );
}

/* ── The existing "Apps" / "Additional Settings" style section header — Section is un-grouped. */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="lyra-label rounded-t-lyra-sm border border-b-0 border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-4 py-2 text-lyra-fg-secondary">
      {children}
    </div>
  );
}

/* ── Option 3's new piece: a lighter-weight inline sub-label, distinct from
 * SectionHeader so it doesn't read as a whole new top-level section. */
function SubGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-lyra-fg-secondary first:border-t-0">
      {children}
    </div>
  );
}

export function SettingsPatternComparison() {
  // Two independent state sets so toggling one variant never affects the other.
  const [showCallerA, setShowCallerA] = useState(true);
  const [closedContactA, setClosedContactA] = useState(true);
  const [quickBarA, setQuickBarA] = useState(true);

  const [showCallerB, setShowCallerB] = useState(true);
  const [closedContactB, setClosedContactB] = useState(true);
  const [quickBarB, setQuickBarB] = useState(true);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--lyra-color-bg-surface-shell, #f3f5f6)",
      }}
      className="flex flex-col items-center gap-8 px-6 py-12"
    >
      <div className="flex max-w-[1160px] flex-col items-center gap-2 text-center">
        <h1 className="lyra-heading-lg text-lyra-fg-default">
          Additional Settings — pattern comparison
        </h1>
        <p className="lyra-body-md max-w-[560px] text-lyra-fg-secondary">
          Same three rows, same Switch component, two ways to signal that
          "Allow Agents to Reorder &amp; Pin…" is a different kind of setting
          than the show/hide rows next to it.
        </p>
      </div>

      <div className="flex w-full max-w-[1160px] flex-col gap-10 lg:flex-row lg:items-start lg:justify-center">
        {/* ── Option 2 — lock icon on the permission row ── */}
        <div className="flex w-full flex-col gap-3 lg:max-w-[540px]">
          <div className="lyra-body-md-emphasis text-lyra-fg-active-strong">
            Option 2 — Lock icon on permission rows
          </div>
          <section>
            <SectionHeader>Additional Settings</SectionHeader>
            <div className="flex flex-col rounded-b-lyra-sm border border-lyra-border-subtle bg-lyra-bg-surface-base">
              <ComparisonRow label="Show Caller Phone Number">
                <Switch
                  size="sm"
                  checked={showCallerA}
                  onCheckedChange={setShowCallerA}
                  aria-label="Show Caller Phone Number"
                />
              </ComparisonRow>
              <ComparisonRow label="Closed Contact Confirmation">
                <Switch
                  size="sm"
                  checked={closedContactA}
                  onCheckedChange={setClosedContactA}
                  aria-label="Closed Contact Confirmation"
                />
              </ComparisonRow>
              <ComparisonRow
                label="Allow Agents to Reorder & Pin Quick Bar / App Space"
                icon={
                  <Lock
                    className="h-3.5 w-3.5 flex-shrink-0 text-lyra-fg-secondary"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                }
              >
                <Switch
                  size="sm"
                  checked={quickBarA}
                  onCheckedChange={setQuickBarA}
                  aria-label="Allow Agents to Reorder & Pin Quick Bar / App Space"
                />
              </ComparisonRow>
            </div>
          </section>
          <p className="lyra-body-sm text-lyra-fg-secondary">
            + No new section chrome, reads at the row level.
            <br />
            − Only helps once you notice the icon; doesn't group related
            settings together.
          </p>
        </div>

        {/* ── Option 3 — grouped subheadings ── */}
        <div className="flex w-full flex-col gap-3 lg:max-w-[540px]">
          <div className="lyra-body-md-emphasis text-lyra-fg-active-strong">
            Option 3 — Grouped subheadings
          </div>
          <section>
            <SectionHeader>Additional Settings</SectionHeader>
            <div className="flex flex-col rounded-b-lyra-sm border border-lyra-border-subtle bg-lyra-bg-surface-base">
              <SubGroupLabel>Visibility</SubGroupLabel>
              <ComparisonRow label="Show Caller Phone Number">
                <Switch
                  size="sm"
                  checked={showCallerB}
                  onCheckedChange={setShowCallerB}
                  aria-label="Show Caller Phone Number"
                />
              </ComparisonRow>
              <SubGroupLabel>Behavior</SubGroupLabel>
              <ComparisonRow label="Closed Contact Confirmation">
                <Switch
                  size="sm"
                  checked={closedContactB}
                  onCheckedChange={setClosedContactB}
                  aria-label="Closed Contact Confirmation"
                />
              </ComparisonRow>
              <SubGroupLabel>Agent Permissions</SubGroupLabel>
              <ComparisonRow label="Allow Agents to Reorder & Pin Quick Bar / App Space">
                <Switch
                  size="sm"
                  checked={quickBarB}
                  onCheckedChange={setQuickBarB}
                  aria-label="Allow Agents to Reorder & Pin Quick Bar / App Space"
                />
              </ComparisonRow>
            </div>
          </section>
          <p className="lyra-body-sm text-lyra-fg-secondary">
            + Groups related settings together; scales to any number of
            categories without new components.
            <br />
            − More vertical space and another layer of section chrome on an
            already-long page.
          </p>
        </div>
      </div>
    </div>
  );
}
