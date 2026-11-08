import { OPTICAL, type ContrastGroup, type Source } from "@/features/cases/cases";

// The landing's honesty example: where the baseline rule also flags water that was already there.
// Counts copied from NISAR-Modeling FLOOD_EVIDENCE.md (Barh, radar target 12 Sep 2026).
export const BARH_GROUP: ContrastGroup = {
  title: "Barh · flagged by the baseline rule",
  sub: "Ganga floodplain · 12 Sep 2026",
  rows: [
    { label: "New water", k: 2363, n: 2702, color: OPTICAL.newWater },
    { label: "Already water", k: 165, n: 506, color: OPTICAL.stableWater },
    { label: "Stayed dry", k: 75, n: 1226, color: OPTICAL.dry },
  ],
};

export const BARH_SOURCE: Source = {
  label: "NISAR-Modeling · FLOOD_EVIDENCE.md",
  href: "https://github.com/Ch0comilo/NISAR-Modeling/blob/main/docs/FLOOD_EVIDENCE.md",
};
