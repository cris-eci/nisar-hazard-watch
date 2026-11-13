import { expect, test } from "@playwright/test";

import { noCoverageView } from "./pom/explorationMock";
import { GlobePage } from "./pom/GlobePage";

test.describe("Explorer: place search", () => {
  let globe: GlobePage;

  test.beforeEach(async ({ page }) => {
    globe = new GlobePage(page);
    await globe.skipOnboarding();
    await globe.mockObservationPlan();
  });

  test("typing sends nothing; Enter searches once and lists the places with their credit", async ({
    page,
  }) => {
    await globe.mockPlaces();
    await globe.goto();
    await globe.searchButton.click();
    await expect(globe.searchMenu).toBeVisible();
    await expect(globe.searchInput).toBeFocused();

    await globe.searchInput.pressSequentially("Qadirabad");
    await page.waitForTimeout(800);
    expect(globe.placeRequests).toHaveLength(0);

    await globe.searchInput.press("Enter");
    await expect(globe.placeOption(1)).toBeVisible();
    expect(globe.placeRequests).toHaveLength(1);
    expect(globe.placeRequests[0]).toContain("q=Qadirabad");
    expect(globe.placeRequests[0]).toContain("limit=6");
    await expect(globe.placeOption(0)).toContainText("Phalia Tehsil");
    await expect(
      globe.searchMenu.getByRole("link", { name: "© OpenStreetMap contributors" }),
    ).toBeVisible();
  });

  test("arrow keys and Enter pick a place; the card names its frame and Analyse asks the radar", async ({
    page,
  }) => {
    test.slow();
    await globe.mockPlaces();
    await globe.goto();
    await globe.searchButton.click();
    await globe.searchInput.fill("Qadirabad");
    await globe.searchInput.press("Enter");
    await expect(globe.placeOption(0)).toBeVisible();

    await globe.searchInput.press("ArrowDown");
    await expect(globe.placeOption(0)).toHaveAttribute("aria-selected", "true");
    await globe.searchInput.press("Enter");

    await expect(globe.searchMenu).toBeHidden();
    await expect(globe.placeCard).toContainText("Qadirabad");
    await expect(page.getByTestId("place-frame")).toContainText("Track 84 · Frame 18");
    await expect(globe.startCard).toBeHidden();

    await globe.placeAnalyse.click();
    await expect(globe.panelMeta).toContainText("Live question · Track 84 · Frame 18");
    await expect(globe.placeCard).toBeHidden();
    await expect(page).toHaveURL(/frame=84-18/);
  });

  test("a place outside the frame snapshot can ask the archive", async ({ page }) => {
    const api = await globe.mockExplorations({ first: noCoverageView() });
    await globe.mockPlaces({ mock: "places-open-ocean" });
    await globe.goto();
    await globe.searchButton.click();
    await globe.searchInput.fill("South Atlantic");
    await globe.searchInput.press("Enter");
    await globe.placeOption(0).click();

    await expect(globe.placeNoFrame).toContainText("No frame outline in the map");
    await globe.placeAnalyse.click();
    await expect(page).toHaveURL(/point=/);
    await expect(globe.panel).toContainText("No NISAR passes cover this place");
    expect(api.posts).toHaveLength(1);
  });

  test("no match shows an empty state and the globe stays usable", async ({ page }) => {
    await page.route("**/api/v1/places**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ places: [], attribution: "© OpenStreetMap contributors" }),
      }),
    );
    await globe.goto();
    await globe.searchButton.click();
    await globe.searchInput.fill("Nowhereville");
    await globe.searchInput.press("Enter");

    await expect(page.getByTestId("place-empty")).toContainText(
      "No place found for “Nowhereville”.",
    );
    await expect(globe.startCard).toBeVisible();
  });

  test("a failing search says so and Try again repeats it", async () => {
    await globe.mockPlaces({ failures: 1 });
    await globe.goto();
    await globe.searchButton.click();
    await globe.searchInput.fill("Qadirabad");
    await globe.searchInput.press("Enter");

    await expect(globe.searchError).toContainText("We couldn't reach the place search");
    await globe.searchError.getByRole("button", { name: "Try again" }).click();
    await expect(globe.placeOption(0)).toBeVisible();
    expect(globe.placeRequests).toHaveLength(2);
  });

  test("Esc closes the search, the start card button opens it, and the card's close returns to the list", async ({
    page,
  }) => {
    await globe.mockPlaces();
    await globe.goto();
    await page.getByTestId("search-cta").click();
    await expect(globe.searchMenu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(globe.searchMenu).toBeHidden();

    await globe.searchButton.click();
    await globe.searchInput.fill("Qadirabad");
    await globe.searchInput.press("Enter");
    await globe.placeOption(0).click();
    await expect(globe.placeCard).toBeVisible();
    await page.getByTestId("place-close").click();
    await expect(globe.placeCard).toBeHidden();
    await expect(globe.startCard).toBeVisible();
  });
});
