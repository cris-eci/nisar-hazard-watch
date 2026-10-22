import { expect, test } from "@playwright/test";

import { CENTER_FRAME, GlobePage } from "./pom/GlobePage";

test.describe("Globe frame explorer", () => {
  let globe: GlobePage;

  test.beforeEach(async ({ page }) => {
    globe = new GlobePage(page);
    await globe.skipWelcome();
  });

  test("loads the NISAR frames snapshot", async () => {
    await globe.goto();
    await expect(globe.framesStatus).toContainText("16,663 frames");
    // The deployed config enables wildfire and earthquake, so the picker shows both.
    await expect(globe.hazardPicker).toContainText("Wildfire");
    await expect(globe.hazardPicker).toContainText("Earthquake");
  });

  test("hovering the globe shows the frame under the cursor", async () => {
    await globe.goto();
    await globe.hoverCenter();
    await expect(globe.tooltip).toContainText(CENTER_FRAME.title);
    await expect(globe.tooltip).toContainText("HH+HV");
  });

  test("clicking a frame opens its passes and burn analysis", async ({ page }) => {
    await globe.mockObservationPlan();
    await globe.goto();
    await globe.clickCenter();

    await expect(globe.panelTitle).toHaveText(CENTER_FRAME.title);
    await globe.waitForAnalysis();
    await expect(globe.analysisCard).toContainText("Demo data");
    await expect(globe.affectedArea).toContainText("ha");
    await expect(globe.passList).toContainText("39 passes in the plan");
    await expect(page).toHaveURL(new RegExp(`frame=${CENTER_FRAME.id}`));
  });

  test("the analysis layer toggle switches between severity, before and after", async () => {
    await globe.mockObservationPlan();
    await globe.goto(`?frame=${CENTER_FRAME.id}`);
    await globe.waitForAnalysis();
    await expect(globe.analysisLayer("severity")).toHaveAttribute("aria-pressed", "true");

    await globe.analysisLayer("after").click();
    await expect(globe.analysisLayer("after")).toHaveAttribute("aria-pressed", "true");
    await expect(globe.analysisCard).toContainText("HV backscatter on");
  });

  test("Escape closes the panel and clears the link", async ({ page }) => {
    await globe.mockObservationPlan();
    await globe.goto(`?frame=${CENTER_FRAME.id}`);
    await expect(globe.panel).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(globe.panel).toBeHidden();
    await expect(page).not.toHaveURL(/frame=/);
  });

  test("the whole-globe button closes the panel and clears the link", async ({ page }) => {
    await globe.mockObservationPlan();
    await globe.goto(`?frame=${CENTER_FRAME.id}`);
    await expect(globe.panel).toBeVisible();

    await globe.wholeGlobe.click();
    await expect(globe.panel).toBeHidden();
    await expect(page).not.toHaveURL(/frame=/);
  });

  test("a shared link opens the frame directly", async () => {
    await globe.mockObservationPlan();
    await globe.goto(`?frame=${CENTER_FRAME.id}`);
    await expect(globe.panelTitle).toHaveText(CENTER_FRAME.title);
  });

  test("a shared link keeps the hazard", async ({ page }) => {
    await globe.mockObservationPlan();
    await globe.goto(`?frame=${CENTER_FRAME.id}&hazard=flood`);
    await expect(globe.analysisCard).toContainText("Flood analysis");

    await page.getByTestId("hazard-wildfire").click();
    await expect(page).not.toHaveURL(/hazard=/);
    await expect(page).toHaveURL(new RegExp(`frame=${CENTER_FRAME.id}`));
  });

  test("a failed plan request shows an error with retry", async () => {
    await globe.mockObservationPlan({ status: 500 });
    await globe.goto(`?frame=${CENTER_FRAME.id}`);
    await expect(globe.panel.getByRole("alert")).toContainText(
      "Could not load the observation plan",
    );
    await expect(globe.panel.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("the pass toggle switches the frame geometry", async () => {
    await globe.goto();
    await expect(globe.passToggle("A")).toHaveAttribute("aria-pressed", "true");

    await globe.passToggle("D").click();
    await expect(globe.passToggle("D")).toHaveAttribute("aria-pressed", "true");
    await globe.hoverCenter();
    await expect(globe.tooltip).toContainText("Descending pass");
  });

  test("a featured earthquake opens its frame, event context and ground motion", async ({
    page,
  }) => {
    await globe.mockObservationPlan();
    await globe.goto();
    await globe.event("venezuela-2026").click();

    await expect(globe.panelTitle).toHaveText("Track 162 · Frame 7");
    await expect(globe.eventBanner).toContainText("M7.5 earthquake");
    await expect(globe.analysisCard).toContainText("2026-06-13 → 2026-06-25");
    await globe.maxDisplacement.waitFor({ timeout: 30_000 });
    await expect(globe.maxDisplacement).toContainText("cm");
    await expect(page).toHaveURL(/event=venezuela-2026/);

    await globe.analysisLayer("fringes").click();
    await expect(globe.analysisLayer("fringes")).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("Onboarding and pages", () => {
  test("the welcome dialog can start the tour on a featured event", async ({ page }) => {
    const globe = new GlobePage(page);
    await globe.mockObservationPlan();
    await page.goto("/explore");
    await expect(globe.welcome).toBeVisible();

    await page.getByTestId("welcome-tour").click();
    await expect(globe.welcome).toBeHidden();
    await expect(globe.eventBanner).toBeVisible();
  });

  // Regression: leaving the explorer with an analysis on the globe crashed the app (blank page),
  // because entity cleanup ran after the Cesium viewer was destroyed.
  test("leaving the explorer with an analysis open shows the method page", async ({ page }) => {
    const globe = new GlobePage(page);
    await globe.skipWelcome();
    await globe.mockObservationPlan();
    await globe.goto("?event=venezuela-2026");
    await globe.maxDisplacement.waitFor({ timeout: 30_000 });

    await page.getByRole("link", { name: "Method", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Method & validation");
  });

  test("the landing page leads to the explorer and the method page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("See how Earth changes");

    await page.getByRole("link", { name: "Method & validation" }).click();
    await expect(page).toHaveURL(/\/method$/);
    await expect(page.getByRole("heading", { name: "Validation", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Launch the explorer" }).click();
    await expect(page).toHaveURL(/\/explore$/);
  });
});
