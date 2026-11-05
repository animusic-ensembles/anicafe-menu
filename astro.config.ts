import { defineConfig } from "astro/config";

export default defineConfig({
  base: "/anicafe-menu/",
  // Keeps the existing VITE_ Firebase variables and repository secrets working.
  vite: { envPrefix: "VITE_" },
});
