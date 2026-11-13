// v7 shared content: lenses, icons and measured cases. Numbers are copied from
// github.com/Ch0comilo/NISAR-Modeling (FLOOD_EVIDENCE.md, EXPLORATION_HOLDOUT.md, TEAM_HANDOFF.md).
// Per-point time series and radar textures in the UI stay DEMO until the backend TIFFs are wired.
export const VERSION = "Design v7 · 0.7.0";
export const IC = {
  earthquake: "M2 12h4l2-5 3 10 3-12 2 7h6",
  flood: "M12 3c2.5 3 4 5 4 7a4 4 0 0 1-8 0c0-2 1.5-4 4-7zM3 19c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1",
  wildfire: "M12 3c.5 3 4 4.8 4 9.2a4 4 0 0 1-8 .2c0-1.8.9-3 2-3.9.2 1.7 1 2.6 2 2.9-.6-2.8-.4-5.8 0-8.4z",
  deforestation: "M12 3l5 7h-3l4 6H6l4-6H7zM12 16v5M8 21h8",
  landslide: "M3 20h18M3 20l6-10 3.5 4.5M12.5 14.5l2-2 6.5 7.5M15 8.5l1.6-.8M17.5 11.5l1.8-.2M13.5 5.5l.6-1.6",
  agriculture: "M3 20h18M7 20v-8M12 20V8M17 20v-8M7 12c-2 0-3-1.5-3-3.5 2 0 3 1.5 3 3.5zM12 8c-2 0-3-1.5-3-3.5 2 0 3 1.5 3 3.5zM17 12c2 0 3-1.5 3-3.5-2 0-3 1.5-3 3.5z",
};
export const HAZARDS = [
  { id: "earthquake", label: "Earthquakes", d: IC.earthquake },
  { id: "wildfire", label: "Wildfires", d: IC.wildfire },
  { id: "deforestation", label: "Deforestation", d: IC.deforestation },
  { id: "flood", label: "Floods", d: IC.flood },
  { id: "landslide", label: "Landslides", d: IC.landslide },
];
export const LENSES = [
  { id: "flood_wetland", chip: "Did it flood?", icon: "flood", compares: "Both channels darkening, checked against OPERA optical water" },
  { id: "vegetation_disturbance", chip: "Did vegetation disappear?", icon: "deforestation", compares: "Radar change where optical data show loss, against matched cells" },
  { id: "wildfire", chip: "Did fire scar it?", icon: "wildfire", compares: "HV staying below its earlier range across several passes" },
  { id: "agriculture", chip: "Did a field change?", icon: "agriculture", compares: "A 60 m patch against its 120–300 m surroundings" },
  { id: "insar", chip: "Did the ground move?", icon: "earthquake", compares: "Where the echo kept or lost coherence between two passes" },
];
const NEW = "#0072b2", DRY = "#a8997a", OLDW = "#56b4e9", IN = "#cc79a7", OUT = "#a9a69e";
const tl = (passes, extra) => ({ passes, start: passes[0][0].slice(0, 8) + "01", today: "2026-11-08", demo: true, ...extra });
const EMPTY_FLOOD = ["Flood depth", "Probability", "Cause", "Validated extent"];
export const CASES = [
  {
    id: "qadirabad", lens: "flood_wetland", hazard: "flood", name: "Qadirabad", place: "Chenab River, Pakistan", region: "PUNJAB · CHENAB", focus: [73.713, 32.329], when: "Jul 2026", target: "2026-07-26",
    state: "departure", stateLine: "At the marked point both channels darkened on 26 Jul 2026, against 3 earlier passes.", band: "departure", drape: true, tour: true,
    chipKm: 5.12, figure: "docs/images/qadirabad_flood_evidence.png", crops: { base: "docs/cases/qadirabad-base.png", change: "docs/cases/qadirabad-change.png", optical: "docs/cases/qadirabad-optical.png", signature: "docs/cases/qadirabad-signature.png" },
    stat: "64.3% vs 1.0%", statLine: "of new-water cells flagged, against dry land. Existing water: 17.0%",
    groups: [{ title: "Flagged by the radar rule", sub: "first assessment minus the baseline median", rows: [{ label: "New water (optical)", k: 332, n: 516, color: NEW }, { label: "Already water (optical)", k: 748, n: 4393, color: OLDW }, { label: "Stayed dry (optical)", k: 38, n: 3866, color: DRY }] }],
    matched: { title: "Matched pairs · HH, new water minus dry land", n: "463 pairs with similar radar before the flood", v: -4.93, ci: [-5.63, -3.88], unit: "dB", line: "Spatial resampling puts it between −5.63 and −3.88 dB. The interval excludes zero." },
    witness: { kind: "optical", label: "OPERA DSWx-HLS · 17 Jul → 2 Aug", note: "Optical 3 and 7 days from radar" },
    quality: [{ k: "STATUS", v: "Complete", why: "Full radar support and 100% usable optical coverage." }, { k: "PASSES", v: "3 + 5", why: "Three baseline passes, five assessment passes." }, { k: "MIXED", v: "7,609 cells", why: "Mixed or partial optical cells stay out of the comparison." }],
    plainLimit: "Water that was already there darkened too, so the rule also flagged 17% of existing water.",
    techLimit: "Against the optical proxy: precision 29.7%, recall 64.3%, IoU 25.5% on 8,775 cells, using the multi-date baseline median. Sensitivity check: the comparator changes the result a lot. Comparing with only the last baseline pass gives 90.4% / 45.5%. That check was added after seeing the results, so it is not an alternative score.",
    alternatives: ["Existing open water", "Wet soil", "Crops"], empties: EMPTY_FLOOD,
    sources: [
      { label: "PMD / FFD · Chenab flood bulletin, 22–24 Jul 2026", href: "https://ffd.pmd.gov.pk/b/eacdcd80-11ca-4316-a9e9-e337e5c7d8fd" },
      { label: "NISAR-Modeling · flood characterization", href: "https://github.com/Ch0comilo/NISAR-Modeling/blob/main/docs/FLOOD_CHARACTERIZATION.md" },
      { label: "OPERA DSWx-HLS · PO.DAAC", href: "https://podaac.jpl.nasa.gov/dataset/OPERA_L3_DSWX-HLS_V1" },
    ],
    timeline: tl([["2026-06-20", "base"], ["2026-07-02", "base"], ["2026-07-14", "base"], ["2026-07-26", "target", 11.2], ["2026-08-07", "meas", 8.4], ["2026-08-19", "meas", 5.1], ["2026-08-31", "meas", 3.3], ["2026-09-12", "meas", 2.0], ["2026-11-16", "plan"], ["2026-11-28", "plan"]], { start: "2026-06-10", end: "2026-12-05", onset: ["2026-07-22", "BULLETIN 22 JUL"], optical: [["2026-07-17", "OPERA · pre · 17 Jul"], ["2026-08-02", "OPERA · post · 2 Aug"]], opticalNote: "Optical check: OPERA 17 Jul → 2 Aug" }),
  },
  {
    id: "chokwe", lens: "flood_wetland", hazard: "flood", name: "Chókwè", place: "Limpopo River, Mozambique", region: "GAZA · LIMPOPO", focus: [32.99, -24.52], when: "Jan 2026", target: "2026-01-17",
    state: "departure", stateLine: "New-water cells darkened against matched dry cells, but only one assessment pass exists.", band: "departure", drape: true,
    chipKm: 5.12, figure: "docs/images/chokwe_flood_evidence.png", crops: { base: "docs/cases/chokwe-base.png", change: "docs/cases/chokwe-change.png", optical: "docs/cases/chokwe-optical.png", signature: "docs/cases/chokwe-signature.png" },
    stat: "37.3% vs 0.7%", statLine: "of new-water cells flagged, against dry land",
    groups: [{ title: "Flagged by the radar rule", sub: "first assessment minus the baseline median", rows: [{ label: "New water (optical)", k: 164, n: 440, color: NEW }, { label: "Stayed dry (optical)", k: 20, n: 2881, color: DRY }] }],
    matched: { title: "Matched pairs · HH, new water minus dry land", n: "382 pairs with similar radar before the flood", v: -4.34, ci: [-5.08, -3.47], unit: "dB", line: "Spatial resampling puts it between −5.08 and −3.47 dB." },
    witness: { kind: "optical", label: "OPERA DSWx-HLS · 7 Jan → 22 Jan", note: "Only 22.8% of cells had usable optical views" },
    quality: [{ k: "STATUS", v: "Partial", why: "Cloud gaps: 22.8% joint optical support." }, { k: "PASSES", v: "4 + 1", why: "One assessment pass, so persistence can't be measured." }, { k: "PRODUCT", v: "Beta", why: "Beta GCOV calibration and a wet-season baseline." }],
    plainLimit: "Clouds hid most of the area from the optical satellite, and the radar looked only once after the flood.",
    techLimit: "The strict new-water group's median HH change is −2.35 dB, below the 3 dB diagnostic threshold. Temporal persistence or signal return can't be measured from one assessment.",
    alternatives: ["Wet-season soil moisture", "Crops", "Cloud-hidden water"], empties: EMPTY_FLOOD,
    sources: [{ label: "NISAR-Modeling · flood characterization", href: "https://github.com/Ch0comilo/NISAR-Modeling/blob/main/docs/FLOOD_CHARACTERIZATION.md" }, { label: "NISAR-Modeling · flood validation", href: "https://github.com/Ch0comilo/NISAR-Modeling/blob/main/docs/FLOOD_VALIDATION.md" }],
    timeline: tl([["2025-11-30", "base"], ["2025-12-12", "base"], ["2025-12-24", "base"], ["2026-01-05", "base"], ["2026-01-17", "target", 17.6]], { start: "2025-11-20", end: "2026-02-10", today: "2026-02-10", onset: null, optical: [["2026-01-07", "OPERA · pre · 7 Jan"], ["2026-01-22", "OPERA · post · 22 Jan"]], opticalNote: "Optical check: OPERA 7 Jan → 22 Jan · 22.8% joint coverage" }),
  },
  {
    id: "richmond", lens: "flood_wetland", hazard: "flood", name: "Richmond", place: "Indiana, USA", region: "INDIANA · FLASH FLOOD", focus: [-84.89, 39.83], when: "Aug 2026", target: "2026-08-16",
    state: "insufficient", stateLine: "The radar looked three days after the 12–13 Aug flash flood, and optical views found no new water to compare.", band: "within", drape: true,
    chipKm: 5.12, figure: "docs/images/richmond_flood_evidence.png", crops: { base: "docs/cases/richmond-base.png", change: "docs/cases/richmond-change.png", optical: "docs/cases/richmond-optical.png", signature: "docs/cases/richmond-signature.png" },
    stat: "0 cells", statLine: "of new water resolved by the optical snapshots, so there's nothing to score",
    reason: "No new-water group was resolved on the 13.2% of cells with usable optical views. That doesn't mean no flood happened.",
    witness: { kind: "optical", label: "OPERA DSWx-HLS · 22 Jul → 21 Aug", note: "13.2% joint optical support" },
    quality: [{ k: "STATUS", v: "Partial", why: "Partial native radar support; small optical subset." }, { k: "TIMING", v: "+3 days", why: "First radar pass came after the reported flood interval." }, { k: "DRY LAND", v: "0.15% flagged", why: "8 of 5,249 stable dry cells." }],
    plainLimit: "A short flash flood can be gone before the satellite returns. Missing evidence isn't proof nothing happened.",
    techLimit: "Recall is null because there are no positives. Optical support is reported against the 40,390 radar-supported cells, not the full 65,536-cell grid.",
    alternatives: ["Flood receded before the pass", "Cloud-hidden water", "Urban surfaces"], empties: EMPTY_FLOOD,
    sources: [{ label: "NWS Wilmington · 13 Aug 2026 flash flooding", href: "https://www.weather.gov/iln/20260813" }, { label: "NISAR-Modeling · flood characterization", href: "https://github.com/Ch0comilo/NISAR-Modeling/blob/main/docs/FLOOD_CHARACTERIZATION.md" }],
    timeline: tl([["2026-06-29", "base"], ["2026-07-11", "base"], ["2026-07-23", "base"], ["2026-08-04", "base"], ["2026-08-16", "target", 0.4], ["2026-08-28", "meas", 0.3], ["2026-09-09", "meas", 0.2], ["2026-09-21", "meas", 0.2], ["2026-11-14", "plan"]], { start: "2026-06-20", end: "2026-11-25", onset: ["2026-08-12", "FLASH FLOOD 12–13 AUG"], optical: [["2026-07-22", "OPERA · pre · 22 Jul"], ["2026-08-21", "OPERA · post · 21 Aug"]], opticalNote: "Optical check: OPERA 22 Jul → 21 Aug · 13.2% joint coverage" }),
  },
  {
    id: "kumamoto", lens: "insar", hazard: "earthquake", name: "Kumamoto", place: "Kyushu, Japan", region: "EARTHQUAKE · 28 JUL 2026", focus: [130.65, 32.65], when: "Jul 2026", target: "2026-08-14",
    state: "insufficient", stateLine: "Coherence was measured. Displacement stays empty until corrections pass their checks.", band: null, drape: true, figure: "docs/images/interferometry.png",
    crops: { change: "docs/cases/kumamoto-coherence.png" }, coherence: { median: 0.384, pair: "21 Jul → 14 Aug 2026", png: "docs/layers/kumamoto-coherence.png", scale: "cividis 0–1" },
    stat: "3 cells", statLine: "eligible for corrections out of 1,614 coherent ones",
    reason: "Only 3 common cells met the correction-input checks, below the reference policy. Line-of-sight displacement stays empty.",
    witness: { kind: "record", label: "GSI multi-mission analysis (external)", note: "Credited, not our result" },
    quality: [{ k: "STATUS", v: "Partial", why: "Coherence available, no phase reference." }, { k: "PAIR", v: "21 Jul → 14 Aug", why: "The interval brackets the 28 Jul earthquake." }, { k: "DISPLACEMENT", v: "Empty", why: "Atmosphere, ionosphere and reference not corrected." }],
    plainLimit: "We can show where the radar signal stayed steady, not how far the ground moved.",
    techLimit: "Phase-equivalent centimetres are a wavelength scale, not deformation. The interval mixes coseismic, postseismic and atmospheric signal.",
    alternatives: ["Atmospheric phase", "Ionosphere", "Unwrapping error"], empties: ["Displacement", "Magnitude", "Probability"],
    sources: [{ label: "GSI · 2026 Kumamoto earthquake analysis", href: "https://www.gsi.go.jp/uchusokuchi/20260728kumamoto-e.html" }, { label: "NISAR L2 GUNW · ASF product guide", href: "https://nisar-docs.asf.alaska.edu/gunw/" }],
    timeline: tl([["2026-07-09", "meas"], ["2026-07-21", "base"], ["2026-08-14", "target"], ["2026-08-26", "meas"], ["2026-09-07", "meas"], ["2026-11-20", "plan"]], { start: "2026-07-01", end: "2026-11-28", onset: ["2026-07-28", "EARTHQUAKE 28 JUL"], optical: [], opticalNote: "InSAR pair · no optical stage" }),
  },
  {
    id: "choco", lens: "insar", hazard: "earthquake", name: "Chocó", place: "Colombia", region: "EARTHQUAKE · 10 AUG 2026", focus: [-76.65, 5.69], when: "Aug 2026", target: null, coherenceOnly: true,
    state: "insufficient", stateLine: "Coherence only. The pair is not ready for displacement, so no ground motion is shown.", band: null, drape: false,
    stat: "0.247", statLine: "median interferometric coherence (0–1) · not_displacement_ready",
    reason: "science_status is not_displacement_ready: coherence is published, displacement stays null.",
    quality: [{ k: "STATUS", v: "Coherence only", why: "not_displacement_ready from the API." }, { k: "COHERENCE", v: "0.247", why: "Median, fixed 0–1 scale. Confirmed by Daniel, 11 Nov." }, { k: "SGC", v: "[Report]", why: "Servicio Geológico Colombiano report." }],
    plainLimit: "We won't show ground motion until the radar corrections are ready.",
    techLimit: "los_displacement_cm stays null; correction-readiness gates unmet.",
    alternatives: [], empties: ["Displacement", "Magnitude", "Casualties"],
    sources: [{ label: "[SGC report · title · date]", href: "https://www.sgc.gov.co" }],
    timeline: null,
  },
];
export const MATAM_TIMELINE = null; // Pass Timeline's built-in default is Matam.
export const DATA_SOURCES = [
  { tag: "NASA · ASF DAAC", name: "NISAR L2 GCOV", what: "Radar backscatter in HH and HV, the base of every lens", href: "https://nisar-docs.asf.alaska.edu/gcov/" },
  { tag: "NASA · ASF DAAC", name: "NISAR L2 GUNW", what: "Interferograms and coherence for earthquakes", href: "https://nisar-docs.asf.alaska.edu/gunw/" },
  { tag: "NASA · JPL", name: "NISAR Observation Plan", what: "Where and when NISAR passes, including planned passes", href: "https://nisar.jpl.nasa.gov/mission/get-to-know-sar/observation-plan/" },
  { tag: "NASA · JPL OPERA", name: "DSWx-HLS and DIST-ALERT", what: "Optical water and vegetation loss, the second witness", href: "https://www.jpl.nasa.gov/go/opera/products/dist-product-suite/" },
  { tag: "SERVICIO GEOLÓGICO COLOMBIANO", name: "SGC event reports", what: "Official facts for the Chocó earthquake", href: "https://www.sgc.gov.co" },
];
