import * as React from "react";
import { useState } from "react";
import { AgentSettingsDisplayKeyboard } from "./agent-settings-display-keyboard";

export function AgentSettingsDisplayKeyboardPreview() {
  const [locked, setLocked] = useState(false);
  const [twentyFourHourTime, setTwentyFourHourTime] = useState(true);
  const [panelOpenInBrowserGeneral, setPanelOpenInBrowserGeneral] = useState(false);
  const [panelOpenInBrowserPageActionOnly, setPanelOpenInBrowserPageActionOnly] =
    useState(false);
  const [finalMessageSortOrder, setFinalMessageSortOrder] = useState("newest-default");
  const [sendWithEnter, setSendWithEnter] = useState("all-except-email");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--lyra-color-bg-surface-shell, #f3f5f6)",
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Dev-only toggle to compare the editable vs. admin-locked state —
          not part of the design, just this preview harness. */}
      <label
        className="lyra-body-sm text-lyra-fg-secondary"
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        <input
          type="checkbox"
          checked={locked}
          onChange={(e) => setLocked(e.target.checked)}
        />
        Simulate admin-locked Desktop Profile
      </label>

      <AgentSettingsDisplayKeyboard
        twentyFourHourTime={twentyFourHourTime}
        onTwentyFourHourTimeChange={setTwentyFourHourTime}
        panelOpenInBrowserGeneral={panelOpenInBrowserGeneral}
        onPanelOpenInBrowserGeneralChange={setPanelOpenInBrowserGeneral}
        panelOpenInBrowserPageActionOnly={panelOpenInBrowserPageActionOnly}
        onPanelOpenInBrowserPageActionOnlyChange={setPanelOpenInBrowserPageActionOnly}
        finalMessageSortOrder={finalMessageSortOrder}
        onFinalMessageSortOrderChange={setFinalMessageSortOrder}
        sendWithEnter={sendWithEnter}
        onSendWithEnterChange={setSendWithEnter}
        locked={locked}
      />
    </div>
  );
}
