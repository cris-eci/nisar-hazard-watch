import type { Locator, Page } from "@playwright/test";

export class MethodPage {
  private readonly page: Page;
  readonly heading: Locator;
  readonly lenses: Locator;
  readonly sequence: Locator;
  readonly metrics: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.lenses = page.getByTestId("method-lens");
    this.sequence = page.getByTestId("method-sequence");
    this.metrics = page.getByTestId("metrics-chart");
  }

  async goto(): Promise<void> {
    await this.page.goto("/method");
  }

  evidence(id: string): Locator {
    return this.page.getByTestId(`evidence-${id}`);
  }

  metricRows(id: "precision" | "recall" | "f1" | "iou"): Locator {
    return this.metrics.getByTestId(`metric-${id}`);
  }

  async pickMode(mode: "plain" | "technical"): Promise<void> {
    await this.page.getByTestId(`method-mode-${mode}`).click();
  }

  modeButton(mode: "plain" | "technical"): Locator {
    return this.page.getByTestId(`method-mode-${mode}`);
  }
}
