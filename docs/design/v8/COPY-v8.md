# COPY v8 (states v2): every visible string

English UI. Use these strings verbatim. `{x}` = value from the API; never invent text around it. Mono = JetBrains Mono, uppercase as written.

## Top bar
- Wordmark: `NISAR Hazard Watch`
- Search placeholder: `Search a place or paste coordinates` (mobile: `Search a place`)
- Search result sub-lines: `{lat}° N, {lon}° E · live analysis` / `Known case · {hazard} · {Mon YYYY}`; tags `1–4 MIN`, `INSTANT`
- Direction: `Ascending` `Descending` (mobile `Asc` `Desc`)
- Mode: `Guided tour` `Explore` · Links: `Cases` `Method`
- Icon buttons (aria/title): `Whole globe`, `Help`, `Download`, `Full screen`

## 1 · Find a place
- Kicker: `KNOWN CASES · OPEN INSTANTLY`
- Title: `What did the radar see?`
- Body: `Start with a measured case, or search a place and click any land to read its NISAR passes live.`
- Case rows: `{Name}, {Country}` / `{Hazard} · {Mon YYYY}` + `INSTANT`; Chocó: `Coherence only · Aug 2026`
- Hint: `Click any land to analyze a 10 km spot live. It reads up to 5 recent passes and takes 1–4 minutes.`
- Button: `Watch the 1-minute story`
- Globe aria: `Globe. Click any land to analyze a spot.`

## 1 · Known case (coherence)
- Kicker: `KNOWN CASE · {REGION} · {HAZARD} {DD MON YYYY}`
- Chip: `Interferometric coherence` + `REAL`
- Stat: `{median}` `median coherence, 0–1`
- Body: `Between {date1} and {date2}, a {n}-day pair that brackets the {event}. Low values mean the echo changed between the two passes.`
- Scale: `0 · CHANGED` `MEDIAN {x}` `1 · ALIKE`
- Quality: `PAIR {n} days` · `GRID {posting}` · `DISPLACEMENT Not shown`
- Footer: `No lens for ground motion. Coherence is not displacement, so no centimetres are shown.`

## 2 · Pick a spot
- Kicker: `NEW SPOT · LIVE ANALYSIS`
- Cards: `AREA` `{km} km square` `{posting} grid · {cells} cells` · `EXPECTED WAIT` `1–4 min` `plus any queue`
- Catalog: `IN THE CATALOG · {DIRECTION}` `LAST 5 MONTHS` + date chips `{D Mon}`
- Note: `Only dates NISAR actually measured. The {n}-day gap after {date} is real.` (only when a gap > 24 days exists)
- Primary: `Analyze this spot` · Secondary: `Open a known case instead · instant`
- No data: kicker `CLICKED POINT · NO COVERAGE`, title `No NISAR data here`, body `The catalog has no compatible passes at this point. Over open ocean NISAR data isn't analyzed here.`, card `Nearest known case · about {km} km`, button `Pick another spot`

## 3 · Wait
- Kicker: `LIVE ANALYSIS · {PLACE}` · Title: `Reading NISAR passes for this spot`
- Timer side note: `usually 1–4 min` / `plus any queue` · Axis `0 1 MIN 2 3 4 MIN 5`
- Queue: `#{n}` `One analysis is ahead of yours. Yours starts as soon as it ends.`
- Steps and done-lines:
  - `Searching the catalog` → `{n} passes found · {Direction} · {D Mon} → {D Mon}`
  - `Reading passes` → `{k} of {n} read` (running: `{k} of {n} read · each appears on the timeline`)
  - `Measuring change` → `Target minus baseline median`
  - `Drawing layers` → `HH, HV and change`
  - pending: `waiting`; current: `in progress`
- Did you know: `DID YOU KNOW? · {i} OF {n}` + the 5 facts in `v8-data.js FACTS` (title + text verbatim)
- Button: `Cancel analysis`
- Compact (lens running): `Running the {lens} lens` · `{m:ss} elapsed · on the {n} passes already read`

## 4 · Raw observations
- Kicker: `RAW RADAR · {DD MON YYYY} · PASS {k} OF {n}` + `REAL DATES`
- Thumbs: `HH` `−30…0 dB` · `HV` `−30…0 dB` · `Change` `target − median`
- Legends: HH `HH on {date}, fixed −30 to 0 dB gray.` · HV `HV on {date}, same fixed gray as HH so both read alike.` · Change `Target minus baseline median, signed dB, HH.` (`−8 darker` `0` `+8 brighter`) · Rule `Cells where HH ≤ −3 dB and HV ≤ −1.5 dB against their own baseline.` (`Meets rule` `Doesn't`) · Coherence `Interferometric coherence, fixed 0–1, cividis. Not displacement.`
- Dock: `RADAR ON THE GLOBE`, `HH backscatter` `HV backscatter` `Change` `Flood rule cells`, `Coherence` `NO PAIR`, `Land cover` `TO FILL`, `Grey: no measurement`, `Opacity`
- Lens block: `LOOK THROUGH A LENS`, `Or ask`, footer `Ground motion has no lens. Where an interferometric pair exists, coherence (0–1) appears as a raw layer.`
- Timeline: `{Date} · {target|baseline} · pass {k} of {n}` / `{DIRECTION} · {D MON} – {D MON YYYY} · ONLY MEASURED DATES`, bracket `BASELINE · {n} PASSES`, `TODAY`; while waiting `Passes arriving · {k} of {n} read` / `Each pass appears here as soon as it is read`
- Play: aria `Play the {n} passes` / `Pause time-lapse`; stamp `{DD MON YYYY}` + `PASS {k} OF {n} · BASELINE|TARGET`
- Footprint label: `ANALYSIS AREA · {km} km · {posting} GRID` (mobile `{km} km · {posting}`)

## 5 · Lenses
| id | Label | Question | Rule line |
| --- | --- | --- | --- |
| flood_wetland | Flood & wetland | Did water appear here? | HH ≤ −3 dB and HV ≤ −1.5 dB vs this spot's baseline |
| vegetation_disturbance | Vegetation disturbance | Was vegetation lost? | Radar change where optical shows loss, against matched cells |
| wildfire | Wildfire | Did the fire spread? | HV below its baseline band on two or more passes |
| agriculture | Agriculture | Did this field change differently from its neighbours? | A 60 m patch against matched cells 120–300 m away |

## 6 · Lens result
- Verdicts: `Departure observed` · `Within its usual range` · `Not enough data`
- Flood headline template: `{No new water | New water} at the exact spot you clicked. Around it, {fraction} of the area darkened the way calm new water does.`
- Rule block: `WHERE THE FLOOD RULE IS MET`, `{N} of {M} cells`, toggle `On the globe` / `Show on globe`, caption `Dark navy cells: HH fell 3 dB or more and HV 1.5 dB or more on {date}, against each cell's own median of {n} earlier passes. Another {k} cells brightened. Cells meeting a rule, not flooded area.`
- Pixel: `AT THE PIXEL YOU CLICKED`, Δ cards `HH` / `HV` `{±x.x} dB` `band ±{x} dB · inside|outside`
- Why two (`WHY TWO`):
  - flood: `HH mostly bounces off surfaces; HV comes from echoes scattered inside leaves and branches. Calm water mirrors the pulse away, so it darkens both. That is why the rule asks for both.`
  - vegetation: `HV comes mostly from leaves and branches. When trees are cleared HV drops more than HH, so the lens watches HV first.`
  - wildfire: `Burning removes the canopy that scatters HV. A drop in HV that stays low on later passes is the radar trace of a burn scar.`
  - agriculture: `Crops change through the season in both channels. Comparing a field with its neighbours on the same dates separates one field's change from the season's.`
- Optical: `SECOND WITNESS · OPERA OPTICAL`, status `PENDING` `READY · REAL` `UNAVAILABLE`; ready lead `Optical images agree: {N} in 10 cells that turned to water also meet the radar rule. Cells that stayed dry almost never do.` (if < 5 in 10: `Optical images partly agree: {N} in 10 cells that turned to water also meet the radar rule.`); pending `Looking for optical snapshots within 4 days of {d1} and {d2}. The radar result doesn't wait for it.`; unavailable `No OPERA snapshot with enough clear cells within 4 days of the radar dates. The radar result stands on its own.`; whisker caption `New-water cells minus matched dry cells, {n} pairs · 95% spatial interval`; point `At your pixel's optical cell: {state in words}.`
- Surroundings: `THIS SPOT VS ITS SURROUNDINGS`; insufficient `The 60 m patch holds {n} cell on this {posting} grid; the comparison needs {k}.`
- Button: `More information`

## 6.5 · Possible drivers (Barh, flood)
- `POSSIBLE DRIVERS` · `HYPOTHESIS · NOT A RESULT` · `What could make the echo change like this, weighed against the evidence above.`
- `River flooding in the monsoon` · `FITS BEST` · FOR `Optical shows 2,702 cells turned to open water between 26 Jul and 13 Sep; 91% of them meet the radar rule. Barh sits on the Ganges and the window covers the monsoon.` · AGAINST `No river-gauge or flood-bulletin record was checked.`
- `Water that was already there` · `PARTLY` · FOR `506 cells were water on both optical dates (river channel, ponds).` · AGAINST `Only 232 of them meet the rule, and they changed less than the new-water cells.`
- `Wet soil or crops after rain` · `WEAK` · FOR `Rain in the window can darken fields.` · AGAINST `Of 1,226 cells that stayed dry in the optical images, 1 meets the rule.`
- Footer: `A river gauge, rain record or field report would settle it. Not checked here: wind on water, look angle, speckle, terrain shadow.`

## 7 · More information
- Kicker `{PLACE} · {LENS} · {lat}, {lon} · {n} PASSES, {D MON} – {D MON YYYY}` · Title `What the radar measured at {place}`
- Tabs `Summary` `More detail` · switch `Plain` `Technical`
- Summary: `01 · THE QUESTION` (`WHERE` `WHEN` `QUESTION`), `02 · THE MEASUREMENT`, slider labels `BASELINE MEDIAN · {n} PASSES` `TARGET · {D MON}`, caption `Drag to compare HH before and after, both on the same fixed −30 to 0 dB gray.`, tiles `Change HH` `Change HV` `Flood rule cells` `Optical groups`, `03 · IN PLAIN WORDS`
- Right column: `HOW THIS WAS COMPUTED` (`Finding NISAR passes over this point` / `catalog · compatible series`; `Choosing one radar series` / `same track, frame, polarizations`; `Reading {n} passes` / `GCOV · HH and HV · {posting}`; `Building this spot's normal range` / `median ± MAD of {n} earlier passes`; `Comparing the target pass` / `signed dB, common cells`; `Looking for optical water` / `OPERA DSWx · within 4 days`), `EVIDENCE AND QUALITY`, `SOURCES`
- More detail: `01 · CHANNEL HISTORIES`, `02 · POLARIZATION BALANCE · HV − HH`, `03 · SPATIAL STRUCTURE · PATCHES` (`TO FILL`), `04 · HISTORICAL BEHAVIOUR`, GP `Model fit (GP) unavailable: needs 6 passes, this spot has {n}.`

## 8 · Errors
Verbatim from `v8-data.js ERRORS` (category, title, body, primary, secondary). Reset time computed from 00:00 UTC as `{h} h {m} min`.

## Chips
`REAL` · `REAL DATES` · `DEMO DATA` · `DEMO DATES` · `TO FILL` · `PENDING` · `UNAVAILABLE` · `EXPERIMENTAL` · `HYPOTHESIS · NOT A RESULT` · `INSTANT`

## Never
A flood probability, flooded hectares, a cause stated as fact, "disaster", "alert", centimetres from coherence.
