import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI) && process.env.CI !== "false";
// Own port and env, so tests never depend on a developer's running server or .env.local.
const PORT = 5174;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  tsconfig: "./tsconfig.node.json", // resolves the @/ alias in tests
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // Each test renders the globe in software WebGL; more workers starve the CPU.
  workers: 2,
  reporter: [["list"], ["html", { outputFolder: "test-results/html-report", open: "never" }]],
  outputDir: "test-results/test-output",
  // Software WebGL is slow; same budget as the work monorepo.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    // Stops the idle spin so the frame under the screen centre is predictable.
    reducedMotion: "reduce",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Headless Chromium has no GPU; SwiftShader gives Cesium a software WebGL context.
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    // The production build, as deployed: no dev-server reloads mid-test.
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    // Process env beats .env files in Vite: pin the default config (wildfire only, demo data).
    env: { VITE_ENABLED_HAZARDS: "wildfire", VITE_ANALYSIS_API_URL: "" },
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
