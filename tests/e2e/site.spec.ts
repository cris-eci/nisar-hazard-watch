import { expect, test } from "@playwright/test";

test.describe("Landing and about pages", () => {
  test("the landing compare slider moves with the arrow keys", async ({ page }) => {
    await page.goto("/");
    const slider = page.getByTestId("compare-slider");
    // Reduced motion skips the intro tween, so the split starts in the middle.
    await expect(slider).toHaveAttribute("aria-valuenow", "50");
    await slider.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(slider).toHaveAttribute("aria-valuenow", "45");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveAttribute("aria-valuenow", "55");
  });

  test("the landing events open the explorer on that event", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("landing-event-kumamoto-2026").click();
    await expect(page).toHaveURL(/\/explore\?event=kumamoto-2026$/);
  });

  test("the landing page leads to the explorer and the method page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Earth, without the clouds.");

    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Method" })
      .click();
    await expect(page).toHaveURL(/\/method$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "How two radar passes become a map.",
    );

    await page.getByTestId("nav-explore").click();
    await expect(page).toHaveURL(/\/explore$/);
  });

  test("the about page lists the team, from the nav and from the explorer intro", async ({
    page,
  }) => {
    await page.goto("/method");
    await expect(page.getByTestId("teardown")).toBeAttached();
    await page.getByTestId("nav-about").click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Six people, one orbit.");
    await expect(page.locator("[data-testid^=member-]")).toHaveCount(6);
    await expect(page.getByTestId("member-cris-pe")).toContainText("Design and front end");
    await expect(page.getByTestId("site-footer")).toContainText("Cattleya trianae");

    await page.goto("/explore");
    await page.getByTestId("intro-team").click();
    await expect(page).toHaveURL(/\/about$/);
  });
});
