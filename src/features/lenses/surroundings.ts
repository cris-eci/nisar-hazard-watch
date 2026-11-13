import { LENS_CARD } from "@/content/copyV8";
import type { LensEvaluation } from "@/features/explore/exploreSchemas";

export type SurroundingsRow = {
  state: "same" | "darker" | "insufficient";
  label: string;
  sentence: string;
};

const drop = (db: number): string => String(Math.abs(db));

// One compact row, every number from surrounding_comparison. Anything we have no words for hides.
export const surroundingsRow = (
  evaluation: LensEvaluation | undefined,
): SurroundingsRow | undefined => {
  const around = evaluation?.surroundings;
  if (around === undefined) return undefined;
  const { focalRadiusM: radius, annulusM, focalCells, minimumCells } = around;
  if (around.status === "insufficient_data") {
    const posting = evaluation?.pixelSpacingM;
    if (radius === undefined || focalCells === undefined || minimumCells === undefined || !posting)
      return undefined;
    return {
      state: "insufficient",
      label: LENS_CARD.surroundingsNotEnough,
      sentence: LENS_CARD.surroundingsInsufficient(
        radius,
        focalCells,
        `${posting} m`,
        minimumCells,
      ),
    };
  }
  const { matchedControlCells, surroundingCells } = around;
  if (
    around.status !== "evaluated" ||
    radius === undefined ||
    annulusM === undefined ||
    focalCells === undefined ||
    matchedControlCells === undefined ||
    surroundingCells === undefined
  )
    return undefined;
  const [near, far] = annulusM;
  const counts = LENS_CARD.surroundingsCounts(focalCells, matchedControlCells, surroundingCells);
  if (around.differentialState === "absent_on_sampled_support")
    return {
      state: "same",
      label: LENS_CARD.surroundingsSame,
      sentence: `${LENS_CARD.surroundingsSameLine(radius, near, far)} ${counts}`,
    };
  const policy = evaluation?.dualDarkeningMaxChangeDb;
  if (around.differentialState === "supports" && policy !== undefined)
    return {
      state: "darker",
      label: LENS_CARD.surroundingsDarker,
      sentence: `${LENS_CARD.surroundingsDarkerLine(radius, near, far, drop(policy.co), drop(policy.cross))} ${counts}`,
    };
  return undefined;
};
