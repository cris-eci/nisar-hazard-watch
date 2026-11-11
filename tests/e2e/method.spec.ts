import { expect, test } from "@playwright/test";

import { MethodPage } from "./pom/MethodPage";

test.describe("Method page", () => {
  test("the hero asks one question and the Qadirabad frames read in order", async ({ page }) => {
    const method = new MethodPage(page);
    await method.goto();
    await expect(method.heading).toHaveText("One honest question, asked of real radar.");
    // Reduced motion: no pin, all five frames stacked.
    await expect(method.sequence.getByRole("heading", { level: 2 })).toHaveText([
      "First, this place's normal echo.",
      "Then, how it changed on 26 July.",
      "The cells that crossed the line.",
      "A second witness, a week later.",
      "Agreement, and where it breaks.",
    ]);
    await expect(method.sequence.getByTestId("contrast-bars")).toContainText("332 / 516");
  });

  test("the lenses section lists the five questions", async ({ page }) => {
    const method = new MethodPage(page);
    await method.goto();
    await expect(method.lenses).toHaveCount(5);
    await expect(method.lenses).toContainText([
      "Did it flood?",
      "Did vegetation disappear?",
      "Did fire scar it?",
      "Did a field change?",
      "Did the ground move?",
    ]);
  });

  test("works and fails cards show the real shares", async ({ page }) => {
    const method = new MethodPage(page);
    await method.goto();
    await expect(method.evidence("matam")).toContainText("17.8%");
    await expect(method.evidence("matam")).toContainText("1.1%");
    await expect(method.evidence("barh")).toContainText("32.6%");
    await expect(method.evidence("kumamoto")).toContainText("3 of 1,614");
  });

  test("the metrics chart flags development data and Technical reveals all four metrics", async ({
    page,
  }) => {
    const method = new MethodPage(page);
    await method.goto();
    await expect(method.metrics).toContainText("Development data · no independent test yet");
    await expect(method.metrics.getByText("Experimental", { exact: true })).toHaveCount(3);
    // Plain: F1 only, plus precision and recall for the one test without an F1.
    await expect(method.metricRows("iou")).toHaveCount(0);
    await expect(method.metricRows("f1")).toHaveCount(4);

    await method.pickMode("technical");
    await expect(method.modeButton("technical")).toHaveAttribute("aria-pressed", "true");
    for (const id of ["precision", "recall", "f1", "iou"] as const) {
      await expect(method.metricRows(id)).toHaveCount(5);
    }
    // Missing scores are labelled, never drawn as 0.
    await expect(method.metrics.getByText("Not reported", { exact: true })).toHaveCount(4);
  });
});
