import type { Subject } from "@/features/case-panel/subject";
import type { ContrastGroup, QualityItem, Source } from "@/features/cases/cases";
import { formatPercent } from "@/features/cases/cases";
import type { ExplorationResult, ExplorationView } from "@/features/explore/exploreSchemas";
import { formatDay } from "@/features/timeline/timelineLayout";

const INK = "#ebe9e4";
const GOLD = "#c9b48b";
const PERCENT = 100;
const DAY_MS = 86_400_000;
const GRID_NOTE = "cells at 20 m";

const NO_DATA_REASON: Record<string, string> = {
  pair_unavailable: "The catalog no longer lists this pair.",
  outside_quantitative_grid: "This spot lies outside the pair's valid grid.",
  no_focused_coherence: "The pair holds no focused coherence in the window.",
};

export const INSAR_SOURCES: Source[] = [
  {
    label: "ASF DAAC · NISAR L2 GUNW interferograms",
    href: "https://asf.alaska.edu/data-sets/sar-data-sets/nisar/",
  },
  {
    label: "NISAR-Modeling · InSAR exploration",
    href: "https://github.com/nisar-hazard-watch/NISAR-Modeling/blob/main/docs/EXPLORE_API.md",
  },
];

export const NO_DISPLACEMENT =
  "Not reported: the phase is wrapped and not corrected for troposphere or ionosphere.";

const days = (result: ExplorationResult): number =>
  Math.round((Date.parse(result.windowEnd) - Date.parse(result.windowStart)) / DAY_MS);

const pairLabel = (result: ExplorationResult): string =>
  `${formatDay(result.windowStart, false)} → ${formatDay(result.windowEnd)}`;

const two = (value: number | null): string => (value === null ? "—" : value.toFixed(2));

const lineOf = (status: string, label: string): string => {
  if (status === "complete")
    return `Coherence and wrapped phase of one NISAR pair (${label}). No displacement is reported.`;
  if (status === "partial")
    return `This pair kept some coherence (${label}), but no cell reaches the phase threshold. No displacement is reported.`;
  return `No usable coherence for this pair (${label}) at this point.`;
};

const groupOf = (insar: NonNullable<ExplorationResult["insar"]>): ContrastGroup[] => {
  const { coherentCells, phaseCells, windowCells } = insar;
  if (coherentCells === null || phaseCells === null || windowCells === null || windowCells === 0)
    return [];
  return [
    {
      title: "Cells with usable wrapped phase",
      sub: `${windowCells.toLocaleString("en-US")} ${GRID_NOTE}`,
      rows: [
        { label: "Coherence measured", k: coherentCells, n: windowCells, color: INK },
        {
          label: `Phase above ${insar.coherenceThreshold}`,
          k: phaseCells,
          n: windowCells,
          color: GOLD,
        },
      ],
    },
  ];
};

const qualityOf = (view: ExplorationView, result: ExplorationResult): QualityItem[] => {
  const insar = result.insar;
  if (insar === null || insar === undefined) return [];
  const status =
    insar.status === "complete" ? "Complete" : insar.status === "partial" ? "Partial" : "No data";
  return [
    { k: "Status", v: status, why: "Whether the pair gave coherence and phase at this threshold." },
    {
      k: "Pair",
      v: pairLabel(result),
      why: "Reference and secondary acquisition days of the interferogram.",
    },
    {
      k: "Baseline",
      v: `${days(result)} days`,
      why: "Time between the two acquisitions: longer gaps lose coherence over vegetation.",
    },
    {
      k: "Polarization",
      v: insar.polarization ?? "—",
      why: "The channel of the interferogram that was read.",
    },
    { k: "Grid", v: "20 m", why: "Posting of the cells in the 5 km window around the centre." },
    {
      k: "Corrections",
      v: insar.correctionsApplied.length === 0 ? "None" : insar.correctionsApplied.join(" · "),
      why: "Troposphere, ionosphere and reference-point corrections applied to the phase.",
    },
    {
      k: "Answered",
      v: view.cache === "hit" ? "From cache" : `${view.elapsedSeconds.toFixed(0)} s`,
      why:
        view.cache === "hit"
          ? "The same question was answered within the last day."
          : "Time from the request to the answer.",
    },
  ];
};

// What an InSAR answer adds to (or replaces in) the common subject: no verdict, the pair's own facts.
export const insarParts = (
  view: ExplorationView,
  result: ExplorationResult,
): Partial<Subject> | undefined => {
  const insar = result.insar;
  if (insar === null || insar === undefined) return undefined;
  const label = pairLabel(result);
  const share =
    insar.phaseCells !== null && insar.windowCells ? insar.phaseCells / insar.windowCells : null;
  return {
    verdict: "measured",
    verdictLine: lineOf(insar.status, label),
    reason:
      insar.status === "no_data"
        ? (NO_DATA_REASON[insar.reason ?? ""] ?? "The pair holds no usable measurement here.")
        : undefined,
    target: result.windowEnd,
    when: `Pair ${label}`,
    stat: share === null ? undefined : formatPercent(share * PERCENT),
    statLine:
      share === null || insar.windowCells === null
        ? undefined
        : `of the ${insar.windowCells.toLocaleString("en-US")} cells in the window kept enough coherence (≥ ${insar.coherenceThreshold}) to show wrapped phase.`,
    groups: groupOf(insar),
    quality: qualityOf(view, result),
    sources: INSAR_SOURCES,
    normalRange: undefined,
    insar: {
      facts: [
        { k: "Pair", v: label },
        { k: "Temporal baseline", v: `${days(result)} days` },
        { k: "Median coherence", v: two(insar.medianCoherence) },
        { k: "Coherence at the point", v: two(insar.pointCoherence) },
        {
          k: "Wrapped phase at the point",
          v:
            insar.pointWrappedPhaseRad === null
              ? `none above ${insar.coherenceThreshold}`
              : `${insar.pointWrappedPhaseRad.toFixed(2)} rad`,
        },
      ],
      displacement: NO_DISPLACEMENT,
    },
  };
};
