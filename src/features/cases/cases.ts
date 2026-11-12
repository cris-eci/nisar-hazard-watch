import type { LonLat } from "@/features/frames/frame.types";

/*
 * Measured cases from the science backend (github.com/Ch0comilo/NISAR-Modeling). Every number here
 * is copied from its reports; DATA_PROVENANCE in design_handoff_v7 says where each one comes from.
 * Pass dates on the timeline are DEMO (12-day spacing) until the backend serves the real ones.
 */

export type LensId =
  "flood_wetland" | "vegetation_disturbance" | "wildfire" | "agriculture" | "insar";
export type HazardId = "earthquake" | "wildfire" | "deforestation" | "flood" | "landslide";
export type IconId = HazardId | "agriculture";

// The backend's three outcomes: observed_departure, within_observed_baseline, insufficient_data.
export type Verdict = "departure" | "within" | "insufficient";

export type ContrastRow = { label: string; k: number; n: number; color: string };
export type ContrastGroup = { title: string; sub: string; rows: ContrastRow[] };

export type Matched = {
  title: string;
  n: string;
  v: number;
  ci: [number, number];
  line: string;
};

export type QualityItem = { k: string; v: string; why: string };
export type Source = { label: string; href: string };

export type PassKind = "base" | "target" | "meas" | "plan";
export type TimelinePass = { date: string; kind: PassKind; outsidePct?: number };
export type TimelineData = {
  passes: TimelinePass[];
  start: string;
  end: string;
  today: string;
  onset?: { date: string; label: string };
  optical: Array<{ date: string; label: string }>;
  opticalNote: string;
};

export type Crops = { base: string; change: string; optical: string; signature: string };

export type Case = {
  id: string;
  lens: LensId;
  hazard: HazardId;
  name: string;
  place: string;
  region: string;
  focus: LonLat;
  chipKm?: number;
  when: string;
  target?: string;
  verdict: Verdict;
  verdictLine: string;
  // Which demo series the band chart draws; undefined when the lens has no band (InSAR).
  band?: Verdict;
  reason?: string;
  stat: string;
  statLine: string;
  groups?: ContrastGroup[];
  matched?: Matched;
  witness?: { label: string; note: string };
  quality: QualityItem[];
  plainLimit: string;
  techLimit: string;
  alternatives: string[];
  empties: string[];
  sources: Source[];
  figure?: string;
  crops?: Crops;
  timeline?: TimelineData;
  // Event context only: no measurement is published yet.
  pending?: boolean;
  tour?: boolean;
};

export type Lens = { id: LensId; chip: string; icon: IconId; compares: string };

export const LENSES: Lens[] = [
  {
    id: "flood_wetland",
    chip: "Did it flood?",
    icon: "flood",
    compares: "Both channels darkening, checked against OPERA optical water",
  },
  {
    id: "vegetation_disturbance",
    chip: "Did vegetation disappear?",
    icon: "deforestation",
    compares: "Radar change where optical data show loss, against matched cells",
  },
  {
    id: "wildfire",
    chip: "Did fire scar it?",
    icon: "wildfire",
    compares: "HV staying below its earlier range across several passes",
  },
  {
    id: "agriculture",
    chip: "Did a field change?",
    icon: "agriculture",
    compares: "A 60 m patch against its 120–300 m surroundings",
  },
  {
    id: "insar",
    chip: "Did the ground move?",
    icon: "earthquake",
    compares: "Where the echo kept or lost coherence between two passes",
  },
];

export const findLens = (id: LensId): Lens | undefined => LENSES.find((lens) => lens.id === id);

// OPERA's optical classes (Okabe–Ito), so the colours match the backend legend.
export const OPTICAL = {
  newWater: "#0072b2",
  stableWater: "#56b4e9",
  dry: "#a8997a",
  loss: "#e69f00",
  mixed: "#cc79a7",
  unsupported: "#62666d",
} as const;

const EMPTY_FLOOD = ["Flood depth", "Probability", "Cause", "Validated extent"];
const MODELING = "https://github.com/Ch0comilo/NISAR-Modeling/blob/main/docs";

const pass = (date: string, kind: PassKind, outsidePct?: number): TimelinePass =>
  outsidePct === undefined ? { date, kind } : { date, kind, outsidePct };

const crops = (id: string): Crops => ({
  base: `/cases/${id}-base.png`,
  change: `/cases/${id}-change.png`,
  optical: `/cases/${id}-optical.png`,
  signature: `/cases/${id}-signature.png`,
});

export const CASES: Case[] = [
  {
    id: "qadirabad",
    lens: "flood_wetland",
    hazard: "flood",
    name: "Qadirabad",
    place: "Chenab River, Pakistan",
    region: "Punjab · Chenab",
    focus: [73.713, 32.329],
    chipKm: 5.12,
    when: "Jul 2026",
    target: "2026-07-26",
    verdict: "departure",
    verdictLine:
      "At the marked point both channels darkened on 26 Jul 2026, against 3 earlier passes.",
    band: "departure",
    stat: "64.3% vs 1.0%",
    statLine: "of new-water cells flagged, against dry land. Existing water: 17.0%.",
    groups: [
      {
        title: "Flagged by the radar rule",
        sub: "first assessment minus the baseline median",
        rows: [
          { label: "New water (optical)", k: 332, n: 516, color: OPTICAL.newWater },
          { label: "Already water (optical)", k: 748, n: 4393, color: OPTICAL.stableWater },
          { label: "Stayed dry (optical)", k: 38, n: 3866, color: OPTICAL.dry },
        ],
      },
    ],
    matched: {
      title: "Matched pairs · HH, new water minus dry land",
      n: "463 pairs with similar radar before the flood",
      v: -4.93,
      ci: [-5.63, -3.88],
      line: "Spatial resampling puts it between −5.63 and −3.88 dB. The interval excludes zero.",
    },
    witness: { label: "OPERA DSWx-HLS · 17 Jul → 2 Aug", note: "Optical 3 and 7 days from radar" },
    quality: [
      { k: "Status", v: "Complete", why: "Full radar support and 100% usable optical coverage." },
      { k: "Passes", v: "3 + 5", why: "Three baseline passes, five assessment passes." },
      {
        k: "Mixed",
        v: "7,609 cells",
        why: "Mixed or partial optical cells stay out of the comparison.",
      },
    ],
    plainLimit:
      "Water that was already there darkened too, so the rule also flagged 17% of existing water.",
    techLimit:
      "Against the optical proxy: precision 29.7%, recall 64.3%, IoU 25.5% on 8,775 cells, using the multi-date baseline median. Sensitivity check: the comparator changes the result a lot. Comparing with only the last baseline pass gives 90.4% / 45.5%. That check was added after seeing the results, so it is not an alternative score.",
    alternatives: ["Existing open water", "Wet soil", "Crops"],
    empties: EMPTY_FLOOD,
    sources: [
      {
        label: "PMD / FFD · Chenab flood bulletin, 22–24 Jul 2026",
        href: "https://ffd.pmd.gov.pk/b/eacdcd80-11ca-4316-a9e9-e337e5c7d8fd",
      },
      {
        label: "NISAR-Modeling · flood characterization",
        href: `${MODELING}/FLOOD_CHARACTERIZATION.md`,
      },
      {
        label: "OPERA DSWx-HLS · PO.DAAC",
        href: "https://podaac.jpl.nasa.gov/dataset/OPERA_L3_DSWX-HLS_V1",
      },
    ],
    figure: "/cases/figures/qadirabad_flood_evidence.png",
    crops: crops("qadirabad"),
    tour: true,
    timeline: {
      passes: [
        pass("2026-06-20", "base"),
        pass("2026-07-02", "base"),
        pass("2026-07-14", "base"),
        pass("2026-07-26", "target", 11.2),
        pass("2026-08-07", "meas", 8.4),
        pass("2026-08-19", "meas", 5.1),
        pass("2026-08-31", "meas", 3.3),
        pass("2026-09-12", "meas", 2.0),
        pass("2026-11-16", "plan"),
        pass("2026-11-28", "plan"),
      ],
      start: "2026-06-10",
      end: "2026-12-05",
      today: "2026-11-08",
      onset: { date: "2026-07-22", label: "Bulletin 22 Jul" },
      optical: [
        { date: "2026-07-17", label: "OPERA · pre · 17 Jul" },
        { date: "2026-08-02", label: "OPERA · post · 2 Aug" },
      ],
      opticalNote: "Optical check: OPERA 17 Jul → 2 Aug",
    },
  },
  {
    id: "chokwe",
    lens: "flood_wetland",
    hazard: "flood",
    name: "Chókwè",
    place: "Limpopo River, Mozambique",
    region: "Gaza · Limpopo",
    focus: [32.99, -24.52],
    chipKm: 5.12,
    when: "Jan 2026",
    target: "2026-01-17",
    verdict: "departure",
    verdictLine:
      "New-water cells darkened against matched dry cells, but only one assessment pass exists.",
    band: "departure",
    stat: "37.3% vs 0.7%",
    statLine: "of new-water cells flagged, against dry land.",
    groups: [
      {
        title: "Flagged by the radar rule",
        sub: "first assessment minus the baseline median",
        rows: [
          { label: "New water (optical)", k: 164, n: 440, color: OPTICAL.newWater },
          { label: "Stayed dry (optical)", k: 20, n: 2881, color: OPTICAL.dry },
        ],
      },
    ],
    matched: {
      title: "Matched pairs · HH, new water minus dry land",
      n: "382 pairs with similar radar before the flood",
      v: -4.34,
      ci: [-5.08, -3.47],
      line: "Spatial resampling puts it between −5.08 and −3.47 dB.",
    },
    witness: {
      label: "OPERA DSWx-HLS · 7 Jan → 22 Jan",
      note: "Only 22.8% of cells had usable optical views",
    },
    quality: [
      { k: "Status", v: "Partial", why: "Cloud gaps: 22.8% joint optical support." },
      { k: "Passes", v: "4 + 1", why: "One assessment pass, so persistence can't be measured." },
      { k: "Product", v: "Beta", why: "Beta GCOV calibration and a wet-season baseline." },
    ],
    plainLimit:
      "Clouds hid most of the area from the optical satellite, and the radar looked only once after the flood.",
    techLimit:
      "The strict new-water group's median HH change is −2.35 dB, below the 3 dB diagnostic threshold. Temporal persistence or signal return can't be measured from one assessment.",
    alternatives: ["Wet-season soil moisture", "Crops", "Cloud-hidden water"],
    empties: EMPTY_FLOOD,
    sources: [
      {
        label: "NISAR-Modeling · flood characterization",
        href: `${MODELING}/FLOOD_CHARACTERIZATION.md`,
      },
      { label: "NISAR-Modeling · flood validation", href: `${MODELING}/FLOOD_VALIDATION.md` },
    ],
    figure: "/cases/figures/chokwe_flood_evidence.png",
    crops: crops("chokwe"),
    timeline: {
      passes: [
        pass("2025-11-30", "base"),
        pass("2025-12-12", "base"),
        pass("2025-12-24", "base"),
        pass("2026-01-05", "base"),
        pass("2026-01-17", "target", 17.6),
      ],
      start: "2025-11-20",
      end: "2026-02-10",
      today: "2026-02-10",
      optical: [
        { date: "2026-01-07", label: "OPERA · pre · 7 Jan" },
        { date: "2026-01-22", label: "OPERA · post · 22 Jan" },
      ],
      opticalNote: "Optical check: OPERA 7 Jan → 22 Jan · 22.8% joint coverage",
    },
  },
  {
    id: "richmond",
    lens: "flood_wetland",
    hazard: "flood",
    name: "Richmond",
    place: "Indiana, USA",
    region: "Indiana · flash flood",
    focus: [-84.89, 39.83],
    chipKm: 5.12,
    when: "Aug 2026",
    target: "2026-08-16",
    verdict: "insufficient",
    verdictLine:
      "The radar looked three days after the 12–13 Aug flash flood, and optical views found no new water to compare.",
    band: "within",
    reason:
      "No new-water group was resolved on the 13.2% of cells with usable optical views. That doesn't mean no flood happened.",
    stat: "0 cells",
    statLine: "of new water resolved by the optical snapshots, so there's nothing to score.",
    witness: { label: "OPERA DSWx-HLS · 22 Jul → 21 Aug", note: "13.2% joint optical support" },
    quality: [
      { k: "Status", v: "Partial", why: "Partial native radar support; small optical subset." },
      {
        k: "Timing",
        v: "+3 days",
        why: "First radar pass came after the reported flood interval.",
      },
      { k: "Dry land", v: "0.15% flagged", why: "8 of 5,249 stable dry cells." },
    ],
    plainLimit:
      "A short flash flood can be gone before the satellite returns. Missing evidence isn't proof nothing happened.",
    techLimit:
      "Recall is null because there are no positives. Optical support is reported against the 40,390 radar-supported cells, not the full 65,536-cell grid.",
    alternatives: ["Flood receded before the pass", "Cloud-hidden water", "Urban surfaces"],
    empties: EMPTY_FLOOD,
    sources: [
      {
        label: "NWS Wilmington · 13 Aug 2026 flash flooding",
        href: "https://www.weather.gov/iln/20260813",
      },
      {
        label: "NISAR-Modeling · flood characterization",
        href: `${MODELING}/FLOOD_CHARACTERIZATION.md`,
      },
    ],
    figure: "/cases/figures/richmond_flood_evidence.png",
    crops: crops("richmond"),
    timeline: {
      passes: [
        pass("2026-06-29", "base"),
        pass("2026-07-11", "base"),
        pass("2026-07-23", "base"),
        pass("2026-08-04", "base"),
        pass("2026-08-16", "target", 0.4),
        pass("2026-08-28", "meas", 0.3),
        pass("2026-09-09", "meas", 0.2),
        pass("2026-09-21", "meas", 0.2),
        pass("2026-11-14", "plan"),
      ],
      start: "2026-06-20",
      end: "2026-11-25",
      today: "2026-11-08",
      onset: { date: "2026-08-12", label: "Flash flood 12–13 Aug" },
      optical: [
        { date: "2026-07-22", label: "OPERA · pre · 22 Jul" },
        { date: "2026-08-21", label: "OPERA · post · 21 Aug" },
      ],
      opticalNote: "Optical check: OPERA 22 Jul → 21 Aug · 13.2% joint coverage",
    },
  },
  {
    id: "kumamoto",
    lens: "insar",
    hazard: "earthquake",
    name: "Kumamoto",
    place: "Kyushu, Japan",
    region: "Earthquake · 28 Jul 2026",
    focus: [130.65, 32.65],
    when: "Jul 2026",
    target: "2026-08-14",
    verdict: "insufficient",
    verdictLine:
      "Coherence was measured. Displacement stays empty until corrections pass their checks.",
    reason:
      "Only 3 common cells met the correction-input checks, below the reference policy. Line-of-sight displacement stays empty.",
    stat: "3 cells",
    statLine: "eligible for corrections out of 1,614 coherent ones.",
    witness: { label: "GSI multi-mission analysis (external)", note: "Credited, not our result" },
    quality: [
      { k: "Status", v: "Partial", why: "Coherence available, no phase reference." },
      { k: "Pair", v: "21 Jul → 14 Aug", why: "The interval brackets the 28 Jul earthquake." },
      {
        k: "Displacement",
        v: "Empty",
        why: "Atmosphere, ionosphere and reference not corrected.",
      },
    ],
    plainLimit: "We can show where the radar signal stayed steady, not how far the ground moved.",
    techLimit:
      "Phase-equivalent centimetres are a wavelength scale, not deformation. The interval mixes coseismic, postseismic and atmospheric signal.",
    alternatives: ["Atmospheric phase", "Ionosphere", "Unwrapping error"],
    empties: ["Displacement", "Magnitude", "Probability"],
    sources: [
      {
        label: "GSI · 2026 Kumamoto earthquake analysis",
        href: "https://www.gsi.go.jp/uchusokuchi/20260728kumamoto-e.html",
      },
      {
        label: "NISAR L2 GUNW · ASF product guide",
        href: "https://nisar-docs.asf.alaska.edu/gunw/",
      },
    ],
    figure: "/cases/figures/interferometry.png",
    timeline: {
      passes: [
        pass("2026-07-09", "meas"),
        pass("2026-07-21", "base"),
        pass("2026-08-14", "target"),
        pass("2026-08-26", "meas"),
        pass("2026-09-07", "meas"),
        pass("2026-11-20", "plan"),
      ],
      start: "2026-07-01",
      end: "2026-11-28",
      today: "2026-11-08",
      onset: { date: "2026-07-28", label: "Earthquake 28 Jul" },
      optical: [],
      opticalNote: "InSAR pair · no optical stage",
    },
  },
  {
    id: "choco",
    lens: "insar",
    hazard: "earthquake",
    name: "Chocó",
    place: "Colombia",
    region: "Earthquake · 10 Aug 2026",
    focus: [-76.65, 5.69],
    when: "Aug 2026",
    verdict: "insufficient",
    verdictLine: "No measurement yet. We're waiting on InSAR corrections before showing anything.",
    reason: "InSAR correction checks don't pass yet anywhere, so we don't publish a Chocó result.",
    stat: "Pending",
    statLine: "location approximate until the NISAR frame is set.",
    quality: [
      { k: "Status", v: "Context only", why: "Event facts from SGC go here." },
      { k: "Frame", v: "To set", why: "From the NISAR Observation Plan." },
      { k: "SGC", v: "[Report]", why: "Servicio Geológico Colombiano report." },
    ],
    plainLimit: "We won't show ground motion until the radar corrections are ready.",
    techLimit: "los_displacement_cm stays null; correction-readiness gates unmet.",
    alternatives: [],
    empties: ["Displacement", "Magnitude", "Casualties"],
    sources: [{ label: "Servicio Geológico Colombiano", href: "https://www.sgc.gov.co" }],
    pending: true,
  },
];

export const findCase = (id: string | null): Case | undefined =>
  CASES.find((item) => item.id === id);

export const percent = (k: number, n: number): number => (n === 0 ? 0 : (k / n) * 100);

// Two decimals only for tiny shares (8 of 5,249 is 0.15%); 38 of 3,866 still reads 1.0%.
export const formatPercent = (value: number): string =>
  `${value > 0 && value < 0.95 ? value.toFixed(2) : value.toFixed(1)}%`;
