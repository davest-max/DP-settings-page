import * as React from "react";
import { Monitor, LayoutGrid, Settings, PencilRuler, FileText } from "lucide-react";
import { LeftNav, type NavItem } from "../lyra-ui/src";

/**
 * Outer app-shell icon rail — migrated from `lyra-ux-templates-main`'s own
 * Sidebar.tsx. This is a DIFFERENT nav level from the "Desktop Profiles /
 * ACS Onboarding / CRM Integrations" tree already inside
 * `create-desktop-profile-page.tsx`'s AdminShell: that inner tree is the
 * admin section's own sub-navigation (via `AdminShell`'s `SidePanel` +
 * `TreeMenu`); this `LeftNav` is the top-level icon rail one level further
 * out — which broad console area you're in at all, with "Configure" active
 * since that's conceptually where Desktop Profiles lives. Both stay, one
 * nested inside the other, matching the real app's own nesting.
 *
 * The rail's items are placeholders, same as the template's own generic
 * Monitor/Dashboard/Configure/Designer set — this project doesn't have a
 * real top-level IA to draw from, only what's already modeled inside
 * AdminShell's tree.
 */
const navItems: NavItem[] = [
  { icon: <Monitor className="h-4 w-4" strokeWidth={1.5} />, label: "Monitor" },
  { icon: <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />, label: "Dashboard" },
  {
    icon: <Settings className="h-4 w-4" strokeWidth={1.5} />,
    label: "Configure",
    active: true,
  },
  { icon: <PencilRuler className="h-4 w-4" strokeWidth={1.5} />, label: "Designer" },
  { icon: <FileText className="h-4 w-4" strokeWidth={1.5} />, label: "Reporting" },
];

interface AppShellSidebarProps {
  open: boolean;
  onToggle: () => void;
  overlay?: boolean;
}

export function AppShellSidebar({ open, onToggle, overlay }: AppShellSidebarProps) {
  return <LeftNav items={navItems} open={open} onToggle={onToggle} overlay={overlay} />;
}
