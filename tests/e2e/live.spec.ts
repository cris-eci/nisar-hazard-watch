import { expect, test } from "@playwright/test";

import {
  INSAR_PAIRS,
  insarView,
  noCoverageView,
  runningView,
  succeededView,
  withFireContext,
} from "./pom/explorationMock";
import { GlobePage, LIVE_FRAME } from "./pom/GlobePage";

const FIRE_AVAILABLE = {
  status: "available",
  source: "NASA FIRMS · VIIRS 375 m active-fire detections",
  windowStart: "2026-10-30T02:00:00Z",
  windowEnd: "2026-11-11T02:00:00Z",
  detections: 3,
  lowConfidenceExcluded: 0,
  firstDetection: "2026-11-02T08:41:00Z",
  lastDetection: "2026-11-09T20:12:00Z",
  peakFrpMw: 9.54,
  satellites: ["N20"],
  products: ["VIIRS_NOAA20_SP"],
  note: "Independent thermal evidence, separate from the radar.",
};

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
    await expect(globe.sheet).toContainText("Independent optical measurements are unavailable");
    await expect(globe.sheet.getByTestId("prov-demo")).toHaveCount(0);
  });

  for (const mobile of [false, true]) {
    test(`the measured sheet links views and preserves a rectangular image on ${mobile ? "mobile" : "desktop"}`, async ({
      page,
    }, testInfo) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 });
      const base = succeededView();
      const result = base.result as Record<string, unknown>;
      const observations = result.observations as { date: string; status: string }[];
      const target = observations.at(-1)?.date;
      const grid = {
        epsg: 32643,
        bounds_native: [100000, 200000, 100240, 200160],
        width: 12,
        height: 8,
        pixel_spacing_m: [20, 20],
      };
      const bounds = [73.72, 32.31, 73.73, 32.32];
      const root = `/api/v1/explorations/${String(base.id)}`;
      const original = {
        id: `display_${target}_HH`,
        title: "HH radar return",
        kind: "observed",
        units: "dB",
        crs: "EPSG:4326",
        grid,
        bounds,
        legend: null,
        colormap: "gray",
        valueRange: [-30, 0],
        url: `${root}/layers/original`,
        dates: [target],
      };
      const signature = {
        ...original,
        id: "display_flood_signature_flags_dual_darkening",
        title: "Joint darkening",
        kind: "diagnostic",
        units: "diagnostic mask",
        colormap: "diagnostic_categories",
        legend: { "0": "absent", "1": "present" },
        valueRange: [0, 1],
        url: `${root}/layers/signature`,
      };
      await globe.mockExplorations({
        first: succeededView({
          result: {
            ...result,
            observations: observations.map((row, index) => ({
              ...row,
              grid,
              point_db: { HH: -12 - index, HV: -23 - index },
              valid_pixel_count_by_pol: { HH: 96, HV: 96 },
            })),
            layers: [original, signature],
            products: { visualizations: [], assets: [], previews: [] },
          },
        }),
      });
      await page.route("**/layers/signature", (route) =>
        route.fulfill({
          contentType: "image/png",
          // An SVG is unnecessary here: the mock uses a transparent rectangular PNG.
          body: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAwAAAAICAYAAADN5B7xAAAADklEQVR4nGNgGAWDAQAAAYgAAfJhrFEAAAAASUVORK5CYII=",
            "base64",
          ),
        }),
      );
      await page.route("**/analysis", (route) => route.fulfill({ status: 503, json: {} }));
      await globe.goto(`?frame=${LIVE_FRAME.id}`);
      await globe.moreInfo.click();
      const split = globe.sheet.getByTestId("compare-split");
      await expect(split).toBeVisible();
      const box = await split.boundingBox();
      expect(box?.width).toBeGreaterThan(0);
      expect((box?.width ?? 0) / (box?.height ?? 1)).toBeCloseTo(1.5, 1);
      await split.focus();
      await split.press("ArrowRight");
      await expect(split).toHaveAttribute("aria-valuenow", "55");
      if (mobile && box) {
        const session = await page.context().newCDPSession(page);
        const visible = await split.boundingBox();
        const x = (visible?.x ?? box.x) + box.width * 0.25;
        const y = (visible?.y ?? box.y) + box.height * 0.5;
        await session.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x, y }],
        });
        await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await expect(split).toHaveAttribute("aria-valuenow", "25");
      }
      await expect(
        globe.sheet.getByText("Polarization trajectory", { exact: false }),
      ).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath("measured-sheet.png") });
      const heatmap = globe.sheet.getByRole("region", { name: "Date-by-channel heatmap" });
      await heatmap.getByRole("button").first().click();
      await expect(globe.sheet.getByRole("slider", { name: "Acquisition date" })).toHaveAttribute(
        "aria-valuetext",
        observations[0]?.date ?? "",
      );
      await expect(
        globe.sheet.getByText("No image is available for this acquisition."),
      ).toBeVisible();
      await globe.sheet.getByRole("button", { name: "Run regional analysis" }).click();
      await expect(globe.sheet.getByRole("alert")).toContainText("Analysis capacity is limited");
      await expect(
        globe.sheet.getByRole("button", { name: "Retry regional analysis" }),
      ).toBeVisible();
    });
  }

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

  test.describe("ground motion (InSAR pair)", () => {
    const NEWEST_PAIR = String(INSAR_PAIRS.pairs[0]?.["pairId"]);
    const SECOND_PAIR = String(INSAR_PAIRS.pairs[1]?.["pairId"]);

    test("the lens lists the pairs over the spot and asks nothing of the radar until one is chosen", async ({
      page,
    }) => {
      const api = await globe.mockExplorations({ first: succeededView() });
      await globe.mockInsarPairs();
      await globe.goto(`?frame=${LIVE_FRAME.id}`);
      await expect(globe.verdict).toBeVisible();
      api.posts.length = 0;

      await globe.lens("insar").click();

      await expect(globe.pairPicker).toBeVisible();
      await expect(page.locator('[data-testid^="pair-option-"]')).toHaveCount(
        INSAR_PAIRS.pairs.length,
      );
      await expect(page.getByTestId(`pair-option-${NEWEST_PAIR}`)).toBeChecked();
      await expect(globe.pairPicker).toContainText("20 Oct 2026");
      expect(globe.pairRequests).toHaveLength(1);
      expect(api.posts).toEqual([]);
    });

    test("measuring a pair sends it with the threshold; the answer is a measurement with no verdict and no displacement", async ({
      page,
    }) => {
      const api = await globe.mockExplorations({ first: insarView() });
      await globe.mockInsarPairs();
      await globe.goto(`?frame=${LIVE_FRAME.id}&lens=insar`);
      await globe.pairPicker.waitFor();

      await page.getByTestId(`pair-option-${SECOND_PAIR}`).check();
      await page.getByTestId("coherence-threshold").fill("0.5");
      await expect(page.getByTestId("coherence-value")).toHaveText("0.50");
      await globe.pairMeasure.click();

      await expect(globe.verdict).toHaveAttribute("data-verdict", "measured");
      await expect(globe.verdict).toContainText("Measured, not a verdict");
      await expect(globe.insarCard).toContainText("Median coherence");
      await expect(globe.insarCard).toContainText("0.43");
      await expect(globe.insarCard).toContainText("Wrapped phase at the point");
      await expect(page.getByTestId("insar-displacement")).toContainText("Not reported");
      await expect(page.getByTestId("panel-stat")).toContainText("63.3%");
      await expect(globe.panel.getByTestId("prov-demo")).toHaveCount(0);
      await expect(globe.normalRange).toHaveCount(0);
      await expect(page).toHaveURL(new RegExp(`pair=${SECOND_PAIR}`));
      await expect(page).toHaveURL(/coherence=0\.5/);
      expect(api.posts).toEqual([
        {
          lens: "insar",
          geometry: { type: "Point", coordinates: expect.any(Array) },
          source: "L",
          pairId: SECOND_PAIR,
          coherenceThreshold: 0.5,
        },
      ]);
    });

    test("the globe offers the coherence and the wrapped phase, and the phase says its colours repeat", async ({
      page,
    }) => {
      await globe.mockExplorations({ first: insarView() });
      await globe.mockInsarPairs();
      await globe.goto(`?frame=${LIVE_FRAME.id}&lens=insar&pair=${NEWEST_PAIR}`);
      await expect(globe.verdict).toBeVisible();

      await expect(globe.liveLayerDock).toContainText("Interferometric coherence");
      await expect(globe.liveLayerDock).toContainText("Wrapped phase");
      await page.getByTestId("layer-option-display_wrapped_phase_rad_wrapped_phase_rad").click();

      await expect(page.getByTestId("phase-note")).toContainText("repeat every 2π");
      await expect(page.getByTestId("layer-scale")).toHaveText("−π to +π rad");
    });

    test("a shared link with the pair measures straight away, without the picker", async () => {
      const api = await globe.mockExplorations({ first: insarView() });
      await globe.mockInsarPairs();
      await globe.goto(`?frame=${LIVE_FRAME.id}&lens=insar&pair=${NEWEST_PAIR}&coherence=0.6`);

      await expect(globe.verdict).toHaveAttribute("data-verdict", "measured");
      await expect(globe.pairPicker).toHaveCount(0);
      expect(globe.pairRequests).toEqual([]);
      expect(api.posts).toEqual([
        expect.objectContaining({ lens: "insar", pairId: NEWEST_PAIR, coherenceThreshold: 0.6 }),
      ]);
    });

    test("a spot with no pair says so and keeps the way back; a catalog outage can be retried", async ({
      page,
    }) => {
      await globe.mockExplorations({ first: succeededView() });
      await globe.mockInsarPairs({ failures: 1 });
      await globe.goto(`?frame=${LIVE_FRAME.id}&lens=insar`);

      await expect(globe.jobError).toBeVisible();
      await page.getByRole("button", { name: "Try again" }).click();
      await expect(globe.pairPicker).toBeVisible();
    });

    test("no pair over the spot is explained, not left blank", async ({ page }) => {
      await globe.mockExplorations({ first: succeededView() });
      await globe.mockInsarPairs({ empty: true });
      await globe.goto(`?frame=${LIVE_FRAME.id}&lens=insar`);

      await expect(page.getByTestId("pairs-empty")).toContainText("No NISAR pair covers this spot");
      await expect(globe.pairPicker).toHaveCount(0);
    });

    test("the Kumamoto case offers to measure a live pair at its spot", async ({ page }) => {
      await globe.mockExplorations({ first: insarView() });
      await globe.mockInsarPairs();
      await globe.goto("?case=kumamoto");
      await expect(globe.verdict).toBeVisible();

      await page.getByTestId("measure-live-pair").click();

      await expect(globe.pairPicker).toBeVisible();
      await expect(globe.panelMeta).toContainText("Live question");
    });
  });

  test.describe("wildfire fire context", () => {
    test("an available context sits apart from the radar verdict, with its dates and the FIRMS source", async ({
      page,
    }) => {
      await globe.mockExplorations({ first: withFireContext("wildfire", FIRE_AVAILABLE) });
      await globe.goto(`?frame=${LIVE_FRAME.id}&lens=wildfire`);

      await expect(globe.verdict).toHaveAttribute("data-verdict", "within");
      const fire = globe.panel.getByTestId("fire-context");
      await expect(fire).toContainText("Independent fire context");
      await expect(fire).toContainText("3 active-fire detections between the two passes");
      await expect(fire).toContainText("2 Nov 2026");
      await expect(fire).toContainText("9.5 MW");
      await expect(fire).toContainText("separate from the radar");
      await expect(fire.getByTestId("prov-real")).toBeVisible();
      await expect(globe.panel.getByTestId("prov-demo")).toHaveCount(0);

      await globe.moreInfo.click();
      await expect(page.getByRole("link", { name: /FIRMS active fire data/ })).toBeVisible();
    });

    test("without a FIRMS key the panel says the answer is radar-only and shows no numbers", async () => {
      await globe.mockExplorations({
        first: withFireContext("wildfire", {
          ...FIRE_AVAILABLE,
          status: "notConfigured",
          detections: null,
          lowConfidenceExcluded: null,
          firstDetection: null,
          lastDetection: null,
          peakFrpMw: null,
          satellites: [],
          products: [],
          note: "Fire context is not configured on this server, so the verdict is radar-only.",
        }),
      });
      await globe.goto(`?frame=${LIVE_FRAME.id}&lens=wildfire`);

      const fire = globe.panel.getByTestId("fire-context");
      await expect(fire).toHaveAttribute("data-status", "notConfigured");
      await expect(fire).toContainText("Fire context not configured");
      await expect(fire).toContainText("radar-only");
      await expect(fire.getByTestId("prov-real")).toHaveCount(0);
      await expect(globe.verdict).toHaveAttribute("data-verdict", "within");
    });

    test("other lenses show no fire context", async () => {
      await globe.mockExplorations({ first: succeededView() });
      await globe.goto(`?frame=${LIVE_FRAME.id}`);

      await expect(globe.verdict).toBeVisible();
      await expect(globe.panel.getByTestId("fire-context")).toHaveCount(0);
    });
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

  test("a wildfire report adds the fire context as its own block, apart from the radar data", async ({
    page,
  }) => {
    const globe = new GlobePage(page);
    const answer = withFireContext("wildfire", FIRE_AVAILABLE);
    await globe.mockExplorations({ first: answer, final: answer });
    await page.goto("/report?exploration=exp_761b80c9a2d74538");

    const fire = page.getByTestId("fire-context");
    await expect(fire).toContainText("3 active-fire detections between the two passes");
    await expect(page.getByTestId("report")).toContainText("Independent fire context");
    await expect(page.getByTestId("report-summary")).toContainText("separate from the radar");
  });

  test("a ground-motion report shows what the pair measured and never calls it a verdict", async ({
    page,
  }) => {
    const globe = new GlobePage(page);
    const answer = insarView();
    await globe.mockExplorations({ first: answer, final: answer });
    await page.goto("/report?exploration=exp_0bb9bf27928a4959");

    await expect(page.getByTestId("insar-card")).toContainText("Median coherence");
    await expect(page.getByTestId("insar-displacement")).toContainText("Not reported");
    await expect(page.getByTestId("report-summary")).toContainText("No displacement is reported");
    await expect(page.getByTestId("report-summary")).not.toContainText("Verdict:");
    await expect(page.getByTestId("report")).toContainText("Measured, not a verdict");
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
