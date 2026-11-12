import type { SubjectVerdict } from "@/features/case-panel/subject";
import type { Verdict } from "@/features/cases/cases";
import { bandsFor, isOutside, type BandPass } from "@/features/cases/demoBand";

// The three backend outcomes in plain words (SPECS §2.7); the sheet shows all three side by side.
export const VERDICT: Record<SubjectVerdict, { label: string; sub: string; state: string }> = {
  departure: {
    label: "Changed beyond its normal range",
    sub: "At least one channel left the band built from earlier passes.",
    state: "observed_departure",
  },
  within: {
    label: "Within its normal range",
    sub: "Both channels stayed inside the band.",
    state: "within_observed_baseline",
  },
  insufficient: {
    label: "Not enough radar yet",
    sub: "Thin history, masked pixel or missing pass. We say why.",
    state: "insufficient_data",
  },
  measured: {
    label: "Measured, not a verdict",
    sub: "This lens reports what the pair measured and no verdict.",
    state: "measured",
  },
};

export const VERDICT_ORDER: Verdict[] = ["departure", "within", "insufficient"];

// The sentence under the full band chart, read from the series itself so it can't disagree with it.
export const bandSentence = (passes: BandPass[]): string => {
  const bands = bandsFor(passes);
  const target = passes.find((item) => item.role === "target");
  if (bands.hh === undefined || bands.hv === undefined || target === undefined)
    return "Only two usable passes in this window. The band needs at least three earlier passes, so there is no verdict.";
  const hhOut = isOutside(target.hh, bands.hh);
  const hvOut = isOutside(target.hv, bands.hv);
  const darker =
    target.hh !== null &&
    target.hv !== null &&
    target.hh < bands.hh.low &&
    target.hv < bands.hv.low;
  if (hhOut && hvOut && darker)
    return "On the target pass both radar channels came back darker than in any earlier pass, outside this spot's normal range. Calm open water often does that.";
  if (hhOut || hvOut)
    return "One channel left its normal range on the target pass; the other stayed inside.";
  return "On the target pass both channels stayed inside this spot's normal range.";
};

// Where each chip's number comes from, shown on hover (DATA_PROVENANCE.md).
export const SOURCE = {
  caseVerdict:
    "Verdict from the NISAR-Modeling backend report for this case (status, interpretation_status); see Sources",
  liveVerdict:
    "Exploration API → result.lens.point.status, computed for this spot from the scenes listed under Evidence",
  groups:
    "Cell counts from NISAR-Modeling docs/results/flood_pilot_summary.json and FLOOD_CHARACTERIZATION.md",
  matched: "NISAR-Modeling matched_controls.co_pol_contrast",
  caseQuality: "Status, dates and coverage from the backend report",
  liveQuality: "Exploration API → plan, observations and aoiSummary of this run",
  liveInsar:
    "Exploration API → result.insar and the coherence and wrapped-phase layers of one NISAR GUNW pair (ASF catalog, read by the analysis service)",
  liveRange:
    "Exploration API → result.lens.point.target_minus_baseline_db and diagnostic_half_width_db",
  liveFire:
    "Exploration API → result.fireContext: NASA FIRMS VIIRS active-fire detections inside the area between the two radar passes. Independent of the radar",
  liveTimeline:
    "Dates of the scenes the service read (ASF catalog) and the passes still to come from NASA's NISAR Observation Plan",
  steps: "Steps mirror the backend pipeline (EXPLORE_API.md)",
  crop: "Crop of the NISAR-Modeling report figure (docs/cases/*.png). The API will serve it",
  figure: "NISAR-Modeling report figure",
  plan: "NISAR Observation Plan (NASA), fetched live for this frame",
  timeline:
    "Pass dates (12-day spacing) and the % outside range bars are demo until the backend serves the real ones",
  todo: "Left as a slot until it is copied from the cited source",
} as const;
