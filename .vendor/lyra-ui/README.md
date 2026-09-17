# Vendored lyra-ui snapshot

This is a point-in-time copy of `src/`, `tailwind-tokens.cjs`,
`package.json`, and `package-lock.json` from the real `lyra-ui` project (a
sibling folder on Dave's machine, not itself a git repo or published
package). It exists only so the GitHub Actions build has something to
import — the app's `.tsx` files import from `"../lyra-ui/src"`, and
`tailwind.config.js` requires `"../lyra-ui/tailwind-tokens.cjs"` for its
color tokens. CI's build step (`.github/workflows/deploy.yml`) copies
this snapshot out to that exact sibling path, installs its dependencies,
then symlinks this repo's own `node_modules` to it — mirroring how the
real `lyra-ui` folder and its symlinked `node_modules` work locally.

Local development is unaffected — Dave's machine already has the real
`lyra-ui` folder in place and never reads this copy.

## Refreshing this snapshot

When lyra-ui's components or tokens change and you want the deployed
site to pick up the difference, re-copy it from the repo root:

```bash
rm -rf .vendor/lyra-ui/src
cp -R ../lyra-ui/src .vendor/lyra-ui/src
cp ../lyra-ui/tailwind-tokens.cjs .vendor/lyra-ui/tailwind-tokens.cjs
cp ../lyra-ui/package.json .vendor/lyra-ui/package.json
cp ../lyra-ui/package-lock.json .vendor/lyra-ui/package-lock.json
git add .vendor/lyra-ui
git commit -m "Refresh vendored lyra-ui snapshot"
```

Vendored: 2026-09-17. Verified against a from-scratch reproduction of the
CI steps (fresh checkout → materialize sibling → npm ci → npm install →
symlink → npm run build) before this was relied on — see the deploy
workflow's comments for a note on step order (npm install must run
before the node_modules symlink is created, or it gets deleted).
