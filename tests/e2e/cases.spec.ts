import { expect, test } from "@playwright/test";

test.describe("Measured cases page", () => {
  test("filtering by a question leaves only the cases that ask it", async ({ page }) => {
    await page.goto("/cases");
    const cards = page.locator("[data-testid^=case-card-]");
    await expect(cards).toHaveCount(5);

    const flood = page.getByTestId("cases-filter-flood_wetland");
    await expect(flood).toHaveText(/Did it flood\?/);
    await flood.click();
    await expect(flood).toHaveAttribute("aria-pressed", "true");
    await expect(cards).toHaveCount(3);
    for (const id of ["qadirabad", "chokwe", "richmond"]) {
      await expect(page.getByTestId(`case-card-${id}`)).toBeVisible();
    }

    await page.getByTestId("cases-filter-wildfire").click();
    await expect(page.getByTestId("cases-empty")).toBeVisible();

    await page.getByTestId("cases-filter-all").click();
    await expect(cards).toHaveCount(5);
  });

  test("a case card opens that case in the explorer", async ({ page }) => {
    await page.goto("/cases");
    const card = page.getByTestId("case-card-qadirabad");
    await expect(card).toContainText("64.3% vs 1.0%");
    await expect(card.getByTestId("prov-real")).toBeVisible();
    await card.getByTestId("case-open-qadirabad").click();
    await expect(page).toHaveURL(/\/explore\?case=qadirabad$/);
  });

  test("a pending case and landslides say there is no measurement yet", async ({ page }) => {
    await page.goto("/cases");
    const choco = page.getByTestId("case-card-choco");
    await expect(choco.getByTestId("prov-pending")).toBeVisible();
    await expect(choco.getByTestId("prov-real")).toHaveCount(0);
    await expect(page.getByTestId("hazard-landslide")).toContainText("No measured case yet");
  });
});
