import { expect, test } from "@playwright/test";

import { succeededView } from "./pom/explorationMock";
import { GlobePage, LIVE_FRAME } from "./pom/GlobePage";

test.describe("Explorer: measured cases", () => {
  let globe: GlobePage;

  test.beforeEach(async ({ page }) => {
    globe = new GlobePage(page);
    await globe.mockObservationPlan();
  });

  test("the start card lists the cases and loads the frames snapshot", async () => {
    await globe.goto();
    await expect(globe.startCard).toContainText("What did the radar see?");
    await expect(globe.framesStatus).toContainText("16,663 NISAR frames");
    await expect(globe.caseRow("qadirabad")).toContainText("Did it flood?");
    await expect(globe.caseRow("choco")).toContainText("Pending");
    await expect(globe.startCard).toContainText("Design v7 · 0.7.0");
    await expect(globe.startCard.getByTestId("intro-team")).toHaveAttribute("href", "/about");
  });

  test("a case link opens its panel with the real numbers", async ({ page }) => {
    await globe.goto("?case=qadirabad");
    await expect(globe.panelTitle).toHaveText("Qadirabad, Pakistan");
    await expect(globe.panelMeta).toContainText("Measured case");
    await expect(globe.verdict).toHaveAttribute("data-verdict", "departure");
    await expect(globe.verdict).toContainText("Changed beyond its normal range");
    await expect(globe.panelStat).toContainText("64.3%");
    await expect(globe.lens("flood_wetland")).toHaveAttribute("aria-pressed", "true");
    await expect(globe.lens("insar")).toHaveAttribute("aria-pressed", "false");
    // The band chart is demo, so its chip shows even with REAL labels hidden.
    await expect(globe.panel.getByTestId("band-chart").getByTestId("prov-demo")).toBeVisible();
    await expect(page).toHaveURL(/\?case=qadirabad$/);
  });

  test("the panel is 372 px wide, 400 px on the lens result", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await globe.goto("?case=qadirabad");
    await expect(globe.panel).toBeVisible();
    expect((await globe.panel.boundingBox())?.width).toBe(372);
    // No component sets the result width yet (#21 does); the class alone must widen it.
    await globe.panel.evaluate((panel) => panel.classList.add("x-panel--result"));
    expect((await globe.panel.boundingBox())?.width).toBe(400);
  });

  test("the layer dock drapes only real crops; HV waits for the API", async () => {
    await globe.goto("?case=qadirabad");
    await expect(globe.dock).toBeVisible();
    await expect(globe.dock.getByTestId("channel-HV")).toBeDisabled();
    await expect(globe.dock.getByTestId("channel-HV")).toHaveAttribute(
      "title",
      "Served by the backend API soon",
    );
    await globe.dock.getByTestId("layer-baseline").click();
    await expect(globe.dock.getByTestId("layer-baseline")).toHaveAttribute("aria-pressed", "true");
    await expect(globe.dock.getByTestId("channel-ratio")).toBeDisabled();
  });

  test("a case row opens the case and puts it in the link", async ({ page }) => {
    await globe.goto();
    await globe.caseRow("chokwe").click();
    await expect(globe.panelTitle).toHaveText("Chókwè, Mozambique");
    await expect(page).toHaveURL(/\?case=chokwe$/);
  });

  test("More information opens the sheet; Technical adds the limits; Esc closes", async ({
    page,
  }) => {
    await globe.goto("?case=qadirabad");
    await globe.moreInfo.click();
    await expect(globe.sheet).toContainText("What the radar measured at Qadirabad");
    await expect(globe.sheet).toContainText("Real figure · NISAR-Modeling report");
    await expect(globe.sheet.getByTestId("compare-split")).toBeVisible();
    await expect(globe.sheet.getByTestId("sheet-verdict-departure")).toHaveAttribute(
      "data-on",
      "true",
    );
    await expect(globe.techLimit).toBeHidden();

    await page.getByTestId("read-technical").click();
    await expect(globe.techLimit).toContainText("precision 29.7%, recall 64.3%, IoU 25.5%");

    await page.keyboard.press("Escape");
    await expect(globe.sheet).toBeHidden();
    await expect(globe.panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(globe.panel).toBeHidden();
    await expect(page).not.toHaveURL(/case=/);
  });

  test("the timeline compares baseline and target; planned passes aren't clickable", async () => {
    await globe.goto("?case=qadirabad");
    await expect(globe.timeline).toContainText("Planned · a promise, not data");
    await expect(globe.timeline.getByTestId("prov-demo-dates")).toHaveText("DEMO DATES");
    await expect(globe.timelinePasses("plan")).toHaveCount(2);
    for (const planned of await globe.timelinePasses("plan").all())
      await expect(planned).toBeDisabled();
    await expect(globe.timelinePasses("plan").first()).toHaveAttribute("data-next", "true");
    await expect(globe.timelinePasses("plan").last()).not.toHaveAttribute("data-next");
    await expect(globe.timeline.getByTestId("timeline-next")).toHaveText("Next");
    await expect(globe.timeline.getByTestId("timeline-planned-legend")).toContainText(
      "next 16 Nov",
    );

    await expect(globe.timelineCompare).toHaveAttribute("aria-pressed", "true");
    await expect(globe.timelineReadout).toHaveText(
      "Baseline (3 passes, 20 Jun – 14 Jul) ↔ Target 26 Jul 2026",
    );
    await globe.timelinePasses("meas").first().click();
    await expect(globe.timelineCompare).toHaveAttribute("aria-pressed", "false");
    await expect(globe.timelineReadout).toHaveText("7 Aug 2026 · measured pass");
  });

  test("Chocó shows event context only, no chart and no timeline", async () => {
    await globe.goto("?case=choco");
    await expect(globe.pending).toContainText(
      "No measurement yet. We're waiting on InSAR corrections before showing anything.",
    );
    await expect(globe.panel.getByTestId("band-chart")).toHaveCount(0);
    await expect(globe.timeline).toHaveCount(0);
    await expect(globe.panel.getByTestId("prov-todo").first()).toBeVisible();
  });

  test("hiding REAL labels keeps every DEMO chip", async ({ page }) => {
    await globe.goto("?case=qadirabad");
    await expect(globe.panel.getByTestId("prov-real").first()).toBeVisible();
    await globe.helpButton.click();
    await page.getByTestId("toggle-real").click();
    await expect(globe.panel.getByTestId("prov-real")).toHaveCount(0);
    await expect(globe.panel.getByTestId("prov-demo").first()).toBeVisible();
    // The guided tour is live now: the switch stays on Explore while a case is open.
    await expect(page.getByTestId("mode-tour")).toHaveAttribute("aria-pressed", "false");
  });

  test("the whole-globe button closes the case and clears the link", async ({ page }) => {
    await globe.goto("?case=richmond");
    await expect(globe.panel).toBeVisible();
    await globe.wholeGlobe.click();
    await expect(globe.panel).toBeHidden();
    await expect(globe.startCard).toBeVisible();
    await expect(page).not.toHaveURL(/case=/);
  });

  // Regression: leaving the explorer with a layer on the globe crashed the app (blank page),
  // because entity cleanup ran after the Cesium viewer was destroyed.
  test("leaving the explorer with a case open shows the method page", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await globe.goto("?case=qadirabad");
    await expect(globe.dock).toBeVisible();
    await page.getByTestId("nav-method").click();
    await expect(page).toHaveURL(/\/method$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("Explorer: live questions", () => {
  test("a frame link asks the radar: the passes are NASA's plan, the answer is the backend's", async ({
    page,
  }) => {
    const globe = new GlobePage(page);
    await globe.mockObservationPlan();
    await globe.mockExplorations({ first: succeededView() });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);
    await expect(globe.panelMeta).toContainText(`Live question · ${LIVE_FRAME.title}`);
    await expect(globe.planPasses).toContainText("39 passes in the plan");
    await expect(globe.planPasses.getByTestId("prov-real")).toBeVisible();
    await expect(globe.verdict).toBeVisible();
    await expect(globe.verdict.getByTestId("prov-real")).toBeVisible();
    await expect(globe.verdict.getByTestId("prov-demo")).toHaveCount(0);
    await expect(globe.verdict.getByTestId("prov-demo-dates")).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`frame=${LIVE_FRAME.id}`));
  });

  test("the frame's next planned pass is the earliest one after today", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-11-10T12:00:00Z"));
    const globe = new GlobePage(page);
    await globe.mockObservationPlan();
    await globe.mockExplorations({ first: succeededView() });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);
    const next = globe.planPasses.locator('li[data-next="true"]');
    await expect(next).toHaveCount(1);
    await expect(next).toContainText("20 Nov 2026");
    await expect(next).toContainText("next pass");
  });

  test("an archive failure on the plan says so and retries, without touching the answer", async ({
    page,
  }) => {
    const globe = new GlobePage(page);
    await globe.mockObservationPlan({ status: 502, failures: 1 });
    await globe.mockExplorations({ first: succeededView() });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);
    await expect(page.getByTestId("plan-error")).toContainText(
      "We couldn't reach the radar archive",
    );
    await expect(globe.verdict).toBeVisible();
    await page.getByTestId("plan-error").getByRole("button", { name: "Try again" }).click();
    await expect(globe.planPasses).toContainText("39 passes in the plan");
  });

  test("a full queue asks to wait; Pick a measured case goes back to the list", async ({
    page,
  }) => {
    const globe = new GlobePage(page);
    await globe.mockObservationPlan();
    await globe.mockExplorations({
      startProblems: [
        { status: 503, reasonCode: "QUEUE_FULL", detail: "5 explorations are running" },
      ],
    });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);
    await expect(globe.jobError).toContainText("Lots of people are asking right now.");
    await globe.jobError.getByRole("button", { name: "Pick a measured case" }).click();
    await expect(globe.startCard).toBeVisible();
  });

  test("another lens on a case re-runs it as a live question", async ({ page }) => {
    const globe = new GlobePage(page);
    await globe.mockObservationPlan();
    await globe.mockExplorations({ first: succeededView() });
    await globe.goto("?case=qadirabad");
    await globe.lens("vegetation_disturbance").click();
    await expect(globe.panelMeta).toContainText("Live question");
    await expect(globe.lens("vegetation_disturbance")).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/lens=vegetation_disturbance/);

    await globe.lens("flood_wetland").click();
    await expect(globe.panelTitle).toHaveText("Qadirabad, Pakistan");
  });

  test("hovering land shows its NISAR frame; a click picks the spot and Analyze asks about it", async ({
    page,
  }) => {
    // Close-up imagery tiles render slowly in software WebGL.
    test.slow();
    const globe = new GlobePage(page);
    await globe.mockObservationPlan();
    await globe.mockCoverage();
    await globe.mockExplorations({ first: succeededView() });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);
    await expect(globe.panelMeta).toContainText(LIVE_FRAME.title);

    await globe.hoverLand();
    await expect(globe.tooltip).toContainText(`${LIVE_FRAME.title} · HH+HV`);
    await expect(globe.tooltip).toContainText("click to ask the radar");

    const before = await globe.panelTitle.textContent();
    await globe.clickLand();
    // Step 2: the click only checks the catalog; nothing runs until Analyze.
    await expect(globe.placeCard).toHaveAttribute("data-state", "ready");
    await expect(globe.panel).toBeHidden();
    await globe.placeAnalyse.click();
    await expect(globe.panelTitle).not.toHaveText(before ?? "");
    await expect(globe.panelMeta).toContainText(LIVE_FRAME.title);
  });
});

test.describe("Explorer: v8 top bar", () => {
  let globe: GlobePage;

  test.beforeEach(async ({ page }) => {
    globe = new GlobePage(page);
    await globe.skipOnboarding();
    await globe.mockObservationPlan();
  });

  test("search pill and L | S follow the wordmark; an open case adds no context pill", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await globe.goto("?case=qadirabad");
    await expect(globe.panel).toBeVisible();
    await expect(globe.searchPill).toBeVisible();
    await expect(page.getByTestId("source-switch")).toBeVisible();
    await expect(page.getByTestId("context-chip")).toHaveCount(0);
    // Hidden until the backend accepts a direction: a choice that isn't sent would mislead.
    await expect(page.getByTestId("direction-switch")).toHaveCount(0);

    const pill = await globe.searchPill.boundingBox();
    expect(pill?.width).toBeCloseTo(340, 0);
  });

  test("the mode switch hides below 1280 px and the page links below 1120 px", async ({ page }) => {
    await page.setViewportSize({ width: 1300, height: 900 });
    await globe.goto();
    await expect(page.getByTestId("mode-explore")).toBeVisible();
    await expect(page.getByTestId("nav-cases")).toBeVisible();

    await page.setViewportSize({ width: 1200, height: 900 });
    await expect(page.getByTestId("mode-explore")).toBeHidden();
    await expect(page.getByTestId("nav-cases")).toBeVisible();

    await page.setViewportSize({ width: 1100, height: 900 });
    await expect(page.getByTestId("nav-cases")).toBeHidden();
    await expect(page.getByTestId("nav-method")).toBeHidden();
  });
});

test.describe("Explorer: pick a spot (step 2)", () => {
  let globe: GlobePage;

  test.beforeEach(async ({ page }) => {
    globe = new GlobePage(page);
    await globe.skipOnboarding();
    await globe.mockObservationPlan();
  });

  test("a land spot shows the catalog's real dates, the 36-day gap and the expected wait", async ({
    page,
  }) => {
    await globe.mockCoverage();
    await globe.goto();
    await globe.searchInput.fill("32.30, 73.50");
    await globe.searchInput.press("Enter");

    await expect(globe.placeCard).toHaveAttribute("data-state", "ready");
    await expect(globe.placeCard).toContainText("NEW SPOT · LIVE ANALYSIS");
    await expect(page.getByTestId("spot-area")).toHaveText(/AREA\s*10\.24 km square/);
    await expect(page.getByTestId("spot-wait")).toContainText("1–4 min");
    await expect(page.getByTestId("spot-wait")).toContainText("plus any queue");
    await expect(page.getByTestId("spot-catalog")).toContainText("IN THE CATALOG · ASCENDING");
    await expect(page.getByTestId("spot-catalog")).toContainText("LAST 5 MONTHS");
    await expect(page.getByTestId("spot-catalog").getByRole("listitem")).toHaveCount(5);
    await expect(page.getByTestId("spot-gap")).toContainText(
      "The 36-day gap after 14 Jul is real.",
    );
    await expect(globe.placeAnalyse).toHaveText(/Analyze this spot/);

    await page.getByTestId("spot-cases").click();
    await expect(globe.placeCard).toBeHidden();
    await expect(globe.startCard).toBeVisible();
  });

  test("an ocean click shows No NISAR data here and the nearest known case", async ({ page }) => {
    await globe.mockCoverage({ mock: "coverage-open-ocean" });
    await globe.goto();
    await globe.clickOcean();

    await expect(globe.placeCard).toHaveAttribute("data-state", "noCoverage");
    await expect(globe.placeCard).toContainText("CLICKED POINT · NO COVERAGE");
    await expect(page.getByTestId("place-title")).toHaveText("No NISAR data here");
    await expect(page.getByTestId("spot-nodata")).toHaveText(
      "The catalog has no compatible passes at this point. Over open ocean NISAR data isn't analyzed here.",
    );
    await expect(globe.spotNearest).toContainText(/Nearest known case · about [\d,]+ km/);
    expect(globe.coverageRequests).toHaveLength(1);

    await page.getByTestId("spot-another").click();
    await expect(globe.placeCard).toBeHidden();
    await expect(globe.startCard).toBeVisible();

    await globe.clickOcean();
    await globe.spotNearest.click();
    await expect(globe.panel).toBeVisible();
    await expect(globe.placeCard).toBeHidden();
  });

  test("a catalog that doesn't answer says so and Try again asks once more", async ({ page }) => {
    await globe.mockCoverage({ failures: 1 });
    await globe.goto();
    await globe.searchInput.fill("32.30, 73.50");
    await globe.searchInput.press("Enter");

    await expect(page.getByTestId("spot-error")).toContainText(
      "We couldn't reach the radar archive",
    );
    await page.getByTestId("spot-error").getByRole("button", { name: "Try again" }).click();
    await expect(globe.placeCard).toHaveAttribute("data-state", "ready");
    expect(globe.coverageRequests).toHaveLength(2);
  });
});
