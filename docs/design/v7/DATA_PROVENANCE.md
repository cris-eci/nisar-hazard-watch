# Data provenance · Design v7 · 0.7.0

What is real and what is demo on each v7 screen, and what replaces the demo. In the Explorer, each item carries a REAL / DEMO / TO FILL chip; hover the chip to see its source. Help → "Show REAL labels" hides only the REAL chips; DEMO and TO FILL always stay visible.

| Screen · element | State | Source today | Replace with |
| --- | --- | --- | --- |
| Explorer · case markers and coordinates | REAL (Chókwè and Richmond approximate) | NISAR-Modeling configs/examples, report axes | exact points from Dani |
| Explorer · verdict per case | REAL | flood_pilot_summary.json `status`, `interpretation_status` | `GET /cases/{id}` |
| Explorer · verdict for a clicked point | DEMO | simulated in `openPoint()` | `POST /v1/explore` → `lens.state` |
| Explorer · processing checklist | DEMO timing, REAL steps | EXPLORE_API.md | job polling `GET /v1/jobs/{id}` |
| Band chart (HH/HV series, band) | DEMO | fixed series in Band Chart.dc.html | `observations` per pass at the pixel + baseline median/MAD |
| Contrast bars (cell counts, %) | REAL | flood_pilot_summary.json `proxy_comparison`, `group_counts` | same fields from the API |
| Matched-pairs whisker | REAL | `matched_controls.co_pol_contrast` | same |
| Quality strip | REAL for cases, DEMO for points | report status, dates, coverage | job `status`, `series_attempts`, optical coverage |
| Drape on globe · Change HH, Baseline | REAL (report crop) | docs/cases/{id}-change.png, -base.png | API layer endpoint per case/channel |
| Drape · HV, HH−HV | DEMO texture | v7-gfx.js | API layer endpoint |
| Sheet tiles · base, signature, change, optical | REAL (report crops) | docs/cases/*.png | API layers |
| Sheet tile · HH−HV | DEMO | v7-gfx.js | API |
| Full report figure in the sheet | REAL | docs/images/{id}_flood_evidence.png | keep as "report" link |
| Pass Timeline dates | DEMO DATES (12-day spacing) | v7-cases.js `timeline` | real acquisition dates + Observation Plan for planned |
| Timeline "% outside range" bars | DEMO | v7-cases.js | per-pass departure share from the job |
| Nova answers | DEMO (rule-based) | `answer()` in Explorer | LLM with citations to the case sources |
| Story ch.1 facts | REAL + TO FILL | PMD/FFD bulletin link | copy areas/people only from the bulletin |
| Story ch.5 photos and news | TO FILL | image slots | credited photos, outlet · date · link |
| Method · experimental model metrics | REAL (disturbance on development data only) | NISAR-Models model cards | — |
| Method · works/fails cards, Transformer benchmark | REAL | FLOOD_EVIDENCE.md, EXPLORATION_HOLDOUT.md, model_benchmark_all_dates.json | — |
| Method · Qadirabad scroll sequence | REAL (report crops) | docs/cases/qadirabad-*.png | API layers |
| Chocó | TO FILL | — | SGC report, frame from the Observation Plan, InSAR when corrections pass |
| Kumamoto | REAL (coherence only) | TEAM_HANDOFF.md, interferometry.png | GUNW pair layers |
