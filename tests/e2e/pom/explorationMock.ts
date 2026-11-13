import { readFileSync } from "node:fs";

import type { Page, Route } from "@playwright/test";

// A real answer of the backend (Qadirabad, flood lens); the mocks below are made from it.
const REAL = JSON.parse(
  readFileSync(new URL("../../fixtures/exploration-qadirabad.json", import.meta.url), "utf8"),
) as Record<string, unknown>;

// A real answer for ground motion (Kumamoto, one GUNW pair) and the pair list that offered it.
const INSAR = JSON.parse(
  readFileSync(new URL("../../fixtures/exploration-kumamoto-insar.json", import.meta.url), "utf8"),
) as Record<string, unknown>;
// A real wildfire answer (Seattle), saved by the app's JSON download as { source, exploration }.
const WILDFIRE = (
  JSON.parse(
    readFileSync(
      new URL("../../fixtures/exploration-Seattle-wildfire.json", import.meta.url),
      "utf8",
    ),
  ) as { exploration: Record<string, unknown> }
).exploration;
export const wildfireView = (overrides: View = {}): View => ({ ...WILDFIRE, ...overrides });

export const INSAR_PAIRS = JSON.parse(
  readFileSync(new URL("../../fixtures/insar-pairs-kumamoto.json", import.meta.url), "utf8"),
) as { windowStart: string; windowEnd: string; pairs: Array<Record<string, unknown>> };

// A 1 × 1 transparent PNG, so the globe has an image to drape without a real backend.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

type Problem = { status: number; reasonCode: string; detail: string };
type View = Record<string, unknown>;

export const succeededView = (overrides: View = {}): View => ({ ...REAL, ...overrides });

// A finished answer for the given lens that also carries the backend's independent fire context.
export const withFireContext = (lens: string, fireContext: View): View =>
  succeededView({ lens, result: { ...(REAL["result"] as View), fireContext } });

export const insarView = (overrides: View = {}): View => ({ ...INSAR, ...overrides });

export const runningView = (overrides: View = {}): View => ({
  ...REAL,
  status: "running",
  stage: "processing",
  cache: "miss",
  etaSeconds: 60,
  etaRemainingSeconds: 52,
  elapsedSeconds: 8,
  stages: [
    { name: "planning", state: "done", seconds: 0.9, budgetSeconds: 2 },
    { name: "processing", state: "running", seconds: null, budgetSeconds: null },
  ],
  progress: { scenesRead: null, scenesTotal: 5 },
  result: null,
  error: null,
  ...overrides,
});

export const noCoverageView = (): View =>
  succeededView({
    status: "noData",
    result: null,
    stages: [{ name: "planning", state: "done", seconds: 0.4, budgetSeconds: 2 }],
    plan: {
      status: "no_coverage",
      seriesKey: null,
      dates: [],
      maturityMixed: false,
      notes: ["No scene covers the area."],
    },
    error: { reasonCode: "NO_COVERAGE", detail: "no NISAR scene covers the area" },
  });

type Options = {
  // Problems the backend answers to the first POSTs, one each.
  startProblems?: Problem[];
  // What a poll answers until `complete()`; the default is a job running with a 60 s estimate.
  running?: View;
  // What a poll answers after `complete()`; the default is the real answer.
  final?: View;
  // The answer to the POST itself; the default is the running job.
  first?: View;
  // One answer per POST, in order (a lens switch is a second POST); later POSTs reuse `first`.
  answers?: View[];
};

// Plays the backend's exploration API: POST starts, GET polls, DELETE cancels.
export class ExplorationMock {
  readonly posts: unknown[] = [];
  readonly polls: string[] = [];
  cancelled = false;
  private finished = false;
  private readonly options: Options;
  private problems: Problem[];
  private answers: View[];

  constructor(options: Options) {
    this.options = options;
    this.problems = [...(options.startProblems ?? [])];
    this.answers = [...(options.answers ?? [])];
    // A first answer that is already final means every later GET returns the final answer too.
    this.finished = options.first?.["status"] === "succeeded";
  }

  complete(): void {
    this.finished = true;
  }

  async install(page: Page): Promise<void> {
    await page.route("**/api/v1/explorations/*/layers/**", (route) =>
      route.fulfill({ status: 200, contentType: "image/png", body: PIXEL }),
    );
    await page.route(/\/api\/v1\/explorations(\/[^/]+)?$/, (route) => this.handle(route));
  }

  private handle(route: Route): Promise<void> {
    const request = route.request();
    const running = this.options.running ?? runningView();
    if (request.method() === "POST") {
      this.posts.push(request.postDataJSON());
      const problem = this.problems.shift();
      if (problem !== undefined)
        return route.fulfill({
          status: problem.status,
          contentType: "application/problem+json",
          body: JSON.stringify({ title: "Problem", ...problem }),
        });
      const first = this.answers.shift() ?? this.options.first ?? running;
      // Each run is final or not from its own first answer, so a switch after a result can run.
      if (this.options.answers !== undefined) this.finished = first["status"] === "succeeded";
      return route.fulfill({ status: first["status"] === "succeeded" ? 200 : 202, json: first });
    }
    if (request.method() === "DELETE") {
      this.cancelled = true;
      return route.fulfill({
        json: {
          ...running,
          status: "cancelled",
          error: { reasonCode: "CANCELLED", detail: "the exploration was cancelled" },
        },
      });
    }
    this.polls.push(request.url());
    return route.fulfill({
      json: this.finished || this.cancelled ? (this.options.final ?? succeededView()) : running,
    });
  }
}
