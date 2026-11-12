import { expect, test } from "@playwright/test";

import { GlobePage, LIVE_FRAME } from "./pom/GlobePage";

// Inside frame 47-3 (Colombia), so the question finds its frame without a measured case.
const BBOX = "-74.78,2.87,-74.73,2.91";

test.describe("Explorer: choosing an area", () => {
  let globe: GlobePage;

  test.beforeEach(async ({ page }) => {
    globe = new GlobePage(page);
    await globe.skipOnboarding();
    await globe.mockObservationPlan();
  });

  test("a rectangle of the right size asks the radar about that area", async ({ page }) => {
    // Close-up imagery tiles render slowly in software WebGL.
    test.slow();
    await globe.goto(`?frame=${LIVE_FRAME.id}`);
    await expect(globe.panelMeta).toContainText(LIVE_FRAME.title);

    await globe.tool("rectangle").click();
    await expect(globe.tool("rectangle")).toHaveAttribute("aria-pressed", "true");
    await expect(globe.areaSize).toContainText("10 × 10 km ideal · max 20 × 20 km");

    await globe.dragFromCentre({ dx: -70, dy: -50 }, { dx: 70, dy: 50 });
    await expect(globe.panelTitle).toContainText("Rectangle ·");
    await expect(globe.panelMeta).toContainText("Live question");
    await expect(page).toHaveURL(/bbox=-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*/);
    // One drawing, one question: the tool puts itself away.
    await expect(globe.tool("rectangle")).toHaveAttribute("aria-pressed", "false");
    await expect(globe.areaGuide).toBeHidden();
  });

  test("a polygon closes with a double-click", async ({ page }) => {
    test.slow();
    await globe.goto(`?frame=${LIVE_FRAME.id}`);
    await globe.tool("polygon").click();

    await globe.clickFromCentre({ dx: -80, dy: -50 });
    await globe.clickFromCentre({ dx: 80, dy: -40 });
    await expect(globe.areaGuide.getByTestId("area-finish")).toBeDisabled();
    await globe.clickFromCentre({ dx: 90, dy: 60 });
    await expect(globe.areaGuide.getByTestId("area-finish")).toBeEnabled();
    await globe.doubleClickFromCentre({ dx: -70, dy: 50 });

    await expect(globe.panelTitle).toContainText("Polygon ·");
    await expect(page).toHaveURL(/geo=-?\d/);
  });

  test("Esc cancels the shape, then puts the tool away", async () => {
    test.slow();
    await globe.goto(`?frame=${LIVE_FRAME.id}`);
    await globe.tool("polygon").click();
    await globe.clickFromCentre({ dx: -80, dy: -50 });
    await expect(globe.areaGuide.getByTestId("area-cancel")).toBeVisible();

    await globe.press("Escape");
    await expect(globe.areaGuide.getByTestId("area-cancel")).toBeHidden();
    await expect(globe.tool("polygon")).toHaveAttribute("aria-pressed", "true");
    await expect(globe.panel).toBeVisible();

    await globe.press("Escape");
    await expect(globe.tool("polygon")).toHaveAttribute("aria-pressed", "false");
    await expect(globe.panel).toBeVisible();
  });

  test("an area over the limit is explained and the centred square is offered", async ({
    page,
  }) => {
    await globe.goto();
    await globe.tool("rectangle").click();
    // At the whole-globe view a few pixels are hundreds of kilometres.
    await globe.dragFromCentre({ dx: 60, dy: -40 }, { dx: 160, dy: 60 });

    await expect(globe.areaGuide).toContainText("is over the 400 km² limit");
    await expect(globe.areaGuide).toContainText("10 × 10 km is ideal");
    await expect(globe.panel).toBeHidden();

    await globe.useSquare.click();
    await expect(globe.panelMeta).toContainText("Live question");
    await expect(globe.panelTitle).not.toContainText("Rectangle");
    await expect(page).toHaveURL(/frame=\d+-\d+/);
    await expect(globe.areaGuide).toBeHidden();
  });

  test("discarding an over-the-limit area leaves the globe as it was", async () => {
    await globe.goto();
    await globe.tool("rectangle").click();
    await globe.dragFromCentre({ dx: 60, dy: -40 }, { dx: 160, dy: 60 });
    await globe.areaGuide.getByTestId("area-dismiss").click();
    await expect(globe.areaGuide).toBeHidden();
    await expect(globe.startCard).toBeVisible();
  });

  test("a shared ?bbox= link opens the question on that area", async ({ page }) => {
    test.slow();
    await globe.goto(`?bbox=${BBOX}&lens=wildfire`);
    await expect(globe.panelTitle).toContainText("Rectangle ·");
    await expect(globe.panelMeta).toContainText("Live question");
    await expect(globe.lens("wildfire")).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(new RegExp(`bbox=${BBOX}`));
  });

  test("a link to an area no frame covers says so and keeps the start card", async () => {
    await globe.goto("?bbox=0,0,0.05,0.04");
    await expect(globe.areaNotice).toHaveText("No NISAR frame covers this area");
    await expect(globe.startCard).toBeVisible();
  });

  test("the tools are off in the guided tour and the globe does not answer clicks", async ({
    page,
  }) => {
    await globe.goto("?story=1");
    await expect(globe.tool("point")).toBeDisabled();
    await expect(globe.tool("rectangle")).toBeDisabled();
    await expect(globe.tool("polygon")).toBeDisabled();
    await globe.clickLand();
    await expect(globe.panel).toBeHidden();
    await expect(page).toHaveURL(/story=1/);
    await expect(globe.areaGuide).toBeHidden();
  });
});
