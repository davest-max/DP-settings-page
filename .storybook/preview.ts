import type { Preview, Decorator } from "@storybook/react";
import React from "react";
// Reuse lyra-ui's actual token/theme CSS so `lyra-*` classes render
// correctly here too — this folder has no design tokens of its own.
import "../../lyra-ui/src/storybook.css";

/* ── Global dark mode toggle — copied from lyra-ui/.storybook/preview.ts
   so this standalone Storybook matches lyra-ui's own behavior. ── */
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme ?? "light";

  document.documentElement.setAttribute("data-theme", theme);
  const shellColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--lyra-color-bg-surface-shell")
    .trim();
  if (shellColor) {
    document.body.style.backgroundColor = shellColor;
  }

  return React.createElement(Story);
};

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme for all components",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "lyra-base",
      values: [
        { name: "lyra-base", value: "#ffffff" },
        { name: "lyra-shell", value: "#f3f5f6" },
        { name: "dark", value: "#1a2733" },
      ],
    },
  },
};

export default preview;
