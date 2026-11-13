import { describe, expect, it } from "vitest";

import { explorationProblem } from "@/features/explore/exploreProblems";
import { NETWORK_ERROR } from "@/lib/api/apiClient";

const problem = (reasonCode: string, detail = "server detail") =>
  explorationProblem({ reasonCode, detail });

describe("explorationProblem", () => {
  it.each([
    ["QUEUE_FULL", "The radar queue is full", true],
    ["RATE_LIMITED", "You're asking quickly", true],
    ["UPSTREAM_CATALOG_ERROR", "We couldn't reach the radar archive", true],
    ["UPSTREAM_ML_ERROR", "The analysis didn't finish", true],
    ["ANALYSIS_FAILED", "The analysis didn't finish", true],
    [NETWORK_ERROR, "We couldn't reach the service", true],
    ["TIMEOUT_PARTIAL", "This took longer than the time limit", true],
    ["NO_COVERAGE", "No NISAR passes cover this place", false],
    ["INSUFFICIENT_HISTORY", "Not enough radar history here yet", false],
  ])("says what %s means", (code, title, retry) => {
    expect(problem(code)).toMatchObject({ title, retry });
  });

  it("shows the server's own detail for a reason it has no copy for", () => {
    expect(problem("AREA_TOO_LARGE", "the area is 640 km²")).toEqual({
      title: "We couldn't answer this question",
      body: "the area is 640 km²",
      retry: false,
    });
  });
});
