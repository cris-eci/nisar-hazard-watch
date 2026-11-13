// v8 shared content: the live-analysis example, lenses, waiting facts and error categories.
// The live example is the Barh flood-lens fixture (NISAR-Modeling daniel/examples/flood-lens-evaluation-barh.json),
// presented as a spot the user clicked. Its numbers are REAL. Raster tiles on the globe are Chókwè layers
// standing in until a Barh job publishes its own PNGs, so they carry a DEMO chip.
const RU = (p) => (p && typeof window !== "undefined" && window.__resources && window.__resources[p.replace(/[^a-z0-9]/gi, "_")]) || p;
export const VERSION = "Design v8 · 0.8.0";

export const LENSES = [
  { id: "flood_wetland", label: "Flood & wetland", q: "Did water appear here?", icon: "flood", rule: "HH ≤ −3 dB and HV ≤ −1.5 dB vs this spot's baseline", optical: "OPERA DSWx-HLS" },
  { id: "vegetation_disturbance", label: "Vegetation disturbance", q: "Was vegetation lost?", icon: "deforestation", rule: "Radar change where optical shows loss, against matched cells", optical: "OPERA DIST-ALERT-HLS" },
  { id: "wildfire", label: "Wildfire", q: "Did the fire spread?", icon: "wildfire", rule: "HV below its baseline band on two or more passes", optical: "OPERA DIST-ALERT-HLS" },
  { id: "agriculture", label: "Agriculture", q: "Did this field change differently from its neighbours?", icon: "agriculture", rule: "A 60 m patch against matched cells 120–300 m away", optical: null },
];

export const KNOWN = [
  { id: "qadirabad", name: "Qadirabad", country: "Pakistan", lon: 73.713, lat: 32.329, icon: "flood", meta: "Flood · Jul 2026" },
  { id: "chokwe", name: "Chókwè", country: "Mozambique", lon: 32.99, lat: -24.52, icon: "flood", meta: "Flood · Jan 2026" },
  { id: "richmond", name: "Richmond", country: "USA", lon: -84.89, lat: 39.83, icon: "flood", meta: "Flood · Aug 2026" },
  { id: "kumamoto", name: "Kumamoto", country: "Japan", lon: 130.65, lat: 32.65, icon: "earthquake", meta: "Coherence · Jul 2026" },
  { id: "choco", name: "Chocó", country: "Colombia", lon: -76.65, lat: 5.69, icon: "earthquake", meta: "Coherence only · Aug 2026", dashed: true },
];

export const LIVE = {
  name: "Barh", place: "Bihar, India", region: "BIHAR · GANGES", lon: 85.70, lat: 25.49, coords: "25.49° N, 85.70° E",
  dir: "Ascending", km: 10.24, posting: "80 m", cells: 16384,
  window: ["2026-06-12", "2026-11-11"],
  passes: [
    { d: "2026-06-20", role: "base" }, { d: "2026-07-02", role: "base" }, { d: "2026-07-14", role: "base" },
    { d: "2026-07-26", role: "base" }, { d: "2026-09-12", role: "target" },
  ],
  planned: "2026-11-23",
  point: {
    HH: [-18.33, -16.85, -18.11, -17.49, -16.34], HV: [-23.36, -23.15, -23.67, -23.23, -23.37],
    median: { HH: -17.8, HV: -23.29 }, mad: { HH: 0.62, HV: 0.16 }, change: { HH: 1.46, HV: -0.07 },
    crossMinusCo: -1.38, bracket: ["2026-07-26", "2026-09-12"],
  },
  signatures: { dual: [5513, 16384], bright: [960, 16384] },
  quantiles: { HH: [-4.89, -0.12, 1.18], HV: [-2.75, -0.57, 0.27] },
  surroundings: { status: "insufficient_data", focal: 1, around: 36, need: 5 },
  optical: {
    pre: { d: "2026-07-26", sat: "Landsat 8" }, post: { d: "2026-09-13", sat: "Sentinel-2B" }, pointState: "insufficient_data",
    groups: [
      { label: "New open water", k: 2468, n: 2702, color: "#0072b2" },
      { label: "Water on both dates", k: 232, n: 506, color: "#56b4e9" },
      { label: "Stayed dry", k: 1, n: 1226, color: "#a8997a" },
      { label: "Mixed or partial", k: 299, n: 995, color: "#cc79a7" },
    ],
    matched: { n: 171, HH: [-8.39, -9.1, -7.58], HV: [-5.55, -6.2, -4.78] },
  },
  layers: {
    hh: RU("docs/layers/chokwe-target_hh.png"), hv: RU("docs/layers/chokwe-baseline_median_hh.png"),
    change: RU("docs/layers/chokwe-change_db_hh.png"), changeHv: RU("docs/layers/chokwe-change_db_hv.png"),
    rule: RU("docs/layers/chokwe-signature_mask.png"), optical: RU("docs/layers/chokwe-reference_groups.png"),
  },
};

export const FACTS = [
  { img: RU("public/landing/radar-north-dakota.jpg"), title: "Radar sees through clouds", text: "NISAR sends its own microwave pulses and listens for the echo, so it measures day or night, through cloud and smoke." },
  { img: RU("public/landing/nisar-concept.jpg"), title: "A 24 cm wave", text: "NISAR's L-band radar uses a wavelength of about 24 cm. It passes leaves and reaches branches, trunks and the ground below." },
  { img: RU("docs/layers/qadirabad-change_db_hh.png"), title: "Calm water looks dark", text: "Smooth water reflects the pulse away from the satellite like a mirror, so new water shows up as a drop in the echo.", pixel: true },
  { img: RU("docs/layers/chokwe-target_hh.png"), title: "Every 12 days", text: "NISAR repeats the same orbit every 12 days, so a place builds its own history of echoes to compare against.", pixel: true },
  { img: RU("docs/layers/kumamoto-coherence.png"), title: "Coherence, 0 to 1", text: "Coherence says how alike two echoes from the same spot are. Near 1 the ground looked the same; near 0 something changed.", pixel: true },
];

export const STEPS = [
  { label: "Searching the catalog", done: "5 passes found · Ascending" },
  { label: "Reading passes", done: "5 of 5 read" },
  { label: "Measuring change", done: "Target minus baseline median" },
  { label: "Drawing layers", done: "HH, HV and change" },
];

// Backend-agnostic categories. Any backend (Modal, Railway) maps its responses onto these.
export const ERRORS = [
  { id: "quota_low", cat: "Quota · few left", tone: "info", title: "3 live analyses left today", body: "The app shares 12 live analyses a day across everyone. Known cases and repeat spots don't use one.", primary: "Analyze this spot", secondary: "Open a known case" },
  { id: "quota_out", cat: "Quota · used up", tone: "block", title: "Today's live analyses are used up", body: "All 12 for the app are taken. They reset at 00:00 UTC, in 6 h 12 min. Known cases open instantly and don't count.", primary: "Open a known case", secondary: null, cases: true },
  { id: "queue_full", cat: "Queue full", tone: "wait", title: "Two analyses are already in line", body: "One runs at a time and one can wait. Try again in a few minutes.", primary: "Try again", secondary: "Open a known case" },
  { id: "timeout", cat: "Time ran out", tone: "error", title: "The analysis ran out of time", body: "Reading the passes took longer than the server allows (about 4 minutes). Try again, or open a known case.", primary: "Try again", secondary: "Open a known case" },
  { id: "restarted", cat: "Server down or restarted", tone: "error", title: "The server restarted and lost this job", body: "It's back up. Running the same spot again starts a new job.", primary: "Run it again", secondary: null },
  { id: "no_data", cat: "No data", tone: "empty", title: "NISAR has no usable pass here yet", body: "The catalog lists passes, but none had valid pixels at this point. Try the other pass direction or a known case.", primary: "Try Descending", secondary: "Open a known case" },
  { id: "partial", cat: "Partial result", tone: "warn", title: "3 of 5 passes arrived", body: "Two passes couldn't be read. Lenses that need a 3-pass baseline may say Not enough data.", primary: "Show what arrived", secondary: "Try again" },
];

export const fd = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const fds = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
