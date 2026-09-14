# Panel Open in Browser setting (AW-61850)

Standalone build of the "Panel Open in Browser" setting from Figma
(`DP - Panel Open in Browser setting - AW-61850`), kept **outside**
`lyra-ui` for now rather than merged into the library.

## What's here

- `setting-row.tsx` — a new atom: icon + label + trailing control row for
  settings lists, with a locked/disabled state (tooltip explains why).
- `agent-settings-display-keyboard.tsx` — the agent-facing Settings panel's
  "Display & Keyboard" tab, including the two new switches from AW-61850:
  **Panel Open in Browser: General** and **Panel Open in Browser: Page
  Action Only**. Fully controlled (no internal state) per lyra-ui's
  CONTRIBUTING.md §4.
- `stories/` — Storybook stories for both (`Default`, `Locked`,
  `AllVariants`), written the same way lyra-ui's own stories are.

## How it depends on lyra-ui

Both components import shared primitives (`cn`, `Icon`, `Tooltip`,
`Switch`, `Select`, `Divider`) directly from the sibling `../lyra-ui/src`
folder rather than from a built/published package — this folder assumes
it always sits next to `lyra-ui` on disk (as it does under
`Lyra UI prototypes/`). If this folder is ever moved somewhere `lyra-ui`
isn't a sibling of, those import paths need to change to point at
`@nicecxone/lyra-ui` instead (see lyra-ui's own README for the two
supported install methods).

`node_modules` here is a symlink to `../lyra-ui/node_modules` — it isn't a
real install, just a way to reuse lyra-ui's already-installed `react`,
`lucide-react`, etc. for type-checking. Delete the symlink and run your
own `npm install` if this ever becomes its own real project.

## If this gets promoted back into lyra-ui

Both files were originally authored inside `lyra-ui/src/components/` and
follow its conventions exactly (forwardRef, displayName, CVA-free plain
Tailwind + lyra tokens, controlled props, Storybook `Default`/
`AllVariants` stories). Moving them back is a straight copy: drop
`setting-row.tsx` and `agent-settings-display-keyboard.tsx` into
`lyra-ui/src/components/`, the two files under `stories/` into
`lyra-ui/src/components/__stories__/`, switch their sibling
`../lyra-ui/src` imports back to the relative `./` paths lyra-ui's other
components use, and re-add the exports to `lyra-ui/src/index.ts`
(previously present there, removed when this was pulled out).
