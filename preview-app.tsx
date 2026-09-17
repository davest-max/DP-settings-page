import * as React from "react";
import { createRoot } from "react-dom/client";

// Reuse lyra-ui's real token/theme CSS — this preview has no styles of its
// own, it's the exact same tokens the built app uses.
import "../lyra-ui/src/storybook.css";

import { DesktopProfilesDemo } from "./desktop-profiles-demo";

/**
 * The dev-only view switcher (3 toggle buttons floating over the page —
 * "Desktop Profiles Demo" / "Create Desktop Profile" / "Agent Settings
 * Page") is gone. `DesktopProfilesDemo` already contains every one of
 * those screens as a single continuous flow (list → create → edit, with
 * the Agent Settings Page reachable as a tab inside Create/Update), so
 * there's nothing left to switch between — this is meant to read as one
 * product demo, not three loose mockups behind a dev toggle.
 */
createRoot(document.getElementById("root")!).render(<DesktopProfilesDemo />);
