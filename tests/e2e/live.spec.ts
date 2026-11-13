import { expect, test } from "@playwright/test";

import { noCoverageView, runningView, succeededView } from "./pom/explorationMock";
import { GlobePage, LIVE_FRAME } from "./pom/GlobePage";

test.describe("Explorer: live exploration", () => {
  let globe: GlobePage;

  test.beforeEach(async ({ page }) => {
    globe = new GlobePage(page);
    await globe.skipOnboarding();
    await globe.mockObservationPlan();
  });

  test("a frame link asks the backend, and the answer is real: verdict, normal range, counts, no demo chip", async ({
    page,
  }) => {
    const api = await globe.mockExplorations({ first: succeededView() });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);

    await expect(globe.verdict).toHaveAttribute("data-verdict", "within");
    await expect(globe.normalRange).toContainText("−1.2 dB");
    await expect(globe.normalRange).toContainText("−0.8 dB");
    await expect(page.getByTestId("panel-stat")).toContainText("32.9%");
    await expect(globe.panel.getByTestId("contrast-bars")).toBeVisible();
    await expect(globe.panel.getByTestId("prov-demo")).toHaveCount(0);
    await expect(globe.panelMeta).toContainText(`Live question · ${LIVE_FRAME.title}`);
    await expect(page).toHaveURL(new RegExp(`frame=${LIVE_FRAME.id}`));
    expect(api.posts).toEqual([
      {
        lens: "flood_wetland",
        geometry: { type: "Point", coordinates: expect.any(Array) },
        source: "L",
      },
    ]);
  });

  test("while it runs, the modal shows the estimate, the stage and a sourced fact; the result replaces it", async ({
    page,
  }) => {
    const api = await globe.mockExplorations();
    await globe.goto(`?frame=${LIVE_FRAME.id}`);

    await expect(globe.jobModal).toBeVisible();
    await expect(globe.jobRemaining).toContainText(/About \d+ s left/);
    await expect(globe.jobModal).toContainText("Estimated 1 min 00 s");
    await expect(page.getByTestId("job-stages")).toContainText("Choosing the passes");
    await expect(page.getByTestId("job-stages")).toContainText("Reading the passes and measuring");
    await expect(page.getByTestId("fact-text")).not.toBeEmpty();
    await expect(page.getByTestId("fact-source")).toHaveAttribute("href", /^https:\/\//);
    await expect(page.getByRole("progressbar", { name: "Estimated progress" })).toBeVisible();

    const before = await page.getByTestId("fact-text").textContent();
    await page.getByRole("button", { name: "Next fact" }).click();
    await expect(page.getByTestId("fact-text")).not.toHaveText(before ?? "");

    api.complete();
    await expect(globe.verdict).toBeVisible({ timeout: 15_000 });
    await expect(globe.jobModal).toBeHidden();
  });

  test("closing the modal keeps the job running; the answer still arrives; Esc closes it too", async ({
    page,
  }) => {
    const api = await globe.mockExplorations();
    await globe.goto(`?frame=${LIVE_FRAME.id}`);
    await expect(globe.jobModal).toBeVisible();

    await page.getByTestId("job-keep").click();
    await expect(globe.jobModal).toBeHidden();
    await expect(globe.jobProgress).toContainText("Asking the radar");
    await expect(globe.panel).toBeVisible();

    await page.getByTestId("job-details").click();
    await expect(globe.jobModal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(globe.jobModal).toBeHidden();
    await expect(globe.panel).toBeVisible();

    api.complete();
    await expect(globe.verdict).toBeVisible({ timeout: 15_000 });
    await expect(globe.jobModal).toBeHidden();
  });

  test("past the estimate the modal says it is taking longer", async ({ page }) => {
    await globe.mockExplorations({
      running: runningView({ etaSeconds: 5, etaRemainingSeconds: 0, elapsedSeconds: 30 }),
    });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);

    await expect(globe.jobRemaining).toHaveText("Taking longer than expected");
    await expect(page.getByTestId("job-late")).toBeVisible();
  });

  test("a full queue says so and Try again asks again", async ({ page }) => {
    const api = await globe.mockExplorations({
      startProblems: [
        { status: 503, reasonCode: "QUEUE_FULL", detail: "5 explorations are running" },
      ],
      first: succeededView(),
    });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);

    await expect(globe.jobError).toContainText("The radar queue is full");
    await globe.jobError.getByRole("button", { name: "Try again" }).click();
    await expect(globe.verdict).toBeVisible();
    expect(api.posts).toHaveLength(2);
    await expect(page.getByTestId("job-error")).toBeHidden();
  });

  test("a place with no NISAR coverage says so and offers measured cases, not a retry", async () => {
    await globe.mockExplorations({ first: noCoverageView() });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);

    await expect(globe.jobError).toContainText("No NISAR passes cover this place");
    await expect(globe.jobError).toContainText("No scene covers the area.");
    await expect(globe.jobError.getByRole("button", { name: "Try again" })).toHaveCount(0);
    await globe.jobError.getByRole("button", { name: "Pick a measured case" }).click();
    await expect(globe.startCard).toBeVisible();
  });

  test("Cancel request asks the backend to stop and the panel says it was cancelled", async ({
    page,
  }) => {
    const api = await globe.mockExplorations();
    await globe.goto(`?frame=${LIVE_FRAME.id}`);
    await expect(globe.jobModal).toBeVisible();

    await page.getByTestId("job-cancel").click();

    await expect(globe.jobError).toContainText("Request cancelled");
    await expect(globe.jobModal).toBeHidden();
    expect(api.cancelled).toBe(true);
  });

  test("a failing Observation Plan never hides the exploration's answer", async ({ page }) => {
    // Routes registered later win, so this replaces the plan mock of beforeEach.
    await globe.mockObservationPlan({ status: 502, failures: 5 });
    await globe.mockExplorations({ first: succeededView() });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);

    await expect(globe.verdict).toBeVisible();
    await expect(page.getByTestId("plan-error")).toContainText(
      "We couldn't reach the radar archive",
    );
  });

  test("the layers come from the answer: one on the globe, the others a click away, the legend beside it", async ({
    page,
  }) => {
    await globe.mockExplorations({ first: succeededView() });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);

    await expect(globe.liveLayerDock).toBeVisible();
    const signature = page.getByTestId(
      "layer-option-display_flood_signature_flags_co_pol_brightening",
    );
    await expect(signature).toHaveAttribute("aria-pressed", "true");
    const measured = page.getByTestId("layer-option-display_2026-07-14_HH");
    await expect(measured).toHaveAttribute("aria-pressed", "false");
    await measured.click();
    await expect(measured).toHaveAttribute("aria-pressed", "true");
    await expect(signature).toHaveAttribute("aria-pressed", "false");
    await expect(globe.liveLayerDock).toContainText("−30");
    await measured.click();
    await expect(measured).toHaveAttribute("aria-pressed", "false");
  });

  test("the timeline shows the scenes the service read as real dates and the plan's future passes as planned", async () => {
    await globe.mockExplorations({ first: succeededView() });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);

    await expect(globe.timeline).toBeVisible();
    await expect(globe.timeline.getByTestId("prov-real")).toBeVisible();
    await expect(globe.timeline.getByTestId("prov-demo")).toHaveCount(0);
    await expect(globe.timelinePasses("target")).toHaveCount(1);
    await expect(globe.timelinePasses("base")).toHaveCount(4);
    for (const planned of await globe.timelinePasses("plan").all())
      await expect(planned).toBeDisabled();
  });

  test("More information shows the real measurement, the stages the service timed and its limits", async ({
    page,
  }) => {
    await globe.mockExplorations({ first: succeededView() });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);
    await globe.moreInfo.click();

    await expect(globe.sheet).toContainText("What the radar measured at your point");
    await expect(globe.sheet.getByTestId("normal-range")).toBeVisible();
    await expect(page.getByTestId("sheet-compute")).toContainText(
      "Measuring against the normal range",
    );
    await expect(globe.sheet).toContainText("not a validated classifier");
    await expect(globe.sheet).toContainText("optical evidence was not requested");
    await expect(globe.sheet.getByTestId("prov-demo")).toHaveCount(0);
  });

  test("the L | S control sends L and S stays off with its reason", async ({ page }) => {
    await globe.mockExplorations({ first: succeededView() });
    await globe.goto();

    await expect(page.getByTestId("source-L")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("source-S")).toBeDisabled();
    await expect(page.getByTestId("source-S")).toHaveAttribute(
      "title",
      "S-band: coming soon · precomputed areas only",
    );
  });

  test("the ground-motion lens has no live question yet and says so", async ({ page }) => {
    await globe.mockExplorations({ first: succeededView() });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);
    await expect(globe.verdict).toBeVisible();

    await globe.lens("insar").click();

    await expect(page.getByTestId("job-unsupported")).toContainText("needs a pair of passes");
  });

  test("the downloads carry the real answer: JSON and one CSV row per scene", async ({ page }) => {
    await globe.mockExplorations({ first: succeededView() });
    await globe.goto(`?frame=${LIVE_FRAME.id}`);
    await expect(globe.verdict).toBeVisible();

    await page.getByTestId("download-button").click();
    await expect(page.getByTestId("download-json")).toContainText("Result data · JSON");
    const json = page.waitForEvent("download");
    await page.getByTestId("download-json").click();
    expect((await json).suggestedFilename()).toMatch(/^nisar-exploration-exp_.*\.json$/);

    await page.getByTestId("download-button").click();
    const csv = page.waitForEvent("download");
    await page.getByTestId("download-csv").click();
    expect((await csv).suggestedFilename()).toMatch(/-passes\.csv$/);
  });
});

test.describe("Report: live answer", () => {
  test("/report?exploration=<id> prints the backend's answer with its data blocks and no demo chip", async ({
    page,
  }) => {
    const globe = new GlobePage(page);
    await globe.mockExplorations({ first: succeededView() });
    await page.goto("/report?exploration=exp_761b80c9a2d74538");

    await expect(page.getByTestId("report-title")).toContainText("32.33° N");
    await expect(page.getByTestId("report-summary")).toContainText("Not AI-written");
    await expect(page.getByTestId("normal-range")).toContainText("−1.2 dB");
    await expect(page.getByTestId("report-stat")).toContainText("32.9%");
    await expect(page.getByTestId("report-scenes").getByRole("listitem")).toHaveCount(5);
    await expect(page.getByTestId("prov-demo")).toHaveCount(0);
  });

  test("an answer that does not exist says so and keeps the way back", async ({ page }) => {
    await page.route(/\/api\/v1\/explorations\/[^/]+$/, (route) =>
      route.fulfill({
        status: 404,
        contentType: "application/problem+json",
        body: JSON.stringify({
          title: "Not found",
          detail: "no such exploration",
          reasonCode: "NOT_FOUND",
        }),
      }),
    );
    await page.goto("/report?exploration=exp_missing");

    await expect(page.getByTestId("report-empty")).toContainText(
      "No finished answer called “exp_missing”",
    );
    await expect(page.getByRole("link", { name: "Back to the explorer" })).toBeVisible();
  });
});
