# DATA PROVENANCE v8 (states v2)

What each value in the design is, and what replaces it in the build. Chips in the UI must match this table.

| Element | In the design | Status | Source / replacement in the build |
| --- | --- | --- | --- |
| Known cases (Chókwè, Qadirabad, Richmond, Kumamoto) | Names, points, dates, layers | REAL | `GET /v2/cases`, `/v2/cases/{id}` |
| Chocó | Coherence 0.247, not_displacement_ready | REAL | Frontend `cases.ts` until it is in `/v2/cases` (issue 6) |
| Kumamoto coherence | PNG, median 0.384, 10-bin histogram, 21 Jul → 14 Aug 2026 | REAL | `/v2/cases/kumamoto` |
| Barh live spot: dates, point HH/HV dB, medians, MAD, change | 5 passes 20 Jun – 12 Sep 2026 | REAL | `flood-lens-evaluation-barh.json` → live `GET /v2/jobs/{id}` |
| Barh rule counts | 5,513 / 16,384 dual darkening; 960 brightening | REAL | job `grid_signatures` |
| Barh optical groups and intervals | 2,468/2,702 · 232/506 · 1/1,226 · 299/995; 171 matched pairs | REAL | job `water_comparison` |
| Barh surroundings | insufficient: 1 focal cell, needs 5 | REAL | job `surrounding_comparison` |
| HV − HH balance | per pass, target Δ −1.4 dB | REAL | computed from the job point series |
| Raster tiles on the Barh footprint and in More information | Chókwè layers | DEMO DATA | job `layers[]` PNGs (`target_*`, `baseline_median_*`, `change_db_*`, `flood_signature_flags`, optical groups) |
| Time-lapse frames | crossfade baseline ↔ target | DEMO DATA | per-pass `obs_hh/hv_{date}.png` (issue 1) |
| Vegetation, wildfire, agriculture result cards | layout examples | DEMO DATA | `POST /v2/jobs` with `lens` |
| Second search hit (Barahiya) | example | DEMO DATA | geocoder (open question 4) |
| Waiting steps, queue position | simulated timing | DEMO DATA | job `stage`, `queue_position`, `passes_read` (issue 2) |
| Quota counts and reset | "3 left", "6 h 12 min" | DEMO DATA | `/v2/capabilities` (issue 10) |
| Possible drivers (Barh) | 3 drivers, fit tags | HYPOTHESIS | built from REAL `water_comparison` fields; land cover + rainfall later (issue 3) |
| Land cover layer | dock row | TO FILL | `land_cover` layer (issue 4) |
| Feature Lab patches | 3 slots | TO FILL | `feature_lab.spatial.patches` (issue 9) |
| Feature Lab GP | unavailable | REAL (status) | needs ≥ 6 passes |
| "Did you know?" facts | 5 texts + images | Editorial | `v8-data.js FACTS`; images from `public/landing` and case layers |
| Basemap | Esri World Imagery | External | live Esri tiles in the app (the design bundles three static crops only for publishing) |

Rules
- A chip is removed only when its replacement ships. DEMO DATA never hides.
- HYPOTHESIS is permanent: drivers are always interpretation.
