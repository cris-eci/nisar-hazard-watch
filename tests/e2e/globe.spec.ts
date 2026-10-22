import { expect, test } from "@playwright/test";

import { CENTER_FRAME, GlobePage } from "./pom/GlobePage";

test.describe("Globe frame explorer", () => {
  let globe: GlobePage;

  test.beforeEach(async ({ page }) => {
    globe = new GlobePage(page);
  });

  test("loads the NISAR frames snapshot", async () => {
    await globe.goto();
    await expect(globe.framesStatus).toContainText("16,663 frames");
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
    await expect(globe.burnAnalysis).toContainText("Demo data");
    await expect(globe.burnedArea).toContainText("ha");
    await expect(globe.passList).toContainText("39 passes in the plan");
    await expect(page).toHaveURL(new RegExp(`frame=${CENTER_FRAME.id}`));
  });

  test("the analysis layer toggle switches between severity, before and after", async () => {
    await globe.mockObservationPlan();
    await globe.goto(`?frame=${CENTER_FRAME.id}`);
    await expect(globe.burnedArea).toBeVisible();
    await expect(globe.analysisLayer("severity")).toHaveAttribute("aria-pressed", "true");

    await globe.analysisLayer("after").click();
    await expect(globe.analysisLayer("after")).toHaveAttribute("aria-pressed", "true");
    await expect(globe.burnAnalysis).toContainText("HV backscatter on");
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
});
