import type { Subject, NormalRange } from "@/features/case-panel/subject";
import type { ContrastGroup, LensId, QualityItem, Verdict } from "@/features/cases/cases";
import { formatPercent } from "@/features/cases/cases";
import { fireContextOf } from "@/features/explore/exploreFire";
import { insarParts } from "@/features/explore/exploreInsar";
import type {
  ExplorationResult,
  ExplorationStage,
  ExplorationView,
} from "@/features/explore/exploreSchemas";
import type { LonLat } from "@/features/frames/frame.types";
import {
  LENS_ALTERNATIVES,
  LIVE_CHIP_KM,
  LIVE_EMPTIES,
  LIVE_LINE,
  LIVE_REASON,
  LIVE_SOURCES,
} from "@/features/live/liveQuestion";

const FIRMS_SOURCE = {
  label: "NASA · FIRMS active fire data (VIIRS)",
  href: "https://firms.modaps.eosdis.nasa.gov/",
};
import { formatDay } from "@/features/timeline/timelineLayout";

const VERDICT_OF_STATE: Record<string, Verdict> = {
  observed_departure: "departure",
  within_observed_baseline: "within",
  insufficient_data: "insufficient",
};

const STAGE_LABEL: Partial<Record<ExplorationStage["name"], string>> = {
  planning: "Choosing the passes",
  reading: "Reading the passes",
  analysing: "Measuring against the normal range",
  rendering: "Drawing the layers",
};

const GOLD = "#c9b48b";
const INK = "#ebe9e4";
const PERCENT = 100;

export const verdictOfResult = (result: ExplorationResult): Verdict =>
  VERDICT_OF_STATE[result.lens?.point?.status ?? ""] ?? "insufficient";

const normalRangeOf = (result: ExplorationResult): NormalRange | undefined => {
  const point = result.lens?.point;
  if (point === null || point === undefined) return undefined;
  const channels = Object.entries(point.target_minus_baseline_db).flatMap(([channel, delta]) => {
    const halfWidth = point.diagnostic_half_width_db[channel];
    return typeof delta === "number" && typeof halfWidth === "number"
      ? [{ channel, delta, halfWidth }]
      : [];
  });
  return channels.length === 0
    ? undefined
    : { channels, baselinePasses: result.lens?.baseline_dates?.length ?? 0 };
};

const groupsOf = (result: ExplorationResult): ContrastGroup[] => {
  const summary = result.aoiSummary;
  if (summary === null || summary.cells_in_area === 0) return [];
  return [
    {
      title: "Cells that left their normal range",
      sub: `${summary.cells_in_area.toLocaleString("en-US")} cells in the area`,
      rows: [
        {
          label: "Measured",
          k: summary.cells_with_measurement,
          n: summary.cells_in_area,
          color: INK,
        },
        {
          label: "Left the normal range",
          k: summary.cells_departing_from_baseline,
          n: summary.cells_with_measurement,
          color: GOLD,
        },
      ],
    },
  ];
};

const statusLabel = (view: ExplorationView): string =>
  view.status === "succeeded" ? "Complete" : view.status === "partial" ? "Partial" : "No data";

const qualityOf = (view: ExplorationView, result: ExplorationResult): QualityItem[] => {
  const baseline = result.lens?.baseline_dates?.length ?? 0;
  const covered = result.aoiSummary?.area_covered_fraction;
  const posting = result.lens?.radar?.posting_m;
  const items: QualityItem[] = [
    { k: "Status", v: statusLabel(view), why: "Whether every planned pass was usable." },
    {
      k: "Passes",
      v: baseline > 0 ? `${baseline} + 1` : `${result.scenes.length}`,
      why: "Earlier passes that set the normal range, and the latest pass compared with it.",
    },
    {
      k: "Coverage",
      v: typeof covered === "number" ? `${formatPercent(covered * PERCENT)}` : "—",
      why: "Share of the area with a usable measurement on every pass.",
    },
  ];
  if (view.plan?.seriesKey)
    items.push({
      k: "Series",
      v: view.plan.seriesKey,
      why: "Track, direction, frame, bandwidth code and mode: only scenes with the same grid are compared.",
    });
  items.push({
    k: "Maturity",
    v: view.plan?.maturityMixed ? "Mixed" : (result.scenes[0]?.maturity ?? "—"),
    why: view.plan?.maturityMixed
      ? "The series spans the change from provisional to validated products."
      : "Processing maturity of the scenes used.",
  });
  items.push({
    k: "Optical",
    v: result.lens?.evidence?.status === "optical_comparison_available" ? "Used" : "Not used",
    why: "A second, optical witness runs only when it was asked for and is available.",
  });
  if (posting !== undefined)
    items.push({ k: "Grid", v: `${posting} m`, why: "Posting of the radar cells in the window." });
  items.push({
    k: "Answered",
    v: view.cache === "hit" ? "From cache" : `${view.elapsedSeconds.toFixed(0)} s`,
    why:
      view.cache === "hit"
        ? "The same question was answered within the last day."
        : "Time from the request to the answer.",
  });
  return items;
};

const computeOf = (view: ExplorationView): Subject["compute"] =>
  view.stages.flatMap((stage) => {
    const label = STAGE_LABEL[stage.name];
    return label === undefined || stage.seconds === null
      ? []
      : [{ label, sub: `${stage.seconds.toFixed(1)} s` }];
  });

type Context = { name: string; frameLabel: string; point: LonLat };

// The backend's answer as the panel and the sheet read it: real numbers, no demo chips.
export const exploreSubject = (view: ExplorationView, context: Context): Subject | undefined => {
  const result = view.result;
  if (result === null) return undefined;
  const verdict = verdictOfResult(result);
  const lens = view.lens as LensId;
  const summary = result.aoiSummary;
  const reason = result.lens?.reason;
  const target = result.lens?.target_date;
  const [plain = "", ...rest] = result.limitations;
  const fireContext = fireContextOf(result);
  return {
    kind: "live",
    id: view.id,
    name: context.name,
    place: context.frameLabel,
    lens,
    focus: context.point,
    chipKm: LIVE_CHIP_KM,
    target,
    when: target === undefined ? "Latest pass" : `Target pass ${formatDay(target)}`,
    verdict,
    verdictLine: LIVE_LINE[verdict],
    reason:
      verdict === "insufficient"
        ? reason
          ? `${reason.replaceAll("_", " ")}. ${LIVE_REASON}`
          : LIVE_REASON
        : undefined,
    passes: undefined,
    stat:
      summary?.departing_fraction == null
        ? undefined
        : formatPercent(summary.departing_fraction * PERCENT),
    statLine:
      summary?.departing_fraction == null
        ? undefined
        : `of the ${summary.cells_with_measurement.toLocaleString("en-US")} measured cells left their normal range on the target pass.`,
    groups: groupsOf(result),
    matched: undefined,
    witness: undefined,
    quality: qualityOf(view, result),
    plainLimit: plain,
    techLimit: rest.join(" "),
    alternatives: LENS_ALTERNATIVES[lens] ?? [],
    empties: LIVE_EMPTIES,
    sources: fireContext === undefined ? LIVE_SOURCES : [...LIVE_SOURCES, FIRMS_SOURCE],
    figure: undefined,
    crops: undefined,
    normalRange: normalRangeOf(result),
    fireContext,
    insar: undefined,
    compute: computeOf(view),
    demo: result.isDemo,
    ...insarParts(view, result),
  };
};
