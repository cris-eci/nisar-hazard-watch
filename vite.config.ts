/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const CESIUM_BUILD = "node_modules/cesium/Build/Cesium";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Cesium fetches workers and assets at runtime, so they must be served as static files.
    viteStaticCopy({
      targets: ["Workers", "ThirdParty", "Assets", "Widgets"].map((dir) => ({
        src: `${CESIUM_BUILD}/${dir}`,
        dest: "cesium",
        rename: { stripBase: 4 }, // drops node_modules/cesium/Build/Cesium
      })),
    }),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173 },
  test: { include: ["tests/unit/**/*.test.ts"] },
});
