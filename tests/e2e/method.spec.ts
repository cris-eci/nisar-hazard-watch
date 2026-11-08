import { expect, test } from "@playwright/test";

test.describe("Method page", () => {
  test("the method page switches its steps between wildfire and earthquake", async ({ page }) => {
    await page.goto("/method");
    await expect(page.getByRole("heading", { name: "Find the passes" })).toBeVisible();

    await page.getByTestId("method-tab-earthquake").click();
    await expect(page.getByTestId("method-tab-earthquake")).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("heading", { name: "Find a pair that brackets the event" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/method\?hazard=earthquake$/);
  });
});
