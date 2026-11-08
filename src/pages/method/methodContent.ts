import { OPTICAL, type ContrastGroup, type LensId } from "@/features/cases/cases";

/*
 * Method v7 copy and numbers. Every number is copied from the NISAR-Modeling reports linked next to
 * it (design_handoff_v7 SPECS §7); none is computed or rounded here.
 */

const MODELING = "https://github.com/Ch0comilo/NISAR-Modeling/blob/main";
const FLOOD_EVIDENCE = `${MODELING}/docs/FLOOD_EVIDENCE.md`;
const HOLDOUT = `${MODELING}/docs/EXPLORATION_HOLDOUT.md`;

export const RAMP = {
  change: "linear-gradient(90deg, #2f6db5, #f2f0eb, #c2473a)",
  viridis: "linear-gradient(90deg, #440154, #3b528b, #21918c, #5ec962, #fde725)",
};

export type SeqFrame = {
  n: string;
  title: string;
  body: string;
  tech: string;
  tag: string;
  // A real report crop; the last frame shows the contrast bars instead.
  img?: string;
  ramp?: string;
};

export const SEQ_FRAMES: SeqFrame[] = [
  {
    n: "01",
    title: "First, this place's normal echo.",
    body: "The median of the passes before the flood bulletin. Dark ribbons are the Chenab and its channels; bright patches are fields and towns.",
    tech: "baseline median HH · 3 passes · 40 m grid",
    tag: "Baseline median · HH · −30 → 0 dB",
    img: "/cases/qadirabad-base.png",
    ramp: RAMP.viridis,
  },
  {
    n: "02",
    title: "Then, how it changed on 26 July.",
    body: "Target pass minus that normal echo. Blue went darker, red went brighter, white barely moved. Calm water turns radar dark.",
    tech: "signed dB · first assessment − baseline median",
    tag: "Change · 26 Jul 2026",
    img: "/cases/qadirabad-change.png",
    ramp: RAMP.change,
  },
  {
    n: "03",
    title: "The cells that crossed the line.",
    body: "Where both channels darkened past the declared rule. These are radar signals, not flood polygons.",
    tech: "HH ≤ −3 dB and HV ≤ −1.5 dB · 1,911 cells · 92 objects",
    tag: "Darkening signature",
    img: "/cases/qadirabad-signature.png",
  },
  {
    n: "04",
    title: "A second witness, a week later.",
    body: "OPERA's optical water classes, 17 July against 2 August. Dark blue is new water, light blue water that was already there, pink is mixed.",
    tech: "OPERA DSWx-HLS · 100% usable · 7,609 mixed cells excluded",
    tag: "Optical · 17 Jul → 2 Aug",
    img: "/cases/qadirabad-optical.png",
  },
  {
    n: "05",
    title: "Agreement, and where it breaks.",
    body: "The radar flagged 64% of new-water cells and 1% of dry land. It also flagged 17% of water that was already there. We show all three.",
    tech: "proxy precision 29.7% · recall 64.3% · IoU 25.5%",
    tag: "Whole area · cell counts",
  },
];

export const SEQ_SOURCE = `${MODELING}/docs/FLOOD_CHARACTERIZATION.md`;

export type PipelineStep = { n: string; title: string; body: string; tech: string };

export const PIPELINE: PipelineStep[] = [
  {
    n: "01",
    title: "A point and a window",
    body: "You click a place and pick dates.",
    tech: "WGS84 lon/lat · UTC window ≤ 366 days",
  },
  {
    n: "02",
    title: "One compatible series",
    body: "Same track, frame and polarisations, so passes compare fairly.",
    tech: "GCOV frequency A · HH/HV · ≤ 1 retry",
  },
  {
    n: "03",
    title: "Up to six real passes",
    body: "Read from NASA's archive, not simulated.",
    tech: "≤ 6 dates · 80 m blocks, power averaged before dB",
  },
  {
    n: "04",
    title: "This spot's normal range",
    body: "Built from the passes before the target.",
    tech: "median ± max(3, 3·max(1.4826·MAD, 1)) dB",
  },
  {
    n: "05",
    title: "The target pass, compared",
    body: "Signed change in dB on the same cells.",
    tech: "observed_departure · within · insufficient",
  },
  {
    n: "06",
    title: "A second witness",
    body: "An optical satellite within four days, kept separate.",
    tech: "OPERA · ≥ 80% cell coverage · ≥ 25% joint",
  },
];

// The band chart's own sentences (Band Chart.dc.html), one per backend outcome.
export const BAND_SENTENCE = {
  departure:
    "On the target pass both radar channels came back darker than in any earlier pass, outside this spot's normal range. Calm open water often does that.",
  within: "On the target pass both channels stayed inside this spot's normal range.",
  insufficient:
    "Only two usable passes in this window. The band needs at least three earlier passes, so there is no verdict.",
};

export const LENS_NOTES: Record<LensId, { tag: string; limit: string }> = {
  flood_wetland: {
    tag: "flood_wetland · + OPERA DSWx-HLS",
    limit: "Stable water, wet soil, crops and shadow can darken radar too. No depth or extent.",
  },
  vegetation_disturbance: {
    tag: "vegetation_disturbance · + OPERA DIST-ALERT",
    limit: "Optical loss is context; the cause of the loss stays unknown.",
  },
  wildfire: {
    tag: "wildfire · HV below band, repeated",
    limit: "A fire perimeter can enclose unburned ground. No burn severity.",
  },
  agriculture: {
    tag: "agriculture · 60 m vs 120–300 m",
    limit: "A step means something changed between two passes, not what.",
  },
  insar: {
    tag: "GUNW pair · coherence",
    limit: "Coherence only. Displacement stays empty until corrections pass.",
  },
};

// One matched-cells contrast with its spatial resampling interval, in dB.
export type Interval = { channel: "HH" | "HV"; value: number; low: number; high: number };

export type Evidence = {
  id: string;
  works: boolean;
  where: string;
  title: string;
  body: string;
  href: string;
  link: string;
  source: string;
  group?: ContrastGroup;
  intervals?: Interval[];
  stat?: string;
};

export const EVIDENCE: Evidence[] = [
  {
    id: "matam",
    works: true,
    where: "Matam · Senegal",
    title: "A real flood, flagged far more often than dry land",
    group: {
      title: "",
      sub: "",
      rows: [
        { label: "New water", k: 262, n: 1469, color: OPTICAL.newWater },
        { label: "Stayed dry", k: 135, n: 12609, color: OPTICAL.dry },
      ],
    },
    body: "17.8% of strict new-water cells against 1.1% of stable dry land. Most new water was still missed.",
    href: FLOOD_EVIDENCE,
    link: "Flood evidence report →",
    source: "NISAR-Modeling · docs/FLOOD_EVIDENCE.md · Matam",
  },
  {
    id: "skollersta",
    works: true,
    where: "Sköllersta · Sweden",
    title: "A rye trial field brightened across its recorded date",
    stat: "+1.78 dB",
    body: "HH step, patch minus surroundings, between the 10 and 22 August passes. Two other trial fields barely moved.",
    href: HOLDOUT,
    link: "Geographic holdout →",
    source: "NISAR-Modeling · docs/EXPLORATION_HOLDOUT.md · Swedish crop trial records",
  },
  {
    id: "barh",
    works: false,
    where: "Barh · India",
    title: "Water that was already there got flagged too",
    group: {
      title: "",
      sub: "",
      rows: [
        { label: "New water", k: 2363, n: 2702, color: OPTICAL.newWater },
        { label: "Already water", k: 165, n: 506, color: OPTICAL.stableWater },
      ],
    },
    body: "The rule caught 87.5% of new water, but also 32.6% of stable open water. A flag alone can't say a place newly flooded.",
    href: FLOOD_EVIDENCE,
    link: "Flood evidence report →",
    source: "NISAR-Modeling · docs/FLOOD_EVIDENCE.md · Barh",
  },
  {
    id: "timber",
    works: false,
    where: "Timber Fire · USA",
    title: "Matched cells left the radar contrast uncertain",
    intervals: [
      { channel: "HH", value: -1.34, low: -3.17, high: 0.08 },
      { channel: "HV", value: 0.17, low: -0.29, high: 1.06 },
    ],
    body: "13 loss cells with unique matched controls. Both intervals include zero, so we can't say the radar saw the loss.",
    href: HOLDOUT,
    link: "Geographic holdout →",
    source: "NISAR-Modeling · docs/EXPLORATION_HOLDOUT.md · Timber Fire",
  },
  {
    id: "australia",
    works: false,
    where: "Australian control",
    title: "A learned-feature probe flagged dry land as water",
    stat: "90.5%",
    body: "of stable dry cells were labelled new water by a nearest-neighbour probe on the frozen embeddings. The representation is not promoted to labelling.",
    href: `${MODELING}/docs/CHARACTERIZATION_V05_VALIDATION.md`,
    link: "Validation report →",
    source: "NISAR-Modeling · docs/CHARACTERIZATION_V05_VALIDATION.md",
  },
  {
    id: "kumamoto",
    works: false,
    where: "Kumamoto · Japan",
    title: "Coherent fringes, but no displacement we can stand behind",
    stat: "3 of 1,614",
    body: "Only 3 common coherent cells met the correction-input checks. Line-of-sight displacement stays empty, so Chocó waits too.",
    href: `${MODELING}/TEAM_HANDOFF.md`,
    link: "Team handoff →",
    source: "NISAR-Modeling · TEAM_HANDOFF.md, docs/FLOOD_CHARACTERIZATION.md",
  },
];

// The whisker axis for the Timber Fire card, in dB; zero sits inside it.
export const INTERVAL_DOMAIN: [number, number] = [-3.5, 1.5];

export type BenchRegion = { region: string; hidden: string; rmse: [number, number, number] };

// Pooled RMSE in dB from docs/results/model_benchmark_all_dates.json; lower is better.
export const BENCH_METHODS = ["Transformer (ours)", "Temporal mean", "Interpolation"] as const;
export const BENCH_MAX_DB = 4;
export const BENCH: BenchRegion[] = [
  { region: "Amazon, Brazil", hidden: "6 passes hidden", rmse: [1.6, 1.178, 1.211] },
  { region: "Murray Basin, Australia", hidden: "14 passes hidden", rmse: [3.637, 3.007, 2.254] },
];
export const BENCH_SOURCE = `${MODELING}/docs/results/model_benchmark_all_dates.json`;

export const MODELS_REPO = "https://github.com/Ch0comilo/NISAR-Models";

export const LANDSLIDE_CHECKS = [
  "Passes before and after the event, in one series",
  "Slope visible: no radar shadow or layover",
  "Local echo or coherence change, then independent evidence",
];

export type Palette = { title: string; bar: string; left: string; right: string; note: string };

// SPECS §6 data scales. They never colour chrome.
export const PALETTES: Palette[] = [
  {
    title: "Change in dB",
    bar: RAMP.change,
    left: "−8 darker",
    right: "+8 brighter",
    note: "White is no change. Never used for earthquakes.",
  },
  {
    title: "Backscatter",
    bar: "linear-gradient(90deg, #0c0c0c, #f5f5f5)",
    left: "−27 dB",
    right: "−4 dB",
    note: "The radar image itself. Dark is calm water or smooth ground.",
  },
  {
    title: "HH − HV",
    bar: "linear-gradient(90deg, #1f8a80, #f2f0eb, #7b4fae)",
    left: "2 dB",
    right: "12 dB",
    note: "How the two channels differ. Teal to purple, so it can't be confused with change.",
  },
  {
    title: "Optical water classes",
    bar: `linear-gradient(90deg, ${OPTICAL.newWater} 0 20%, ${OPTICAL.stableWater} 20% 40%, ${OPTICAL.dry} 40% 60%, ${OPTICAL.loss} 60% 80%, ${OPTICAL.mixed} 80%)`,
    left: "new · stable · dry",
    right: "loss · mixed",
    note: "Categorical, from OPERA's legend. Shown beside the radar, never merged.",
  },
  {
    title: "Wrapped phase (earthquakes)",
    bar: "linear-gradient(90deg, #3b3f8f, #b0507a, #e8b04a, #5fae9a, #3b3f8f)",
    left: "0",
    right: "2π",
    note: "Cyclic, with no white centre, so it never reads as dB change.",
  },
  {
    title: "No measurement",
    bar: "repeating-linear-gradient(135deg, #62666d 0 3px, #54585f 3px 6px)",
    left: "grey",
    right: "",
    note: "Unsupported cells are grey, never white. Grey means we can't say.",
  },
];

// Position on a fixed axis as a CSS percentage, clamped so a value never draws off the track.
export const toPercent = (value: number, [min, max]: [number, number]): number =>
  max === min ? 0 : Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

export const formatSignedDb = (value: number): string =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(2)}`;
