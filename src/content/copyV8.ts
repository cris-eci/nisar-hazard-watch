// Visible strings of design v8 (docs/design/v8/COPY-v8.md), verbatim. Components read them from here.
// `{x}` placeholders are small functions; callers pass values from the API, never invented ones.
// Not here: §6.5 possible drivers (Barh-only, #21) and §8 errors (v8-data.js, the waiting issue).

import type { LensId } from "@/features/cases/cases";

// Counts are always en-US ("5,513"), whatever the browser's locale.
export const formatCount = (value: number): string => value.toLocaleString("en-US");

// COPY-v8 "Chips".
export const CHIP_COPY = {
  real: "REAL",
  realDates: "REAL DATES",
  demo: "DEMO DATA",
  demoDates: "DEMO DATES",
  todo: "TO FILL",
  pending: "PENDING",
  unavailable: "UNAVAILABLE",
  experimental: "EXPERIMENTAL",
  hypothesis: "HYPOTHESIS · NOT A RESULT",
  instant: "INSTANT",
} as const;

// Shared templates used by several steps.
export const passOf = (k: number, n: number): string => `PASS ${k} OF ${n}`;
export const cellsOf = (n: number, m: number): string =>
  `${formatCount(n)} of ${formatCount(m)} cells`;

// Top bar
export const TOP_BAR = {
  wordmark: "NISAR Hazard Watch",
  searchPlaceholder: "Search a place or paste coordinates",
  searchPlaceholderMobile: "Search a place",
  // COPY writes `{lat}° N, {lon}° E`; callers pass formatLonLat, whose hemisphere letters follow
  // the sign (#24), so a southern or western point never reads "−25° N".
  searchLiveSub: (coordinates: string) => `${coordinates} · live analysis`,
  searchCaseSub: (hazard: string, monthYear: string) => `Known case · ${hazard} · ${monthYear}`,
  // The kind line of a pasted point on the place card (#24, new copy).
  coordinatesKind: "coordinates",
  // Before a job starts there is no backend estimate (decision 8 governs the waiting bar), so the
  // search keeps COPY's tag.
  tagLive: "1–4 MIN",
  tagInstant: "INSTANT",
  ascending: "Ascending",
  descending: "Descending",
  ascendingMobile: "Asc",
  descendingMobile: "Desc",
  modeTour: "Guided tour",
  modeExplore: "Explore",
  linkCases: "Cases",
  linkMethod: "Method",
  wholeGlobe: "Whole globe",
  help: "Help",
  download: "Download",
  fullScreen: "Full screen",
} as const;

// 1 · Find a place
export const STEP_1 = {
  kicker: "KNOWN CASES · OPEN INSTANTLY",
  title: "What did the radar see?",
  body: "Start with a measured case, or search a place and click any land to read its NISAR passes live.",
  caseName: (name: string, country: string) => `${name}, ${country}`,
  caseSub: (hazard: string, monthYear: string) => `${hazard} · ${monthYear}`,
  caseTag: "INSTANT",
  chocoSub: "Coherence only · Aug 2026",
  // Decision 8 (docs/design/README.md) overrides fixed waits: the UI shows the backend's estimate.
  hint: "Click any land to analyze a 10 km spot live. It reads up to 5 recent passes and takes 1–4 minutes.",
  storyButton: "Watch the 1-minute story",
  globeAria: "Globe. Click any land to analyze a spot.",
} as const;

// 1 · Known case (coherence)
export const STEP_1_COHERENCE = {
  kicker: (region: string, hazard: string, date: string) =>
    `KNOWN CASE · ${region} · ${hazard} ${date}`,
  chip: "Interferometric coherence",
  statLabel: "median coherence, 0–1",
  body: (date1: string, date2: string, n: number, event: string) =>
    `Between ${date1} and ${date2}, a ${n}-day pair that brackets the ${event}. Low values mean the echo changed between the two passes.`,
  scaleLow: "0 · CHANGED",
  scaleMedian: (x: string) => `MEDIAN ${x}`,
  scaleHigh: "1 · ALIKE",
  qualityPair: (n: number) => `PAIR ${n} days`,
  qualityGrid: (posting: string) => `GRID ${posting}`,
  qualityDisplacement: "DISPLACEMENT Not shown",
  // Decision 2 (docs/design/README.md) overrides "No lens": ground motion stays a visible entry.
  footer: "No lens for ground motion. Coherence is not displacement, so no centimetres are shown.",
} as const;

// 2 · Pick a spot
export const STEP_2 = {
  kicker: "NEW SPOT · LIVE ANALYSIS",
  areaLabel: "AREA",
  areaValue: (km: string) => `${km} km square`,
  areaSub: (posting: string, cells: number) => `${posting} grid · ${formatCount(cells)} cells`,
  waitLabel: "EXPECTED WAIT",
  // Decision 8 (docs/design/README.md) overrides fixed waits: the UI shows the backend's estimate.
  waitValue: "1–4 min",
  waitSub: "plus any queue",
  catalogLabel: (direction: string) => `IN THE CATALOG · ${direction}`,
  // #25: the backend's series key didn't say the direction, so none is printed.
  catalogLabelPlain: "IN THE CATALOG",
  catalogWindow: "LAST 5 MONTHS",
  // Only when a gap longer than 24 days exists.
  gapNote: (n: number, date: string) =>
    `Only dates NISAR actually measured. The ${n}-day gap after ${date} is real.`,
  primary: "Analyze this spot",
  secondary: "Open a known case instead · instant",
  noDataKicker: "CLICKED POINT · NO COVERAGE",
  noDataTitle: "No NISAR data here",
  noDataBody:
    "The catalog has no compatible passes at this point. Over open ocean NISAR data isn't analyzed here.",
  noDataNearest: (km: string) => `Nearest known case · about ${km} km`,
  noDataButton: "Pick another spot",
} as const;

// 3 · Wait
export const STEP_3 = {
  kicker: (place: string) => `LIVE ANALYSIS · ${place}`,
  title: "Reading NISAR passes for this spot",
  // Decision 8 (docs/design/README.md) overrides fixed waits: the UI shows the backend's estimate.
  timerNote: "usually 1–4 min",
  timerNoteQueue: "plus any queue",
  axis: ["0", "1 MIN", "2", "3", "4 MIN", "5"],
  queuePosition: (n: number) => `#${n}`,
  queueNote: "One analysis is ahead of yours. Yours starts as soon as it ends.",
  stepSearch: "Searching the catalog",
  stepSearchDone: (n: number, direction: string, from: string, to: string) =>
    `${n} passes found · ${direction} · ${from} → ${to}`,
  stepRead: "Reading passes",
  stepReadDone: (k: number, n: number) => `${k} of ${n} read`,
  stepReadRunning: (k: number, n: number) => `${k} of ${n} read · each appears on the timeline`,
  stepMeasure: "Measuring change",
  stepMeasureDone: "Target minus baseline median",
  stepDraw: "Drawing layers",
  stepDrawDone: "HH, HV and change",
  stepPending: "waiting",
  stepCurrent: "in progress",
  didYouKnow: (i: number, n: number) => `DID YOU KNOW? · ${i} OF ${n}`,
  cancel: "Cancel analysis",
  compactTitle: (lens: string) => `Running the ${lens} lens`,
  compactSub: (elapsed: string, n: number) =>
    `${elapsed} elapsed · on the ${n} passes already read`,
} as const;

// 4 · Raw observations
export const STEP_4 = {
  kicker: (date: string, k: number, n: number) => `RAW RADAR · ${date} · ${passOf(k, n)}`,
  thumbHH: "HH",
  thumbHHScale: "−30…0 dB",
  thumbHV: "HV",
  thumbHVScale: "−30…0 dB",
  thumbChange: "Change",
  thumbChangeScale: "target − median",
  legendHH: (date: string) => `HH on ${date}, fixed −30 to 0 dB gray.`,
  legendHV: (date: string) => `HV on ${date}, same fixed gray as HH so both read alike.`,
  legendChange: "Target minus baseline median, signed dB, HH.",
  legendChangeLow: "−8 darker",
  legendChangeMid: "0",
  legendChangeHigh: "+8 brighter",
  legendRule: "Cells where HH ≤ −3 dB and HV ≤ −1.5 dB against their own baseline.",
  legendRuleMeets: "Meets rule",
  legendRuleNot: "Doesn't",
  legendCoherence: "Interferometric coherence, fixed 0–1, cividis. Not displacement.",
  dockTitle: "RADAR ON THE GLOBE",
  dockHH: "HH backscatter",
  dockHV: "HV backscatter",
  dockChange: "Change",
  dockRule: "Flood rule cells",
  dockCoherence: "Coherence",
  dockNoPair: "NO PAIR",
  dockLandCover: "Land cover",
  dockGrey: "Grey: no measurement",
  dockOpacity: "Opacity",
  // Not in COPY-v8: approved by Cristian for #20, where a pass has no image for a channel.
  noImage: "No image",
  noPassImage: (pol: "HH" | "HV") => `No ${pol} image for this pass`,
  lensTitle: "LOOK THROUGH A LENS",
  lensOrAsk: "Or ask",
  // Decision 2 (docs/design/README.md) overrides "no lens": ground motion stays a visible entry.
  lensFooter:
    "Ground motion has no lens. Where an interferometric pair exists, coherence (0–1) appears as a raw layer.",
  // "measured" is not in COPY-v8: Cristian approved it (#20) for a pass that is neither baseline nor target.
  timelinePass: (date: string, role: "target" | "baseline" | "measured", k: number, n: number) =>
    `${date} · ${role} · pass ${k} of ${n}`,
  timelineWindow: (direction: string, from: string, to: string) =>
    `${direction} · ${from} – ${to} · ONLY MEASURED DATES`,
  timelineBaseline: (n: number) => `BASELINE · ${n} PASSES`,
  timelineToday: "TODAY",
  timelineArriving: (k: number, n: number) => `Passes arriving · ${k} of ${n} read`,
  timelineArrivingSub: "Each pass appears here as soon as it is read",
  playAria: (n: number) => `Play the ${n} passes`,
  pauseAria: "Pause time-lapse",
  playStampPass: (k: number, n: number, role: "BASELINE" | "TARGET") => `${passOf(k, n)} · ${role}`,
  footprint: (km: string, posting: string) => `ANALYSIS AREA · ${km} km · ${posting} GRID`,
  footprintMobile: (km: string, posting: string) => `${km} km · ${posting}`,
} as const;

// 5 · Lenses. Ground motion (`insar`) is not in the handoff's table (decision 2 keeps it apart).
export type V8LensId = Exclude<LensId, "insar">;

export type LensCopy = { label: string; question: string; rule: string };

export const LENS_COPY: Record<V8LensId, LensCopy> = {
  flood_wetland: {
    label: "Flood & wetland",
    question: "Did water appear here?",
    rule: "HH ≤ −3 dB and HV ≤ −1.5 dB vs this spot's baseline",
  },
  vegetation_disturbance: {
    label: "Vegetation disturbance",
    question: "Was vegetation lost?",
    rule: "Radar change where optical shows loss, against matched cells",
  },
  wildfire: {
    label: "Wildfire",
    question: "Did the fire spread?",
    rule: "HV below its baseline band on two or more passes",
  },
  agriculture: {
    label: "Agriculture",
    question: "Did this field change differently from its neighbours?",
    rule: "A 60 m patch against matched cells 120–300 m away",
  },
};

// 6 · Lens result
export const STEP_6 = {
  verdictDeparture: "Departure observed",
  verdictWithin: "Within its usual range",
  verdictNotEnough: "Not enough data",
  floodHeadline: (newWater: boolean, fraction: string) =>
    `${newWater ? "New water" : "No new water"} at the exact spot you clicked. Around it, ${fraction} of the area darkened the way calm new water does.`,
  ruleTitle: "WHERE THE FLOOD RULE IS MET",
  ruleCount: cellsOf,
  ruleToggleOn: "On the globe",
  ruleToggleOff: "Show on globe",
  ruleCaption: (date: string, n: number, k: number) =>
    `Dark navy cells: HH fell 3 dB or more and HV 1.5 dB or more on ${date}, against each cell's own median of ${n} earlier passes. Another ${formatCount(k)} cells brightened. Cells meeting a rule, not flooded area.`,
  pixelTitle: "AT THE PIXEL YOU CLICKED",
  pixelHH: "HH",
  pixelHV: "HV",
  pixelDelta: (signed: string) => `${signed} dB`,
  pixelBand: (x: string, inside: boolean) => `band ±${x} dB · ${inside ? "inside" : "outside"}`,
  whyTwoTitle: "WHY TWO",
  whyTwo: {
    flood_wetland:
      "HH mostly bounces off surfaces; HV comes from echoes scattered inside leaves and branches. Calm water mirrors the pulse away, so it darkens both. That is why the rule asks for both.",
    vegetation_disturbance:
      "HV comes mostly from leaves and branches. When trees are cleared HV drops more than HH, so the lens watches HV first.",
    wildfire:
      "Burning removes the canopy that scatters HV. A drop in HV that stays low on later passes is the radar trace of a burn scar.",
    agriculture:
      "Crops change through the season in both channels. Comparing a field with its neighbours on the same dates separates one field's change from the season's.",
  } satisfies Record<V8LensId, string>,
  opticalTitle: "SECOND WITNESS · OPERA OPTICAL",
  opticalPending: "PENDING",
  opticalReady: "READY · REAL",
  opticalUnavailable: "UNAVAILABLE",
  opticalAgree: (n: number) =>
    `Optical images agree: ${n} in 10 cells that turned to water also meet the radar rule. Cells that stayed dry almost never do.`,
  // When fewer than 5 in 10 agree.
  opticalPartly: (n: number) =>
    `Optical images partly agree: ${n} in 10 cells that turned to water also meet the radar rule.`,
  opticalPendingText: (d1: string, d2: string) =>
    `Looking for optical snapshots within 4 days of ${d1} and ${d2}. The radar result doesn't wait for it.`,
  opticalUnavailableText:
    "No OPERA snapshot with enough clear cells within 4 days of the radar dates. The radar result stands on its own.",
  whiskerCaption: (n: number) =>
    `New-water cells minus matched dry cells, ${formatCount(n)} pairs · 95% spatial interval`,
  opticalPoint: (state: string) => `At your pixel's optical cell: ${state}.`,
  surroundingsTitle: "THIS SPOT VS ITS SURROUNDINGS",
  surroundingsInsufficient: (n: number, posting: string, k: number) =>
    `The 60 m patch holds ${n} cell on this ${posting} grid; the comparison needs ${k}.`,
  moreInfo: "More information",
} as const;

// Lens result card (#21): §3 and §6 strings with their numbers filled from the answer, plus the lines
// Cristian approved on 13 Nov 2026 (surroundings, ground-motion entry). Verbatim where COPY has them.
export const LENS_CARD = {
  kicker: (label: string) => `LENS · ${label.toUpperCase()}`,
  // SPECS-v8 §6: the share of cells meeting the rule, in words.
  fewCells: "a few cells",
  aboutATenth: "about a tenth",
  aQuarter: "a quarter",
  aThird: "a third",
  aboutHalf: "about half",
  most: "most",
  // §6 caption; "Dark navy cells: " only when the rule thumbnail is on screen to point at.
  ruleCaption: (thumb: boolean, co: string, cross: string, date: string, n: number, k: number) =>
    `${thumb ? "Dark navy cells: " : ""}HH fell ${co} dB or more and HV ${cross} dB or more on ${date}, against each cell's own median of ${n} earlier passes. Another ${formatCount(k)} cells brightened. Cells meeting a rule, not flooded area.`,
  // §3 compact row without "on the {n} passes already read": a lens switch is a new run (decision 5).
  runningSub: (elapsed: string) => `${elapsed} elapsed`,
  cancelLens: "Cancel lens",
  // Decision 2: ground motion stays a visible entry, in the app's existing words.
  groundMotion: "Did the ground move?",
  groundMotionNote: "measured, not a verdict",
  surroundingsSame: "Did not darken more",
  surroundingsDarker: "Darkened more",
  surroundingsNotEnough: "Not enough data",
  surroundingsSameLine: (r: number, a: number, b: number) =>
    `The ${r} m patch around your pixel did not darken more than matched cells ${a}–${b} m away.`,
  surroundingsDarkerLine: (r: number, a: number, b: number, co: string, cross: string) =>
    `The ${r} m patch around your pixel darkened more than matched cells ${a}–${b} m away: by ${co} dB or more in HH and ${cross} dB or more in HV.`,
  surroundingsCounts: (f: number, c: number, s: number) =>
    `${formatCount(f)} cells in the patch, compared with ${formatCount(c)} matched cells out of ${formatCount(s)} around it.`,
  // §6 insufficient template with the patch radius and the plural from the answer.
  surroundingsInsufficient: (r: number, n: number, posting: string, k: number) =>
    `The ${r} m patch holds ${formatCount(n)} ${n === 1 ? "cell" : "cells"} on this ${posting} grid; the comparison needs ${formatCount(k)}.`,
} as const;

// 7 · More information
export const STEP_7 = {
  kicker: (
    place: string,
    lens: string,
    lat: string,
    lon: string,
    n: number,
    from: string,
    to: string,
  ) => `${place} · ${lens} · ${lat}, ${lon} · ${n} PASSES, ${from} – ${to}`,
  title: (place: string) => `What the radar measured at ${place}`,
  tabSummary: "Summary",
  tabDetail: "More detail",
  switchPlain: "Plain",
  switchTechnical: "Technical",
  questionTitle: "01 · THE QUESTION",
  questionWhere: "WHERE",
  questionWhen: "WHEN",
  questionWhat: "QUESTION",
  measurementTitle: "02 · THE MEASUREMENT",
  sliderBaseline: (n: number) => `BASELINE MEDIAN · ${n} PASSES`,
  sliderTarget: (date: string) => `TARGET · ${date}`,
  sliderCaption: "Drag to compare HH before and after, both on the same fixed −30 to 0 dB gray.",
  tileChangeHH: "Change HH",
  tileChangeHV: "Change HV",
  tileRule: "Flood rule cells",
  tileOptical: "Optical groups",
  plainTitle: "03 · IN PLAIN WORDS",
  howTitle: "HOW THIS WAS COMPUTED",
  howSteps: [
    { title: "Finding NISAR passes over this point", sub: "catalog · compatible series" },
    { title: "Choosing one radar series", sub: "same track, frame, polarizations" },
    {
      title: (n: number) => `Reading ${n} passes`,
      sub: (posting: string) => `GCOV · HH and HV · ${posting}`,
    },
    {
      title: "Building this spot's normal range",
      sub: (n: number) => `median ± MAD of ${n} earlier passes`,
    },
    { title: "Comparing the target pass", sub: "signed dB, common cells" },
    { title: "Looking for optical water", sub: "OPERA DSWx · within 4 days" },
  ],
  evidenceTitle: "EVIDENCE AND QUALITY",
  sourcesTitle: "SOURCES",
  historiesTitle: "01 · CHANNEL HISTORIES",
  balanceTitle: "02 · POLARIZATION BALANCE · HV − HH",
  patchesTitle: "03 · SPATIAL STRUCTURE · PATCHES",
  historicalTitle: "04 · HISTORICAL BEHAVIOUR",
  gpUnavailable: (n: number) => `Model fit (GP) unavailable: needs 6 passes, this spot has ${n}.`,
} as const;
