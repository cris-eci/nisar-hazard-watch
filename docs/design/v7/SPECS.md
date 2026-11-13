# SPECS · NISAR Hazard Watch · Design v7 · 0.7.0

Implementation spec for round v7. The `.dc.html` files in this folder are **HTML design references** (high fidelity). Rebuild them in the app's stack (React 19 + Recharts 3 + CesiumJS for the globe). Open any `.dc.html` in a browser to see it running; logic is in the `<script data-dc-script>` block at the bottom of each file.

Product idea: a **radar evidence explorer**, not a hazard detector. Every answer has the same five beats: the question → the measurement → the verdict in plain words → the second witness → what this can't tell you. No forecasts, no probabilities, no causes.

> Decision changes since the brief: the guided tour uses the **Qadirabad (Chenab) flood**, not Chocó, because the earthquake path has no displacement yet (InSAR correction gates fail). Chocó stays as "event context, no measurement". The tour structure below is generic, so it can be re-skinned for Chocó once SGC facts and InSAR data exist. Measured cases are now the four with real figures in NISAR-Modeling: Qadirabad, Chókwè, Richmond and Kumamoto.

---

## 1. Screens

| Screen | File | States |
| --- | --- | --- |
| Landing | `Landing v7.dc.html` | scroll story (three.js planet), compare slider, pipeline, cases carousel, honesty, data sources, mission, close, footer |
| Explorer: nothing selected | `Explorer v7.dc.html` | start card, case markers, live-path hint pill, Nova bubble |
| Explorer: case/point selected | same | left panel (5 facts) + layer dock + bottom Pass Timeline; or processing checklist for a live point |
| Explorer: More information | same | large sheet over the globe (left 440 px globe strip stays visible) |
| Explorer: guided tour (story) | same, `?story=1` | 6 chapters, caption bar, one card per chapter |
| Explorer: quick onboarding | same, Help → "Replay the quick tour" | 4 spotlight steps |
| Bottom timeline | `Pass Timeline.dc.html` | compare (default), single pass, playing |
| Cases | `Cases v7.dc.html` | filter by question, cards, five-hazard icon row |
| Method | `Method v7.dc.html` | hero, satellite teardown, Qadirabad scroll sequence, six steps, band chart ×3 states, lenses, works/fails, Transformer benchmark, experimental models, landslides, colour key |
| About | `About v7.dc.html` | v6 layout, roles updated |
| PDF report | `Report v7.dc.html?case=id` | AI summary block separated from DATA blocks; print to A4 |
| Landslide icon | `icons/landslide.svg` (+ the 5 others) | 24 px stroke icon, marker composition in `icons/marker.svg` |

URL params: `Explorer v7?case={id}` opens a case; `?story=1` starts the tour.

---

## 2. Components and data contracts

All numbers in dB unless stated; dates ISO `YYYY-MM-DD` UTC. `null` means "no measurement" and must render as a gap or grey, never as 0.

### 2.1 Case (`v7-cases.js` → `CASES[]`), later `GET /cases` and `GET /cases/{id}`
```ts
type Case = {
  id: string; lens: LensId; hazard: HazardId;
  name: string; place: string; region: string;          // region = mono kicker, uppercase
  focus: [lon: number, lat: number];                    // WGS84, lon first
  chipKm?: number;                                      // processed square side; 5.12 (40 m pilot) or 10.24 (80 m)
  when: string; target: string | null;                  // target pass date
  state: "departure" | "within" | "insufficient";       // backend observed_departure | within_observed_baseline | insufficient_data
  stateLine: string; reason?: string;                   // reason required when state = insufficient
  stat: string; statLine: string;                       // short headline comparison, e.g. "64.3% vs 1.0%"
  groups?: ContrastGroup[]; matched?: Matched;
  witness?: { kind: "optical" | "map" | "record"; label: string; note: string };
  quality: { k: string; v: string; why: string }[];     // exactly 3 items in the panel
  plainLimit: string; techLimit: string; alternatives: string[]; empties: string[];
  sources: { label: string; href: string }[];
  figure?: string;                                      // full report figure URL
  crops?: { base: string; change: string; optical: string; signature: string }; // layer images, north-up, same bounds as chip
  timeline?: TimelineData | null; pending?: boolean;    // pending = event context only
}
```

### 2.2 Band Chart (`Band Chart.dc.html`), the hero chart
Props: `width`, `height` (viewBox; renders fluid 100%), `mode: "plain"|"technical"`, `variant` (design only), `tipIndex` (pin tooltip), `showSentence`, `sentence`, `emptyWhy`, `demo`.
Data the real component should take:
```ts
type BandPass = { date: string; role: "baseline" | "excluded" | "target" | "measured" | "planned";
  hh_db: number | null; hv_db: number | null };
type BandChartData = {
  passes: BandPass[];
  band: { HH: { median: number; low: number; high: number }; HV: { median: number; low: number; high: number } };
  mad_multiplier: 3; min_half_width_db: 3;              // half-width = max(3, 3·max(1.4826·MAD, 1))
  cells: number; posting_m: number;
  state: "departure" | "within" | "insufficient"; reason?: string;
}
// derived per point: in_band = low ≤ value ≤ high
```
Recharts 3:
- `ComposedChart` with `data = passes`.
- `XAxis type="number" scale="time" dataKey={d => Date.parse(d.date)}` with custom `tick`.
- `YAxis domain={[-29,-4]}` (Technical only; Plain hides it).
- Band: `Area dataKey={d => [band.HH.low, band.HH.high]}` (range area), fill `rgba(232,137,74,0.13)`, plus `ReferenceLine` ×2 dashed `2 3` for its edges. Same for HV with `rgba(111,179,232,0.13)`.
- Baseline period: `ReferenceArea x1=first baseline x2=last baseline`, fill `rgba(235,233,228,0.035)`, label "BASELINE · n PASSES" (Technical).
- Lines: `Line dataKey="hh_db" connectNulls={false}` (gaps stay breaks), stroke `#e8894a` 2 px, solid. `Line dataKey="hv_db"` stroke `#6fb3e8` 2 px, `strokeDasharray="6 4"`.
- `dot` is custom: HH = circle r3.25, HV = square 6.5 px, so channels differ by line **and** marker. Baseline dots are hollow (fill `#08101f`). The target dot is filled r5.5. Out-of-band dots get a white ring (r+3.5, 1.5 px `#ebe9e4`).
- The target pass is **not** joined to the baseline line: the line ends at the last baseline and the target is a lone dot, because the onset pass is `excluded` (null).
- Target: `ReferenceLine x=target` stroke `#c9b48b` 1.25 px, label "TARGET" (gold is UI only).
- `Tooltip content={GlassTooltip}`: date on top (mono 11 px uppercase), phase line, then per channel a line sample, name and value in mono. Technical adds "+x.x dB vs median · band ±3". `cursor` = vertical 1 px `rgba(235,233,228,0.35)`.
- No `CartesianGrid` in Plain; in Technical horizontal hairlines `rgba(235,233,228,0.07)` at −25…−5 dB only.
- Legend is custom (not Recharts `Legend`): HH, HV and Normal range; Technical adds "Outside range".
Sizes: panel 324×108 (Plain, no sentence); sheet 640×240; Method 540×240/150; report 640×220.

### 2.3 Contrast Bars (`Contrast Bars.dc.html`)
```ts
type ContrastGroup = { title: string; sub?: string;
  rows: { label: string; k: number; n: number; color: string; ci?: [number, number] }[] };   // pct = k/n
```
Props: `groups`, `mode`, `compact` (panel: first group only, no counts in Plain), `empty`, `emptyWhy`, `max` (axis %, **default and recommended 100**), `note`.
**Axis rule:** shares of a group always use a fixed 0–100% axis, or one shared axis for every chart on the page. Never auto-scale: a 17.8% detection rate must not fill the bar and read as success next to 87.5%.
Recharts 3: `BarChart layout="vertical"`, `XAxis type="number" domain={[0,max]} hide={plain}`, `YAxis type="category" dataKey="label"` with custom tick (swatch + label), `Bar dataKey="pct" radius={3}` with a `Cell` per row colour, `background={{ fill: "rgba(235,233,228,0.06)" }}`, `ErrorBar dataKey="ci"` when `ci` exists (Technical only), and `LabelList` on the right for pct (mono) and "k / n" (mono 11 px muted). The tooltip is a glass card showing "64.3% · 332 of 516 cells". Bar heights: 14 px full, 10 px compact.
Matched-pairs whisker (sheet + Method): a single horizontal `ErrorBar`, or plain SVG. Point `#0072b2` with a 2 px white ring, interval caps 1.5 px `#ebe9e4`, zero tick white.

### 2.4 Pass Timeline (`Pass Timeline.dc.html`), the bottom bar (merges PR #1)
```ts
type TimelineData = { passes: [date: string, kind: "base"|"target"|"meas"|"plan", outsidePct?: number][];
  optical?: [date: string, label: string][]; onset?: [date: string, label: string] | null;
  start: string; end: string; today: string; opticalNote?: string; demo?: boolean };
```
- **Measured:** 8 px filled `#d4d2cc` dot.
- **Compared:** baseline passes are 10 px hollow with a 2 px gold ring, under a gold bracket labelled "BASELINE · n PASSES". The target is a 13 px gold-filled dot with a double ring and the label "TARGET".
- **Planned:** 11 px dashed outline `#a9a69e`, after the TODAY line. The axis is dashed after today, with the label "PLANNED". A planned pass is not clickable and is never data.
- **Optical lane:** 8 px rotated-square outlines.
- **Onset/event:** dashed vertical line with a mono label.
- **Tiny bars:** 6 px wide, max 20 px high, showing the % of cells outside the range on non-baseline passes. Baseline passes show a 1 px stub. Use CSS/SVG, not Recharts.
Controls: play/pause (steps through measured passes every 900 ms), "Baseline ↔ Target" toggle (`aria-pressed`), readout line plus a mono sub-line, and a DEMO DATES chip while dates are spaced.

### 2.5 Metrics Chart (`Metrics Chart.dc.html`), Method only
`models: { name, sub, impl?, href, tests: { label, tag, warn?, v: [precision, recall, f1, iou] (each number | null) }[] }[]`. Each model can show several tests side by side (held-out vs development) so nothing is cherry-picked.
- Plain shows F1, or precision and recall when no F1 is reported. Technical shows all four.
- A missing metric is drawn as a dashed empty track with "—", never 0.
- Every model has an EXPERIMENTAL badge. A `warn` test gets a dashed amber tag ("REUSED DEV DATA").
- Fixed 0–1 axis for every row. Bars tell the metric apart by shade and pattern.
- Recharts: one `BarChart layout="vertical"` per test, `XAxis domain={[0,1]}`.
- Values are **REAL**, from the NISAR-Models model cards (§7).

### 2.6 Layer drape (Cesium)
- `SingleTileImageryProvider` over the chip rectangle.
- Rectangle = focus ± `chipKm/2` (km → degrees via 111.32 and cos(lat)).
- Layers come from `crops` (real) or the API: `change-HH` and `base` are real; `HV` and `HH−HV` are illustrative.
- Opacity slider sets `layer.alpha`.
- Outline: 3 px gold polyline. While processing it's a 2.5 px gold dash (dashLength 12) with the label "PROCESSING RADAR FOR THIS AREA…".
- Hover on land shows a ~240 km NISAR frame preview: 1.5 px `#e2e8f0` at 85% alpha, fill at 6%.

### 2.7 Other components
- **Verdict glyphs:** departure = 12 px gold square rotated 45°; within = 12 px circle with a 2 px `#ebe9e4` ring; insufficient = 12 px circle with a 1.5 px dashed `#a9a69e` ring.
- **Provenance chip:** REAL = transparent with a `rgba(235,233,228,.35)` border; DEMO = `rgba(245,158,11,.18)` fill with `#fcd34d` text; TO FILL = dashed border. Mono 9.5 px. The tooltip shows the source. Toggle: Help → "Show REAL labels". It hides **only REAL chips**. DEMO and TO FILL chips are always visible, including in the video, so judges can see which numbers are demo.
- **Quality strip:** 3 cells. Each has a mono 9.5 px key and a 12.5 px value; `title` holds the explanation.

---

## 3. States and copy

| State | Where | Copy |
| --- | --- | --- |
| Loading (live job) | panel | "PROCESSING RADAR · STEP n OF 6". Steps: "Finding NISAR passes over this point" · "Choosing one radar series" · "Reading up to 6 passes" · "Building this spot's normal range" · "Comparing the target pass" · "Looking for optical water" (vegetation lenses: "Looking for optical vegetation loss"). Footer: "We read real radar for this exact spot, so it takes about a minute. You can keep exploring." The globe shows the gold dashed outline. |
| Partial | quality strip | Status "Partial" with a why, e.g. "Cloud gaps: 22.8% joint optical support." It is a normal state, not an error, so it uses no red. |
| Insufficient | panel + chart | Verdict "Not enough radar yet" + `reason`. Chart overlay: "Not enough radar yet" / "No usable pixels on 3 of 5 dates. We tried one alternative series; it had the same gap." Richmond: "No new-water group was resolved on the 13.2% of cells with usable optical views. That doesn't mean no flood happened." |
| Optical withheld | contrast bars | "No comparison published" / "Fewer than 25% of radar cells had clear optical views on both dates, so we withheld the comparison." |
| Error + retry (to build) | panel | Title "We couldn't reach the radar archive" · body "The NASA archive didn't answer. Nothing is wrong with this place." · buttons "Try again" (re-POST) and "Pick a measured case". Map HTTP 502/504 to this; 503 queue full → "Lots of people are asking right now. Try again in a minute." |
| Empty | explorer | Start card: "What did the radar see?" + case list + "Click any land to ask the radar · LIVE · ABOUT A MINUTE". |
| No WebGL | explorer | Top pill "3D GLOBE UNAVAILABLE IN THIS BROWSER · PANELS STILL WORK" over a static ESRI image. |
| Pending case | Chocó | "No measurement yet. We're waiting on InSAR corrections before showing anything." |
| Nova no-data | chat | Dashed card "NO DATA": "I don't have impact figures. Radar measures how the ground's echo changed, not what happened to people or buildings…" |

---

## 4. Interactions

- **Globe:** hover over a marker shows a tooltip like "QADIRABAD · MEASURED CASE · DID IT FLOOD?". Hover over land shows the frame preview and coordinates with "NISAR FRAME ~240 KM · CLICK TO ASK THE RADAR". Clicking a marker opens the case: the camera flies 1.8 s with quadratic in-out so the chip sits in the free area. Clicking land starts a live job. The globe auto-rotates (−0.0005 rad/tick) until the first interaction.
- **Top bar:** Guided tour | Explore switch, Cases, Method, then the icons Whole globe (closes selection, flies home), Help (menu), Download (menu) and Full screen.
- **Panel:** lens chips (`aria-pressed`). Choosing another lens on a case re-runs as a live point with that lens. The collapse button sends the panel to a 38 px edge tab (vertical label); ✕ closes. "More information" opens the sheet.
- **Layer dock:** Change | Baseline (or Backscatter), then HH | HV (| HH−HV), then opacity 0–100.
- **Sheet:** Plain/Technical toggle. The compare tile is drag-to-split (pointer events, `clip-path: inset(0 0 0 x%)`). Esc closes. While it's open the globe camera shifts so the chip stays in the left 440 px strip.
- **Plain vs Technical:**
  - Charts: Technical adds dB axes, date ticks, the baseline label, Δ vs median in the tooltip, cell counts, CI whiskers, the band formula and the backend state string.
  - Limits: Plain shows one sentence; Technical adds `techLimit`.
  - Nova: changes its answer style.
- **Keyboard:** Esc closes, in priority order: onboarding → story → menus → Nova → sheet → selection. In the story, ← and → change chapter. Tab order follows the visual order. All icon buttons have `aria-label`.
- **Scroll (Landing):** GSAP ScrollTrigger plus Lenis, kept exactly from v5.
  - 520 vh pinned story: clouds fade, then "Radar brings its own light" with the camera pulling back, the 12-day counter and orbit ring, and finally the camera flies to Qadirabad with a callout.
  - The compare slider auto-sweeps from 92 to 50 the first time it's seen.
  - Pipeline bar scrubs; the cases carousel scrolls horizontally (300 vh); the mission image has parallax; reveals are y 28 → 0, 0.9 s power3.out, stagger 0.08.
- **Scroll (Method):**
  - Satellite Teardown is embedded (720 vh).
  - Qadirabad sequence: a 520 vh section with a 100 vh sticky stage. Five frames crossfade on scrub (0.5): text opacity plus y ±24, image opacity plus scale 1.03 → 1, and progress dots fill.
  - Six-step bar scrubs.
  - Charts reveal with `clip-path: inset(0 100% 0 0) → inset(0 0 0 0)`, 1.4 s power2.inOut, once, at top 82%.
- **Cases:** cards rise (y 32, 0.8 s power3.out, stagger by column) when scrolled into view, and re-run when the filter changes.
- **Reduced motion:** no Lenis, no auto-rotate, no reveals, camera flights take 0 s.
- **Mobile (390 px), next round:** proposed layout.
  - The panel becomes a bottom sheet with 3 snap points: peek 120 px (verdict only), half, full.
  - The layer dock becomes an icon button that opens a popover.
  - The timeline collapses to a pill (play + date) above the sheet.
  - Nova opens full-screen.
  - "More information" becomes a full page.
  - The story card stacks above the caption bar, and the caption bar shrinks to 2 lines with a "more" link.
  - Hit targets are at least 44 px.

---

## 5. Guided tour (story mode): spec per chapter

Shell, always on:
- **Caption bar:** bottom-centre, `min(820px, 100vw − 32px)`, glass, radius 24. It holds 6 progress segments (4 px, clickable), the Nova glyph, the mono count "CHAPTER n OF 6 · CHENAB FLOOD, PAKISTAN", and the caption text (17 px, `aria-live="polite"`). Controls: Exit story · voice toggle · Back · Play/Pause · Next ("Explore" on the last chapter).
- **Captions:** always on. Voice is optional (Web Speech `en-US`, rate 1). Changing chapter cancels the current speech. Mute keeps captions.
- **Play:** auto-advances every 9 s and stops at chapter 6.
- **Card:** one card per chapter, top-right (`right 24, top 76, bottom 196`, width ≤ 440), vertically centred and scrollable. The globe stays visible behind it. A dark gradient covers only the bottom 45% so the captions stay legible.
- **Skip/exit:** Esc, "Exit story", or the Explore tab.
- **Transitions:** the camera flies 2.2 s (region) or 1.8 s (chip), and the card swaps instantly (fade is fine).

| # | Camera | Card (slot) | Caption |
| --- | --- | --- | --- |
| 1 What happened | region view, lon 73.5 lat 31.5, 2,600 km altitude | Facts table: River "Chenab, Punjab, Pakistan" · Bulletins "PMD / FFD · 22–24 Jul 2026" · Surveyed flood map "None supplied" · **TO FILL**: areas affected, people affected (official only). Note: "Facts come from the PMD/FFD bulletin…" | "In late July 2026 Pakistan's flood forecasting service issued bulletins for the Chenab river in Punjab." |
| 2 Where | fly to chip, gold outline | Facts: Point 32.329° N, 73.713° E · 128 × 128 analysis cells · NISAR repeat every 12 days · 3 passes before 22 Jul | "This is Qadirabad. NISAR passes over every 12 days…" |
| 3 What the radar saw | chip + change drape | Two tiles: baseline median HH, change 26 Jul, with a diverging ramp | "Radar brings its own light. Calm water bounces it away… This is the real change map from our science team." |
| 4 Second witness | same | Radar change and OPERA optical tiles + Contrast Bars (3 rows) | "Where the optical satellite saw new water, the radar had flagged 64% of cells. On dry land, 1%. But it also flagged 17% of water that was already there…" |
| 5 On the ground | same | Photo carousel (image slot, ‹ ›, credit line **TO FILL**) + "IN THE NEWS" list of 3 × [Headline] [Outlet · date] **TO FILL** | "Every photo and article here is credited and linked to its source." |
| 6 What NISAR adds | chip | Body + gold CTA "Explore it yourself", which drops into the explorer with Qadirabad open | "NISAR measures how the ground's echo changed, through clouds and at night, and shows where the rule gets fooled. Now explore it yourself." |

Chocó version: same shell and chapter slots. Chapter 1 takes SGC facts (magnitude, depth, time) as **TO FILL**. Chapter 3 shows coherence plus "no displacement yet". Chapters 4 and 5 keep their slots.

---

## 6. Tokens

**Surfaces/ink:** bg `#04070e` · deep `#060c18` / `#07101f` · glass `rgba(8,16,31,0.78–0.97)` + `backdrop-filter: blur(16–24px)` + border `1px rgba(235,233,228,0.10–0.14)` · inset fill `rgba(235,233,228,0.04)` · ink `#ebe9e4` · ink-2 `#d4d2cc` / `#c4c1ba` · muted `#a9a69e` · faint `#8d8a83` · fainter `#6f6c66`.
**Accent (UI only):** gold `#c9b48b`, hover `#dccaa3`, text on gold `#16120a`. Primary button: `#ebe9e4` background with `#04070e` text, hover `#fff`.
**Data scales (never in chrome):**
- Signed dB change: −8 `#2f6db5` → 0 `#f2f0eb` → +8 `#c2473a` (linear, symmetric).
- Backscatter (mock): −27 dB `#0c0c0c` → −4 dB `#f5f5f5`. The report baseline uses viridis −30…0 dB: `#440154,#3b528b,#21918c,#5ec962,#fde725`.
- HH − HV: 2 dB `#1f8a80` → 7 `#f2f0eb` → 12 dB `#7b4fae`.
- Wrapped phase (earthquakes): cyclic `#3b3f8f → #b0507a → #e8b04a → #5fae9a → #3b3f8f`, 0…2π, with no white centre.
- Optical classes (OPERA legend, Okabe–Ito): new water `#0072b2` · stable water `#56b4e9` · stable non-water `#a8997a` · water loss `#e69f00` · mixed `#cc79a7` · unsupported `#62666d`.
- No measurement: `#62666d` (hatch `#54585f`). It is never white.
- Channels: HH `#e8894a` (solid line, circle markers); HV `#6fb3e8` (dash 6 4, square markers).
- Inside/outside a perimeter: `#cc79a7` / `#a9a69e`.
- DEMO chip: `rgba(245,158,11,.18)` / `#fcd34d`.
**Type:**
- Albert Sans 300/400/500/600; JetBrains Mono 400/500 for numbers, dates, units and kickers.
- Display: clamp(40, 5.4vw, 76) with −0.045em tracking. H2: clamp(30, 3.4vw, 48) with −0.04em. Card title 20–24 px with −0.025em. Body 15–17 px, line-height 1.5. Small 12–13.5 px.
- Mono kicker: 10.5–12 px, letter-spacing 0.06–0.08em, uppercase.
**Spacing:** 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 22 · 24 · 28 · 32 · 48 px. Page gutters clamp(20px, 4vw, 48px), max width 1200. Explorer overlay inset 16 px; panel width 360, dock 256, timeline ≤ 680, Nova 380 × 540.
**Radii:** pill 999 · cards 20–24 · sheet 28 · tiles 8–10 · chips 999 · bars 2–3.
**Shadows:** sheet `-30px 0 80px rgba(0,0,0,.45)` · popover `0 8px 24px rgba(0,0,0,.45)` · Nova `0 20px 60px rgba(0,0,0,.5)`.
**Motion:**
- UI toggles: 200 ms.
- Spotlight: 380 ms `cubic-bezier(.65,0,.35,1)`.
- Camera flights: 1.6–2.4 s quadratic in-out; intro 2.4 s quartic out.
- Reveals: 0.8–0.9 s power3.out.
- Chart draw: 1.4 s power2.inOut.
- Pulse (running step): 1 s ease-in-out infinite.
- Timeline play: 900 ms per pass. Story auto-advance: 9 s.

---

## 7. Copy and number provenance

All visible strings live in the `.dc.html` templates and in `v7-cases.js`, which holds every case string. Numbers:

| Number | Status | Source (Ch0comilo/NISAR-Modeling) |
| --- | --- | --- |
| Qadirabad: 332/516 new water (64.3%), 748/4,393 existing water (17.0%), 38/3,866 dry (1.0%), proxy precision 29.7% / recall 64.3% / IoU 25.5% (multi-date baseline median = the only headline), matched −4.93 dB [−5.63, −3.88], 463 pairs, 7,609 mixed, optical 17 Jul → 2 Aug, target 26 Jul | REAL | `docs/results/flood_pilot_summary.json`, `docs/FLOOD_CHARACTERIZATION.md` |
| Chókwè: 164/440 (37.3%), 20/2,881 (0.7%), matched −4.34 dB [−5.08, −3.47], 382 pairs, 22.8% joint optical, target 17 Jan 2026, optical 7 → 22 Jan, beta product | REAL | same |
| Richmond: 0 new-water cells, 8/5,249 dry flagged (0.15%), 13.2% joint optical, 40,390 supported cells, target 16 Aug, optical 22 Jul → 21 Aug | REAL | same |
| Kumamoto: 3 eligible of 1,614 coherent cells, pair 21 Jul → 14 Aug, quake 28 Jul, displacement null | REAL | `TEAM_HANDOFF.md`, `README.md` |
| Method cards: Matam 17.8% / 1.1%; Barh 87.5% / 32.6%; Sköllersta +1.78 dB; Timber HH −1.34 [−3.17, +0.08], HV +0.17 [−0.29, +1.06]; Transformer RMSE 1.600 / 1.178 / 1.211 and 3.637 / 3.007 / 2.254 dB | REAL | `FLOOD_EVIDENCE.md`, `EXPLORATION_HOLDOUT.md`, `docs/results/model_benchmark_all_dates.json` |
| Band formula: median ± max(3, 3·max(1.4826·MAD, 1)) dB | REAL | `FLOOD_EVIDENCE.md` → Comparison |
| Point HH/HV series, the band chart values, timeline dates (12-day spacing) and "% outside range" bars | DEMO | — |
| Qadirabad sensitivity check: last-baseline comparator 90.4% / 45.5% | REAL, Technical only | FLOOD_CHARACTERIZATION.md. Label it "Sensitivity check: comparator changes the result a lot". Dani added it after seeing results; it is **not** an alternative score |
| Water model: unseen Lake Red Rock, Iowa: P 98.6%, R 80.9%, F1 0.89, IoU 0.80; development P 58.1%, R 71.1% (F1/IoU not reported) | REAL | NISAR-Models `nisar-water/model-card-spatial-v2.md` |
| Tree cover (hybrid CNN v2): Brittany P 99.7% R 94.3% F1 96.9%; Chiang Mai P 100% R 94.4% F1 97.1% | REAL | `nisar-forest/docs/spatial-forest-v2-model-card.md` |
| Tree-cover disturbance v2: P 90.2% R 97.4% F1 93.7% IoU 88.1%, **development data · no independent test yet** | REAL (dev only) | `nisar-land-change/docs/MODELO_TEMPORAL_CPU_V2.md` |
| Chocó facts, story photos/news, chapter 1 areas/people | TO FILL | SGC, PMD/FFD, press |

Full per-element table: `DATA_PROVENANCE.md`.

---

## 8. Open questions for the data scientist (Daniel)

1. **Exact points and bounds** for Chókwè and Richmond. We used approximate points (Chókwè 32.99, −24.52; Richmond −84.89, 39.83). We also need each chip's CRS/bounds so the drape lines up. Are the crops north-up, covering exactly the 128 × 128 grid?
2. **Chip size:** pilot cases are 40 m × 128 = 5.12 km and the lens API uses 80 m × 128 = 10.24 km. Confirm both.
3. **Real pass dates** per case (baseline, target, later assessments), plus the Observation Plan's next planned passes.
4. **Per-pass point values** for the band chart: which field (`observed_groups` medians, or the clicked pixel's `observations`)? Do we draw the area median or the pixel?
5. **Layer endpoint:** can the API serve PNG/COG tiles for `change_db` HH/HV, the baseline median, `reference_groups` and the signature mask, with the colour maps above applied server-side? Or should the client colour them?
6. **Which comparator** to headline: the multi-date baseline median (current) or last-baseline? Today we show the median and mention the other in Technical.
7. **"% of cells outside range"** per pass for the timeline bars: is it available, or should we drop the bars?
8. **Experimental models:** IoU for tree cover, F1/IoU for the water development set, and when an independent test of the disturbance model is planned.
9. **Chocó:** is there a GUNW pair that brackets 10 Aug 2026? Can `insar-readiness` run so we can at least show coherence?
10. **Landslide case:** is there any event with passes before and after, and a visible slope, worth a measured card?
11. **Kumamoto drape:** which coherence layer and colour map should we use instead of the interferometry figure?
12. Can the frontend legally show `qadirabad/chokwe/richmond` report PNGs publicly? They come from the repo, so the licence and credit line are needed.

Team questions:
- Roles for Andersson, David and Katheryn.
- The Space Apps 5-member limit (the team is 6).
- Real or simulated live point queries for the demo.
