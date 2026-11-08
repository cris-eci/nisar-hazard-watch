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

  test("the landing cases carousel opens a case in the explorer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-testid^=landing-case-]")).toHaveCount(5);
    await page.getByTestId("landing-case-chokwe").click();
    await expect(page).toHaveURL(/\/explore\?case=chokwe$/);
  });

  test("the landing story ends on Qadirabad with its real figures", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("When the river rose, the radar went dark.")).toBeVisible();
    await page.getByTestId("story-case-link").click();
    await expect(page).toHaveURL(/\/explore\?case=qadirabad$/);
  });

  test("the landing shows where the method fails and the data it uses", async ({ page }) => {
    await page.goto("/");
    const bars = page.getByTestId("honesty-bars");
    await expect(bars).toContainText("32.6%");
    await expect(bars).toContainText("165 / 506");
    await expect(bars.getByTestId("prov-real")).toBeVisible();

    const sources = page.getByTestId("data-sources").getByRole("link");
    await expect(sources).toHaveCount(5);
    await expect(sources.first()).toHaveAttribute(
      "href",
      "https://nisar-docs.asf.alaska.edu/gcov/",
    );
  });

  test("the landing nav leads to cases, method, about and the explorer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Earth, without the clouds.");

    await page.getByTestId("nav-cases").click();
    await expect(page).toHaveURL(/\/cases$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Four places, measured honestly.",
    );

    await page.getByTestId("nav-method").click();
    await expect(page).toHaveURL(/\/method$/);

    await page.getByTestId("nav-about").click();
    await expect(page).toHaveURL(/\/about$/);

    await page.getByTestId("nav-explore").click();
    await expect(page).toHaveURL(/\/explore$/);
  });

  test("every site page shows the design version in the footer", async ({ page }) => {
    for (const path of ["/", "/cases", "/about"]) {
      await page.goto(path);
      await expect(page.getByTestId("site-version")).toHaveText("Design v7 · 0.7.0");
    }
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
    await expect(page.getByTestId("member-cris-pe")).toContainText("Front end · design");
    await expect(page.getByTestId("site-footer")).toContainText("Cattleya trianae");

    await page.goto("/explore");
    await page.getByTestId("intro-team").click();
    await expect(page).toHaveURL(/\/about$/);
  });
});
