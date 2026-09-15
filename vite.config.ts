import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this as a project site at
// https://davest-max.github.io/DP-settings-page/ — every built asset URL
// needs that subpath prefix or the deployed page loads a blank body with
// 404s on /assets/*.js. `base` only affects `vite build` output; local
// `vite` dev server at :6008 is unaffected.
export default defineConfig({
  base: "/DP-settings-page/",
  plugins: [react()],
  server: {
    port: 6008,
  },
});
