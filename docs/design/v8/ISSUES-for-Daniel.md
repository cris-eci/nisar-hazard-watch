# Issues for NISAR-Modeling (from design v8 states v2)

Drafts to open in github.com/Ch0comilo/NISAR-Modeling. Each one names the UI element that depends on it. Design reference: `Explorer v8 States v2.dc.html` (frame ids in brackets).

---

## 1. Per-pass display layers in the job manifest (time-lapse) [4d]
The Explorer plays the measured passes as a time-lapse on the globe. It needs one display PNG per date and polarization, not only `target_*` and `baseline_median_*`.
- Ask: `layers[]` entries `obs_hh_YYYY-MM-DD.png` / `obs_hv_…` with bounds, on the fixed −30…0 dB gray stretch, for every used date.
- Nice to have: each layer published as soon as its pass is read, so the timeline and globe fill in progressively during the wait [3a].

## 2. Progress fields on `GET /v2/jobs/{id}` [3a, 3c]
The waiting panel shows honest steps and a queue position.
- Ask: `queue_position` (0 when running); `stage` ∈ {catalog, reading, measuring, layers}; `passes_read` and `passes_total`; `estimated_seconds` if the worker can give it.
- If any field can't be provided, say so and the UI will show fewer steps.

## 3. Evidence for "Possible drivers" (hypothesis, not result) [6a]
The Space Apps brief asks teams to hypothesize physical drivers. The UI shows them as a labelled hypothesis, each with for/against evidence taken only from returned fields.
- Today we use `water_comparison.groups` (new / stable water / stable dry).
- Ask: optional context fields that let the UI weigh drivers without inventing them:
  - land-cover fractions over the chip (e.g. ESA WorldCover 10 m: cropland, tree cover, built-up, water);
  - accumulated rainfall over the bracket (e.g. IMERG), with source and dates.
- No cause or probability fields; `causal_attribution` stays null.

## 4. Land-cover context layer [4a dock, "Land cover · TO FILL"]
- Ask: a categorical `land_cover` layer (PNG + legend + source + year) on the job grid, so users can read radar change against what is on the ground.

## 5. A Colombian live case
The team is Colombian and the brief invites a "hometown" story. Chocó is coherence-only (0.247, `not_displacement_ready`).
- Ask: check GCOV coverage and run the flood/wetland lens at one Colombian site with a documented 2026 event. Candidates: La Mojana (Sucre/Bolívar), Ciénaga Grande de Santa Marta, Bogotá wetlands, Guaviare deforestation front (vegetation lens).
- Deliver as a precomputed case under `/v2/cases` so it opens instantly.

## 6. Chocó in `/v2/cases`
- Ask: add `choco` with its coherence PNG (cividis, 0–1), bounds, pair dates and the median 0.247, like `kumamoto`. The Cases card already shows it as "Coherence only".

## 7. Live grid vs fixture grid [2a, 6a]
The live explore chip is a 64-pixel native window; the Barh fixture is 128 × 128 at 80 m.
- Ask: confirm the grid a live job returns (shape, posting) so the footprint and every "N of M analysis cells" denominator come from the job, not from a constant.

## 8. Does a lens run count against the daily quota? [5a]
- Ask: confirm whether `lens` on an already-cached observation is a cache hit or a new job. If it counts, the UI shows the quota line on lens buttons too.

## 9. Feature Lab deployment [7b]
- Ask: deploy the Feature Lab branch, or confirm it stays out of the demo. Until then the "More detail" tab shows spatial patches as TO FILL and GP as unavailable (needs 6 passes; live jobs return at most 5).

## 10. Quota numbers in `/v2/capabilities` [8a]
- Ask: expose `jobs_remaining_app`, `jobs_remaining_ip` and `resets_at_utc`, so the UI can show "3 left today" and the reset time without guessing.
