import { readFileSync } from "node:fs";

import type { Locator, Page } from "@playwright/test";

import { OBSERVATION_PLAN_QUERY_URL } from "@/features/frames/observationPlanApi";

// Frame 47-3 (ascending, HH+HV) sits under the screen centre at the start view over Colombia.
export const CENTER_FRAME = { id: "47-3", title: "Track 47 · Frame 3" };

const PLAN_MOCK = readFileSync(
  new URL("../mocks/observation-plan-47-3.json", import.meta.url),
  "utf8",
);

export class GlobePage {
  private readonly page: Page;
  readonly framesStatus: Locator;
  readonly tooltip: Locator;
  readonly panel: Locator;
  readonly panelTitle: Locator;
  readonly panelClose: Locator;
  readonly analysisCard: Locator;
  readonly passList: Locator;
  readonly wholeGlobe: Locator;
  readonly affectedArea: Locator;
  readonly hazardPicker: Locator;
  readonly maxDisplacement: Locator;
  readonly eventBanner: Locator;
  readonly welcome: Locator;

  constructor(page: Page) {
    this.page = page;
    this.framesStatus = page.getByTestId("frames-status");
    this.tooltip = page.getByTestId("frame-tooltip");
    this.panel = page.getByTestId("frame-panel");
    this.panelTitle = page.getByTestId("frame-panel-title");
    this.panelClose = page.getByTestId("frame-panel-close");
    this.analysisCard = page.getByTestId("analysis-card");
    this.passList = page.getByTestId("pass-list");
    this.wholeGlobe = page.getByTestId("whole-globe");
    this.affectedArea = page.getByTestId("affected-area");
    this.hazardPicker = page.getByRole("group", { name: "Hazard" });
    this.maxDisplacement = page.getByTestId("max-displacement");
    this.eventBanner = page.getByTestId("event-banner");
    this.welcome = page.getByTestId("welcome-dialog");
  }

  event(id: string): Locator {
    return this.page.getByTestId(`event-${id}`);
  }

  analysisLayer(layer: "severity" | "before" | "after" | "displacement" | "fringes"): Locator {
    return this.page.getByTestId(`analysis-layer-${layer}`);
  }

  passToggle(pass: "A" | "D"): Locator {
    return this.page.getByTestId(`pass-toggle-${pass}`);
  }

  async mockObservationPlan(response: { status: number } = { status: 200 }): Promise<void> {
    await this.page.route(`${OBSERVATION_PLAN_QUERY_URL}**`, (route) =>
      route.fulfill({
        status: response.status,
        contentType: "application/json",
        body: response.status === 200 ? PLAN_MOCK : "{}",
      }),
    );
  }

  // The demo analysis takes ~1.5 s with a GPU, but software WebGL starves the main thread and
  // stretches it to ~10 s when tests run in parallel.
  async waitForAnalysis(): Promise<void> {
    await this.affectedArea.waitFor({ timeout: 30_000 });
  }

  // Marks the welcome dialog as seen so it does not cover the globe; its own test clears this.
  async skipWelcome(): Promise<void> {
    await this.page.addInitScript(() =>
      window.localStorage.setItem("nisar-watch:welcome-dismissed", "1"),
    );
  }

  async goto(query = ""): Promise<void> {
    await this.page.goto(`/explore${query}`);
    await this.framesStatus.filter({ hasText: "frames from the NISAR Observation Plan" }).waitFor();
  }

  private center(): { x: number; y: number } {
    const viewport = this.page.viewportSize();
    if (viewport === null) throw new Error("Viewport size is not set");
    return { x: viewport.width / 2, y: viewport.height / 2 };
  }

  async hoverCenter(): Promise<void> {
    const { x, y } = this.center();
    await this.page.mouse.move(x, y);
  }

  async clickCenter(): Promise<void> {
    const { x, y } = this.center();
    await this.page.mouse.click(x, y);
  }
}
