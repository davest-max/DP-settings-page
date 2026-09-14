import * as React from "react";
import { useState } from "react";
import { createRoot } from "react-dom/client";

// Reuse lyra-ui's real token/theme CSS — this preview has no styles of its
// own, it's the exact same tokens the built app uses.
import "../lyra-ui/src/storybook.css";

import { CreateDesktopProfilePage } from "./create-desktop-profile-page";
import { SettingsPageTile } from "./settings-page-tile";

type View = "create-desktop-profile" | "settings-page-tile";

function ViewSwitcher({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        zIndex: 100,
        display: "flex",
        gap: 4,
        background: "#1a2733",
        borderRadius: 8,
        padding: 4,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        flexWrap: "wrap",
        maxWidth: 420,
        justifyContent: "flex-end",
      }}
    >
      {(
        [
          ["create-desktop-profile", "Create Desktop Profile"],
          ["settings-page-tile", "Settings Page (AW-35954)"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          style={{
            font: "12px/1.4 -apple-system, sans-serif",
            padding: "6px 10px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            background: view === value ? "#3b82f6" : "transparent",
            color: "#fff",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Preview() {
  const [view, setView] = useState<View>("create-desktop-profile");

  return (
    <>
      <ViewSwitcher view={view} onChange={setView} />
      {view === "create-desktop-profile" ? (
        <CreateDesktopProfilePage />
      ) : (
        <SettingsPageTile />
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Preview />);
