# SPECS v8 (states v2): delta on v7, Explorer only

**Build target: v2** (`Explorer v8 States v2.dc.html`). The team chose the didactic version. v1 stays in the project for reference only.

v8 adds live analysis and lenses to the Explorer. Everything not listed here stays exactly as in `design_handoff_v7/SPECS.md`: tokens, type, glass cards, band chart, contrast bars, pass timeline, provenance chips, Nova, guided story, downloads. Landing, Cases and Method stay at v7. The one exception is the Chocó card in Cases, now marked "Coherence only".

Design files (in `reference/`): `Explorer v8 v2.dc.html` (all states; a DESIGN STATE picker sits bottom-left when opened on its own), `Explorer v8 States v2.dc.html` (every state at 1440 × 900 and 390 × 844), `Lens Result v2.dc.html`, `Waiting Panel.dc.html`, `Error States.dc.html`, `Band Chart.dc.html`, `Contrast Bars.dc.html`, shared content in `v8-data.js` and `v7-cases.js`. They are design references, not code to copy: rebuild them as React components in `src/`.

Companion files: `COPY-v8.md` (every visible string), `DATA_PROVENANCE-v8.md` (what is real, demo or to fill, and what replaces it), `ISSUES-for-Daniel.md`, `brand/` (Meridian icon).

## 1. What changed from v7

| Area | v7 | v8 |
| --- | --- | --- |
| Top bar | Wordmark, case context, mode switch, links, icons | Adds the **place search** (340 px) and an **Ascending / Descending** switch after the wordmark. The case context pill is dropped. Cases and Method links hide below 1120 px; the mode switch hides below 1280 px. |
| Start card | 4 cases + Chocó dashed | Same card titled "Known cases · open instantly", each row tagged INSTANT, plus a hint that any land can be analyzed live (1–4 min). |
| Questions | 5 question chips, incl. "Did the ground move?" | **4 lens buttons** in a 2 × 2 grid. The questions sit under them as "Or ask" links that pick a lens. No earthquake lens. |
| Ground motion | InSAR lens | Coherence (0–1, cividis) is a **raw layer** only where a GUNW pair exists. In the dock, a "Coherence · No pair" row otherwise. Never cm. |
| HH / HV scale | Viridis for baseline | **Fixed −30 to 0 dB gray everywhere**, known cases included (Daniel's API.md). Change stays the signed diverging −8…+8 dB. |
| Timeline | DEMO DATES, 12-day spacing | **Real dates from the job**, up to 5, unevenly spaced. The DEMO DATES chip goes; a REAL DATES chip shows instead. Passes not read yet are dashed rings. |
| Panel width | 360–372 px | 372 px; **400 px** on the lens result. |
| Reading order | Numbers first | **Sentence → image → numbers → technical** in every result (§6). |
| Causes | Never shown | **Possible drivers**, always labelled HYPOTHESIS · NOT A RESULT (§6.5). |
| Motion | Static | Globe spin, time-lapse, staggered result entrance, count-up (§9). |
| Nova | Explorer only | Bubble on every screen, bottom-right (§10). |
| More information | v7 sheet | v7 sheet restored with two tabs: **Summary** and **More detail** (Feature Lab) (§7). |
| Icon | Placeholder globe | **Meridian** (§11). |
| Mobile | Deferred | Bottom sheet for steps 2–6 and 8; search and Asc/Desc on top; layer pills (HH, HV, Δ dB, Rule) under the search on steps 4–6; compact timeline above the sheet. |

## 2. Screens and the data each needs

API references are to NISAR-Modeling `API.md` (v2) and `EXPLORATION_LENSES.md`.

### 1 · Find a place (`find`, `case`)
- Globe with known-case markers. Data: `GET /v2/cases` → id, title, point, measured dates. Chocó has no `/v2/cases` entry yet, so it comes from the frontend's `cases.ts` with `science_status: not_displacement_ready`.
- Search: any geocoder; results that hit a known case show INSTANT, others "1–4 MIN". Coordinates pasted as `lat, lon` resolve directly.
- Known case opens instantly (Kumamoto shown): coherence PNG on its `layers[].bounds`, median coherence, the 10-bin histogram (`common_spatial_support_coherence_histogram`), pair dates, grid posting. "Displacement · Not shown" whenever `los_displacement_cm` is null.

### 2 · Pick a spot (`spot`, `nodata`)
- Click → `GET /v2/coverage?longitude&latitude&start_date&end_date&product=GCOV` (free, no quota). Default window: the last 5 months.
- Panel: place name (reverse geocode or the search hit), coordinates, the area (from the job grid: shape × posting), expected wait "1–4 min plus any queue", and the **measured dates** in the chosen direction as chips. Primary: **Analyze this spot**. Secondary: open a known case.
- Footprint: dashed gold square on the globe, sized from the grid.
- No coverage: "No NISAR data here", the nearest known case with its distance (great-circle from the click), "Pick another spot".

### 3 · Wait (`wait`) → `Waiting Panel.dc.html`
- `POST /v2/jobs` → 202 + job_id; poll `GET /v2/jobs/{id}` after 3 s with back-off.
- Timer: elapsed mm:ss in mono, plus a 0–5 min bar with the 1–4 min band shaded. Never a countdown.
- Steps: Searching the catalog → Reading passes (k of n) → Measuring change → Drawing layers. Each takes its done-line when the job reports it. If the backend reports only queued or running, show the first two steps and leave the rest waiting.
- Queue: "#1 · One analysis is ahead of yours" when the job is queued behind another.
- Passes appear on the timeline (and their tile on the globe, 35% opacity) as soon as each is read.
- "Did you know?": 5 fixed facts with images (`v8-data.js FACTS`); arrows plus an auto-advance every 7 s; dots show the position.
- Cancel analysis → back to step 2.

### 4 · Raw observations (`raw`)
- Thumbnails: HH, HV (gray −30…0 dB) and Change (target minus baseline median, diverging) for the selected pass. Layer IDs: `target_hh`, `target_hv`, `baseline_median_hh/hv`, `change_db_hh/hv`.
- Timeline scrubs between the measured passes; the selected pass gets a white ring and its date goes in the title.
- **Time-lapse (Play ▶)**, white 38 px button at the left of the timeline head (desktop only; mobile uses the compact strip without it):
  - Starts at pass 1 (or the current pass if not at the end), advances every **1.1 s**, stops on the target pass. Pause keeps the current pass.
  - The globe layer crossfades **700 ms ease** between passes. A date stamp under the footprint shows the date in mono 30 px (20 px mobile) and "PASS k OF n · BASELINE | TARGET" (target in gold).
  - Needs one display PNG per date and polarization (issue 1). Until then, crossfade between `baseline_median_*` (all baseline passes) and `target_*` (target pass) and keep the DEMO DATA chip.
  - Any manual pass pick, lens pick or screen change stops playback. Under `prefers-reduced-motion`, swap instantly with no crossfade.
- Dock adds a **Land cover · TO FILL** row (disabled) until the backend serves it (issue 4).
- Dock: HH / HV / Change, Coherence row (disabled without a pair), legend, opacity, DEMO DATA chip while tiles are samples.

### 5 · Choose a lens (`lensrun`)
- Lens buttons: Flood & wetland, Vegetation disturbance, Wildfire, Agriculture (`flood_wetland`, `vegetation_disturbance`, `wildfire`, `agriculture`). A question link picks its lens.
- Running: the selected button turns gold and a compact waiting row appears under the grid ("Running the … lens", elapsed, cancel). The other lenses stay usable.

### 6 · Lens result (`result`) → `Lens Result v2.dc.html`
Reading order is binding: **one plain sentence → one image → numbers with their source → technical**. General public stops at the sentence and the image; judges and scientists scroll on. Panel 400 px. Order of the card (flood shown with the REAL Barh fixture):
1. **Header**: lens icon, "LENS · NAME", the question (15 px, secondary), **verdict chip** (v7 glyphs) + provenance chip, then the **headline sentence** (18 px / 500). For Not enough data, a dashed list of `reasons` under the headline.
   - The headline is built from fields, never free text from a model: verdict at the clicked pixel + share of cells meeting the rule. Template for flood: "{No new water | New water} at the exact spot you clicked. Around it, {fraction in words} of the area darkened the way calm new water does." Fractions in words: under 10% "a few cells", 10–20% "about a tenth", 20–40% "a third" (or "a quarter" at 20–30%), 40–60% "about half", over 60% "most". Other lenses use their `OTHER[...].line` in `Lens Result v2`.
2. **Where the rule is met**: 112 px thumbnail of the `flood_signature_flags` layer beside "N of M cells" (26 px mono) on a 0–100% bar and an "On the globe" toggle. Caption with the rule written out, the co-pol brightening count and "Cells meeting a rule, not flooded area." Never hectares.
3. **At the pixel you clicked**: band chart from `point.series` at real dates + HH/HV Δ cards, then the **Why two** note (blue tint): "HH mostly bounces off surfaces; HV comes from echoes scattered inside leaves and branches. Calm water mirrors the pulse away, so it darkens both. That is why the rule asks for both." Per-lens variants in COPY-v8.md.
4. **Second witness · OPERA optical**: PENDING → READY → UNAVAILABLE as before. When READY, a plain sentence leads, built from the groups: "Optical images agree: {k/n of new-water group, as 'N in 10'} cells that turned to water also meet the radar rule. Cells that stayed dry almost never do." Then sensors and dates, Contrast Bars (fixed 0–100%), matched-contrast whiskers, the clicked cell's optical state. Agriculture has no optical section.
5. **This spot vs its surroundings**: compact row, `surrounding_comparison` status and reason.
6. **Possible drivers**: see §6.5.
7. **More information** button → step 7 (Summary tab).
Lens tabs above the card switch lenses; each switch is a new short wait.

### 6.5 · Possible drivers (hypothesis)
The challenge asks teams to "hypothesize the physical drivers". The product rule "never a cause" still holds for **results**; drivers are a separate, labelled interpretation.
- Section kicker "POSSIBLE DRIVERS" + chip **HYPOTHESIS · NOT A RESULT** (gold dashed outline). Intro: "What could make the echo change like this, weighed against the evidence above."
- 2–3 driver cards, each: title, fit tag (FITS BEST · PARTLY · WEAK), a **FOR** line and an **AGAINST** line.
- **Every FOR/AGAINST line must cite a number the API returned** (optical groups, signature counts, dates, later: land cover and rainfall from issue 3). If a driver has no evidence either way, don't show it.
- Fit tag rules (flood): FITS BEST when ≥ 70% of the new-water group meets the rule and ≤ 5% of stayed-dry does; PARTLY when the stable-water group is the main contributor; WEAK when the stayed-dry share meeting the rule is ≤ 1%. Other lenses: define with Daniel before shipping; until then show their driver section only with DEMO DATA.
- Footer: "A river gauge, rain record or field report would settle it. Not checked here: wind on water, look angle, speckle, terrain shadow." (lists the remaining `confounders[]` labelled not checked).
- Never: a probability, a ranking score, "caused by", hectares.
- Driver catalogue per lens lives in `src/features/lenses/drivers.ts` (title + which fields feed FOR/AGAINST). Barh copy in COPY-v8.md.

### 7 · More information (`lab`)
Sheet over the globe (v7 geometry: top 72, right 16, bottom 16, left after the panel). Header: kicker "PLACE · LENS · COORDS · n PASSES, dates", title "What the radar measured at {place}", tabs **Summary | More detail**, Plain/Technical switch (v7 behaviour), close.

**Summary tab** (default; restores v7 "More information"):
- 01 The question: three cards WHERE / WHEN / QUESTION.
- 02 The measurement: before/after **compare slider** (baseline median HH left, target HH right, same −30…0 dB gray, drag handle, keyboard ←/→ 5% steps) + 2 × 2 tiles (Change HH, Change HV, rule cells, optical groups) each with its legend.
- 03 In plain words: the headline sentence at 22 px, plus the optical agreement sentence.
- Right column (300 px): **How this was computed** (6 checked steps from the job), **Evidence and quality** (status, passes, surroundings), **Sources** (NISAR-Modeling, ASF GCOV guide, OPERA DSWx).

**More detail tab** (Feature Lab), EXPERIMENTAL chip while Feature Lab is on a branch:
- 01 Channel histories: band chart, Technical mode (REAL from the job's point series).
- 02 Polarization balance HV − HH per pass with the baseline median (REAL; Barh target Δ −1.4 dB).
- 03 Spatial structure / patches: **TO FILL** slots until `feature_lab.spatial.patches` is deployed.
- 04 Historical behaviour: observation bracket (last baseline → target) drawn as a hatched gap; GP "unavailable: needs 6 passes, this spot has 5".

### 8 · Errors and limits (`error`) → `Error States.dc.html`
Backend-agnostic categories; Modal or Railway map onto them:

| Category | Shown when | Actions |
| --- | --- | --- |
| Quota · few left | remaining app-wide jobs ≤ 3 (read from `/v2/capabilities`) | Analyze this spot · Open a known case |
| Quota · used up | 429 or remaining = 0 (app or IP) | Known-case list (instant). The reset time is computed from 00:00 UTC. |
| Queue full | 503 capacity | Try again · Open a known case |
| Time ran out | deadline / 504 on the job | Try again · Open a known case |
| Server down or restarted | job lost, 5xx, health fails | Run it again |
| No data | succeeded with `science_status: no_data` | Try the other direction · Open a known case |
| Partial result | `science_status: partial` | Show what arrived · Try again |
| Catalog unavailable | 502/504 on coverage | Covered by "Server down" copy with the catalog named |

The quota counter shows **only** at ≤ 3 left or when used up. Cache hits and known cases never count, and the UI says so.

## 9. Motion (GSAP 3.12, already a dependency)
Motion explains, never decorates. All of it is skipped under `prefers-reduced-motion: reduce` (final state shown at once).
| Element | Trigger | Motion |
| --- | --- | --- |
| Globe | Explorer opens on step 1 | Slow spin, 0.35° every 60 ms (~3.5°/s). Stops for good on the first pointer down or any navigation. Render at reduced resolution while spinning. |
| Lens result sections | Result mounts or lens changes | Each `[data-rv]` block: y 16 → 0, opacity 0 → 1, 0.55 s, stagger 0.08 s, power3.out. |
| Verdict glyph | same | scale 0 → 1, 0.5 s, delay 0.15 s, back.out(3). |
| Rule bar + count | same | bar width 0 → value and count 0 → N, 1.1 s, delay 0.3 s, power2.out, count formatted en-US. |
| Time-lapse | Play | see §4. |
| Waiting steps | each stage | current step ring pulses (1.6 s, opacity .45 ↔ 1). |
| Footprint while waiting | job running | border pulses 1.8 s. |
| Optical PENDING chip | status pending | same pulse. |

## 10. Nova
Bubble on every Explorer screen: 56 px (48 px mobile) circle, space fill, 1.5 px gold ring, radar glyph. Desktop bottom-right 16/16; mobile above the sheet (and above the timeline when shown). Opens the v7 Nova panel; Nova explains what is on screen using only the visible fields and never adds causes beyond §6.5.

## 11. Icon
Meridian (`brand/`): solid Earth (ink) with a −25° gold orbit, front arc cut out in negative space, on a #04070e tile. Install per `brand/README.md`: favicon SVG + PNG fallbacks, apple-touch-icon 180, PWA 192/512, transparent mark beside the wordmark in the top bar and the link-preview image.

## 3. Copy and labels (binding)
Full list in `COPY-v8.md`. Key rules:
- Verdicts: "Departure observed", "Within its usual range", "Not enough data".
- "Target minus baseline median"; "% of eligible cells outside the diagnostic band"; "N of M analysis cells".
- Demo chips follow the code: "DEMO DATA", "DEMO DATES". Also "REAL", "REAL DATES", "TO FILL", "PENDING", "UNAVAILABLE", "EXPERIMENTAL".
- Planned passes stay "Planned" until a product appears; never clickable.

## 4. Provenance in these frames
- REAL: every Barh number (dates, point dB, medians, signature counts, optical groups and intervals, surroundings reason, HV − HH), Kumamoto coherence (PNG, median 0.384, histogram), Chocó 0.247.
- DEMO DATA: raster tiles on the Barh footprint (Chókwè layers standing in), the vegetation, wildfire and agriculture result cards, and the second search hit.
- TO FILL: Feature Lab spatial patches, Land cover layer.
- HYPOTHESIS: Possible drivers (interpretation built from REAL fields; chip always visible).
Full table with replacements in `DATA_PROVENANCE-v8.md`.

## 5. Open questions
1. Live chip size: the API reads a 64-pixel native window, while the Barh fixture is 128 × 80 m. The footprint and the "N of M" denominator must come from each job's grid.
2. Does a lens run count as a new job against the 12/day quota? If yes, show the quota line on lens buttons too.
3. Coherence for live spots: only when a GUNW pair exists. Should the dock offer it or hide it?
4. Reverse geocoding provider for the place name (no key in the frontend).
5. Driver fit thresholds for vegetation, wildfire and agriculture (§6.5), with Daniel.
6. Colombian case: site and dates (issue 5).
