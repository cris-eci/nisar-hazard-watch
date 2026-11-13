import real from "../fixtures/exploration-qadirabad.json";
import { describe, expect, it } from "vitest";

import {
  explorationSchema,
  lensEvaluationOf,
  type LensEvaluation,
  type Surroundings,
} from "@/features/explore/exploreSchemas";
import { surroundingsRow } from "@/features/lenses/surroundings";

const result = explorationSchema.parse(real).result;
if (result === null) throw new Error("fixture has a result");
const EVALUATION = lensEvaluationOf(result);

const with_ = (around: Partial<Surroundings>): LensEvaluation | undefined =>
  EVALUATION?.surroundings && {
    ...EVALUATION,
    surroundings: { ...EVALUATION.surroundings, ...around },
  };

describe("surroundingsRow", () => {
  it("says the Qadirabad patch did not darken more than its matched cells", () => {
    expect(surroundingsRow(EVALUATION)).toEqual({
      state: "same",
      label: "Did not darken more",
      sentence:
        "The 60 m patch around your pixel did not darken more than matched cells 120–300 m away. 115 cells in the patch, compared with 115 matched cells out of 2,376 around it.",
    });
  });

  it("says when the patch darkened more, with the rule's margins from the policy", () => {
    expect(surroundingsRow(with_({ differentialState: "supports" }))?.sentence).toBe(
      "The 60 m patch around your pixel darkened more than matched cells 120–300 m away: by 3 dB or more in HH and 1.5 dB or more in HV. 115 cells in the patch, compared with 115 matched cells out of 2,376 around it.",
    );
  });

  it("uses the COPY template when there are too few cells, with the right plural", () => {
    expect(
      surroundingsRow(with_({ status: "insufficient_data", focalCells: 1, minimumCells: 5 })),
    ).toEqual({
      state: "insufficient",
      label: "Not enough data",
      sentence: "The 60 m patch holds 1 cell on this 10 m grid; the comparison needs 5.",
    });
    expect(
      surroundingsRow(with_({ status: "insufficient_data", focalCells: 3, minimumCells: 5 }))
        ?.sentence,
    ).toBe("The 60 m patch holds 3 cells on this 10 m grid; the comparison needs 5.");
  });

  it("hides on a state it has no words for, or without the comparison", () => {
    expect(surroundingsRow(with_({ differentialState: "something_new" }))).toBeUndefined();
    expect(surroundingsRow(with_({ status: "not_evaluated" }))).toBeUndefined();
    expect(surroundingsRow(with_({ matchedControlCells: undefined }))).toBeUndefined();
    expect(surroundingsRow(undefined)).toBeUndefined();
  });
});
