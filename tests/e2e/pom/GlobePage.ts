import { readFileSync } from "node:fs";

import type { Locator, Page } from "@playwright/test";

import { OBSERVATION_PLAN_QUERY_URL } from "@/features/frames/observationPlanApi";
import { ONBOARDING_KEY } from "@/features/onboarding/onboardingState";

// Frame 47-3 (ascending, HH+HV, over Colombia); its mocked plan lists 39 dates.
export const LIVE_FRAME = { id: "47-3", title: "Track 47 · Frame 3" };

const PLACES_URL = "**/api/v1/places**";

const readMock = (name: string): string =>
  readFileSync(new URL(`../mocks/${name}.json`, import.meta.url), "utf8");

const PLAN_MOCK = readFileSync(
  new URL("../mocks/observation-plan-47-3.json", import.meta.url),
  "utf8",
);

// With a selection open, the camera centres the chip in the free area right of the 392 px panel,
// left of the 288 px dock and above the 200 px timeline (1440 × 900 viewport).
const FREE_CENTRE = { x: 392 + (1440 - 392 - 288) / 2, y: 72 + (900 - 72 - 200) / 2 };
// Far enough from the centre to miss the point and marker, still inside the same NISAR frame.
const OFF_CENTRE_PX = 90;

type Offset = { dx: number; dy: number };

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
  readonly areaTools: Locator;
  readonly areaGuide: Locator;
  readonly areaSize: Locator;
  readonly areaNotice: Locator;
  readonly useSquare: Locator;
  readonly searchButton: Locator;
  readonly searchMenu: Locator;
  readonly searchInput: Locator;
  readonly searchError: Locator;
  readonly placeCard: Locator;
  readonly placeNoFrame: Locator;
  readonly placeAnalyse: Locator;
  // Every place search the page sent, in order.
  readonly placeRequests: string[] = [];

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
    this.areaTools = page.getByTestId("area-tools");
    this.areaGuide = page.getByTestId("area-guide");
    this.areaSize = page.getByTestId("area-size");
    this.areaNotice = page.getByTestId("area-notice");
    this.useSquare = page.getByTestId("area-use-square");
    this.searchButton = page.getByTestId("search-button");
    this.searchMenu = page.getByTestId("search-menu");
    this.searchInput = page.getByTestId("place-input");
    this.searchError = page.getByTestId("place-error");
    this.placeCard = page.getByTestId("place-card");
    this.placeNoFrame = page.getByTestId("place-no-frame");
    this.placeAnalyse = page.getByTestId("place-analyse");
  }

  placeOption(index: number): Locator {
    return this.page.getByTestId(`place-option-${index}`);
  }

  // Answers every place search with a recorded answer; `failures` problem+json 502s come first.
  async mockPlaces({ mock = "places-qadirabad", failures = 0 } = {}): Promise<void> {
    await this.page.route(PLACES_URL, (route) => {
      this.placeRequests.push(route.request().url());
      const failing = this.placeRequests.length <= failures;
      return route.fulfill({
        status: failing ? 502 : 200,
        contentType: failing ? "application/problem+json" : "application/json",
        body: failing
          ? JSON.stringify({
              title: "Place search unavailable",
              detail: "the place search did not answer correctly",
              reasonCode: "UPSTREAM_GEOCODER_ERROR",
              status: 502,
            })
          : readMock(mock),
      });
    });
  }

  tool(id: "point" | "rectangle" | "polygon"): Locator {
    return this.page.getByTestId(`tool-${id}`);
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

  // Drawing offsets are in pixels from the free-screen centre, where a close-up chip sits.
  async dragFromCentre(from: Offset, to: Offset): Promise<void> {
    const { mouse } = this.page;
    await mouse.move(FREE_CENTRE.x + from.dx, FREE_CENTRE.y + from.dy);
    await mouse.down();
    await mouse.move(FREE_CENTRE.x + to.dx, FREE_CENTRE.y + to.dy, { steps: 6 });
    await mouse.up();
  }

  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async clickFromCentre({ dx, dy }: Offset): Promise<void> {
    await this.page.mouse.click(FREE_CENTRE.x + dx, FREE_CENTRE.y + dy);
  }

  async doubleClickFromCentre({ dx, dy }: Offset): Promise<void> {
    await this.page.mouse.dblclick(FREE_CENTRE.x + dx, FREE_CENTRE.y + dy);
  }
}
