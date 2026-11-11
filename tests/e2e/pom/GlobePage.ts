import { readFileSync } from "node:fs";

import type { Locator, Page } from "@playwright/test";

import { OBSERVATION_PLAN_QUERY_URL } from "@/features/frames/observationPlanApi";
import { ONBOARDING_KEY } from "@/features/onboarding/onboarding";

// Frame 47-3 (ascending, HH+HV, over Colombia); its mocked plan lists 39 dates.
export const LIVE_FRAME = { id: "47-3", title: "Track 47 · Frame 3" };

const PLAN_MOCK = readFileSync(
  new URL("../mocks/observation-plan-47-3.json", import.meta.url),
  "utf8",
);

// With a selection open, the camera centres the chip in the free area right of the 392 px panel,
// left of the 288 px dock and above the 200 px timeline (1440 × 900 viewport).
const FREE_CENTRE = { x: 392 + (1440 - 392 - 288) / 2, y: 72 + (900 - 72 - 200) / 2 };
// Far enough from the centre to miss the point and marker, still inside the same NISAR frame.
const OFF_CENTRE_PX = 90;

export class GlobePage {
  private readonly page: Page;
  readonly startCard: Locator;
  readonly framesStatus: Locator;
  readonly tooltip: Locator;
  readonly panel: Locator;
  readonly panelTitle: Locator;
  readonly panelMeta: Locator;
  readonly panelClose: Locator;
  readonly panelStat: Locator;
  readonly verdict: Locator;
  readonly moreInfo: Locator;
  readonly pending: Locator;
  readonly sheet: Locator;
  readonly techLimit: Locator;
  readonly timeline: Locator;
  readonly timelineCompare: Locator;
  readonly timelineReadout: Locator;
  readonly dock: Locator;
  readonly jobChecklist: Locator;
  readonly jobError: Locator;
  readonly planPasses: Locator;
  readonly wholeGlobe: Locator;
  readonly helpButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startCard = page.getByTestId("start-card");
    this.framesStatus = page.getByTestId("frames-status");
    this.tooltip = page.getByTestId("globe-tooltip");
    this.panel = page.getByTestId("case-panel");
    this.panelTitle = page.getByTestId("panel-title");
    this.panelMeta = page.getByTestId("panel-meta");
    this.panelClose = page.getByTestId("panel-close");
    this.panelStat = page.getByTestId("panel-stat");
    this.verdict = page.getByTestId("verdict");
    this.moreInfo = page.getByTestId("more-info");
    this.pending = page.getByTestId("pending");
    this.sheet = page.getByTestId("sheet");
    this.techLimit = page.getByTestId("tech-limit");
    this.timeline = page.getByTestId("timeline");
    this.timelineCompare = page.getByTestId("timeline-compare");
    this.timelineReadout = page.getByTestId("timeline-readout");
    this.dock = page.getByTestId("layer-dock");
    this.jobChecklist = page.getByTestId("job-checklist");
    this.jobError = page.getByTestId("job-error");
    this.planPasses = page.getByTestId("plan-passes");
    this.wholeGlobe = page.getByTestId("whole-globe");
    this.helpButton = page.getByTestId("help-button");
  }

  caseRow(id: string): Locator {
    return this.page.getByTestId(`case-row-${id}`);
  }

  lens(id: string): Locator {
    return this.page.getByTestId(`lens-${id}`);
  }

  timelinePasses(kind: "base" | "target" | "meas" | "plan"): Locator {
    return this.timeline.locator(`[data-testid^="timeline-pass-"][data-kind="${kind}"]`);
  }

  // Answers every plan query with frame 47-3's dates; `failures` HTTP errors come first.
  async mockObservationPlan({ status = 200, failures = 0 } = {}): Promise<void> {
    let calls = 0;
    await this.page.route(`${OBSERVATION_PLAN_QUERY_URL}**`, (route) => {
      calls += 1;
      const failing = status !== 200 && calls <= Math.max(failures, 1);
      return route.fulfill({
        status: failing ? status : 200,
        contentType: "application/json",
        body: failing ? "{}" : PLAN_MOCK,
      });
    });
  }

  // Marks the quick tour as seen before the page loads, as on any visit after the first.
  async skipOnboarding(): Promise<void> {
    await this.page.addInitScript((key) => window.localStorage.setItem(key, "1"), ONBOARDING_KEY);
  }

  // Hover and live questions need the frames snapshot, so every test waits for it.
  async goto(query = ""): Promise<void> {
    await this.page.goto(`/explore${query}`);
    await this.page.locator('main[data-frames="success"]').waitFor({ timeout: 30_000 });
  }

  async hoverLand(): Promise<void> {
    await this.page.mouse.move(FREE_CENTRE.x + OFF_CENTRE_PX, FREE_CENTRE.y);
  }

  async clickLand(): Promise<void> {
    await this.page.mouse.click(FREE_CENTRE.x + OFF_CENTRE_PX, FREE_CENTRE.y);
  }
}
