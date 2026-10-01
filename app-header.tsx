import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { CircleHelp, LayoutGrid, Bell, Presentation } from "lucide-react";
import appIcon from "./assets/app-icon.svg";
import {
  AppHeader,
  AppName,
  ActionIconButton,
  Button,
  ProfileMenu,
  defaultProfileMenuGroups,
  AppMenu,
  CXoneLogo,
  type AppMenuGroup,
} from "../lyra-ui/src";
import { AdditionalIdeasPanel } from "./additional-ideas-panel";

/** Dated screen grabs of how this page's layout has changed across the
 * build (see `additional-ideas-panel.tsx`), shown in an in-page modal
 * rather than a link to an external gallery — Dave wants a demo viewer
 * to stay on this same deployed URL the whole time, not get handed off
 * elsewhere.
 *
 * A full labeled `Button` rather than an icon in the usual action-icon
 * row (Help/Apps/Notifications) on purpose — this one's meant to catch
 * a demo audience's eye, not blend in as plumbing alongside them. */

/**
 * Outer app-shell header — migrated from the `lyra-ux-templates-main`
 * reference app's own Header.tsx (see that repo's Header/Sidebar/ShellPage
 * for the source pattern). Adds two things the page's previous plain
 * `AppHeader` didn't have: a click-to-open `AppMenu` app-switcher under the
 * app name (rather than a static label), and the shared `app-icon.svg`
 * mark in place of `CXoneSmiley` (per that repo's own CLAUDE.md: "never
 * CXoneSmiley or a one-off hand-rolled SVG").
 *
 * This app only has one real "app" (Agent Configuration / Desktop
 * Profiles), so the menu's single group has one active item rather than
 * the template's 3-app switcher — the interactive shell (open/close on
 * outside click and Escape) is what's being migrated, not a fabricated
 * multi-app taxonomy this project doesn't have.
 */
export function AppShellHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const appMenuGroups: AppMenuGroup[] = [
    {
      items: [{ label: "Agent Configuration", active: true }],
    },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  return (
    <>
    <AppHeader
      appName={
        <div className="relative">
          <AppName
            ref={triggerRef}
            icon={<img src={appIcon} alt="" className="h-6 w-6" />}
            name="Agent Configuration"
            onClick={() => setMenuOpen((v) => !v)}
          />
          {menuOpen && (
            <div ref={menuRef} className="absolute left-0 top-full z-50 mt-1">
              <AppMenu groups={appMenuGroups} footer={<CXoneLogo />} />
            </div>
          )}
        </div>
      }
      actions={
        <>
          <Button
            variant="success"
            size="lg"
            className="mr-1"
            onClick={() => setIdeasOpen(true)}
          >
            <Presentation className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Additional Ideas
          </Button>
          <ActionIconButton size="xl" title="Help">
            <CircleHelp className="h-5 w-5" strokeWidth={1.5} />
          </ActionIconButton>
          <ActionIconButton size="xl" title="Apps">
            <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />
          </ActionIconButton>
          <ActionIconButton size="xl" title="Notifications" badge={5}>
            <Bell className="h-5 w-5" strokeWidth={1.5} />
          </ActionIconButton>
          <ProfileMenu initials="JS" avatarColor="#5d6a79" groups={defaultProfileMenuGroups} showThemeToggle className="ml-1" />
        </>
      }
      className="bg-lyra-bg-surface-shell"
    />
    <AdditionalIdeasPanel open={ideasOpen} onClose={() => setIdeasOpen(false)} />
    </>
  );
}
