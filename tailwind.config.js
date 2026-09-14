// Mirrors lyra-ui/tailwind.config.js exactly (same ESM `export default` +
// internal `require()` pattern — Tailwind's own config loader already
// tolerates `require` inside this ESM file, same as lyra-ui's copy), adjusted
// only for this folder's location as a sibling: relative path to lyra-ui's
// own tailwind-tokens.cjs, and `content` globs that also scan lyra-ui's src
// since this project renders its actual components directly from source —
// see this folder's README for why. Tailwind only emits CSS for utility
// classes it can find as literal text in a scanned file, so without this,
// Vite's plain PostCSS pass never runs Tailwind at all and every
// `bg-lyra-*`/`flex`/`rounded-*` class in every component sits inert.
//
// If lyra-ui's own tailwind.config.js theme changes, mirror the change here
// too — same duplication tradeoff already called out in this folder's README
// for the sibling-import approach in general.
const lyraColors = require("../lyra-ui/tailwind-tokens.cjs");

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.tsx",
    "./stories/**/*.tsx",
    "../lyra-ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      /* ── Lyra Spacing Scale (4px base unit) ── */
      spacing: {
        "lyra-0": "var(--lyra-spacing-0)",
        "lyra-1": "var(--lyra-spacing-1)",
        "lyra-2": "var(--lyra-spacing-2)",
        "lyra-3": "var(--lyra-spacing-3)",
        "lyra-4": "var(--lyra-spacing-4)",
        "lyra-5": "var(--lyra-spacing-5)",
        "lyra-6": "var(--lyra-spacing-6)",
        "lyra-7": "var(--lyra-spacing-7)",
        "lyra-8": "var(--lyra-spacing-8)",
        "lyra-9": "var(--lyra-spacing-9)",
      },
      /* ── Lyra Colors — sourced from lyra-ui/tailwind-tokens.cjs ── */
      colors: {
        ...lyraColors,
        "cxone-navy": "#2a2d32",
      },
      /* ── Lyra Border Radius ── */
      borderRadius: {
        "lyra-none":  "var(--lyra-radius-none)",
        "lyra-xs":    "var(--lyra-radius-xs)",
        "lyra-sm":    "var(--lyra-radius-sm)",
        "lyra-md":    "var(--lyra-radius-md)",
        "lyra-lg":    "var(--lyra-radius-lg)",
        "lyra-xl":    "var(--lyra-radius-xl)",
        "lyra-round": "var(--lyra-radius-round)",
      },
      /* ── Font Family ── */
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
