# Hazard analysis API (draft contract)

How the globe asks the data pipeline (NISAC_Data_Lab) for a change analysis of one hazard, and
what it expects back. The contract is multi-hazard by design; **wildfire** is the only hazard for
the hackathon. The front end already speaks this contract: it runs on demo data until
`VITE_ANALYSIS_API_URL` points at a real service.

**Status:** draft for the team to agree on. TypeScript source of truth:
`src/features/analysis/analysis.types.ts`. Change both together.

## Request

```http
GET {VITE_ANALYSIS_API_URL}/frames/{track}-{frame}/analysis?hazard=wildfire&before=YYYY-MM-DD&after=YYYY-MM-DD
```

| Param             | Example                    | Notes                                                                                                |
| ----------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `hazard`          | `wildfire`                 | Which change to analyse. Unknown hazards should return `400`                                         |
| `track`, `frame`  | `47`, `3`                  | NISAR frame, same IDs as ASF and the notebook's `(pista, frame)` groups                              |
| `before`, `after` | `2026-10-03`, `2026-10-15` | Two passes of the same frame. The UI only sends **HH+HV (DH) passes**, because burn mapping needs HV |

The front end picks the pair: the two most recent HH+HV passes from NASA's Observation Plan.

## Response `200 OK`

```jsonc
{
  "hazard": "wildfire",
  "track": 47,
  "frame": 3,
  "pass": "A", // "A" ascending | "D" descending
  "before": { "date": "2026-10-03", "granuleId": "NISAR_L2_PR_GCOV_..." },
  "after": { "date": "2026-10-15", "granuleId": "NISAR_L2_PR_GCOV_..." },
  "method": {
    "polarization": "HVHV",
    "changeThresholdDb": -2, // log-ratio at or below this counts as affected
    "multilook": 2,
    "pixelSizeM": 40,
  },
  "affectedAreaHa": 69961, // burned area for wildfire
  "meanChangeDb": -5.9, // mean log-ratio inside the affected area
  "severityHa": { "low": 14963, "moderate": 18721, "high": 36277 },
  "layers": {
    "bounds": [-74.6, 3.4, -73.5, 4.5], // [west, south, east, north] in degrees (EPSG:4326)
    "beforeUrl": "https://.../before_hv.png",
    "afterUrl": "https://.../after_hv.png",
    "severityUrl": "https://.../severity.png",
  },
  "generatedAt": "2026-10-21T22:10:00Z",
  "isDemo": false,
}
```

Errors: any non-2xx status. The UI shows "The burn analysis failed: …" with a retry button.
A JSON body `{ "message": "..." }` is welcome but not required yet.

## Wildfire: how each field maps to the notebook (`util/nisac_ts.py`)

| Field                          | Where it comes from                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `before` / `after` granules    | `catalogo_online` + `filtrar_grupo` for `(track, direction, frame)`, keeping `pol == "DHDH"` scenes     |
| HV stack                       | `construir_pila(..., pols=("HVHV",), multilook=2)` on the analysis area                                 |
| change per pixel               | `log_ratio(pila, "HVHV", before, after)` (dB)                                                           |
| burned pixels                  | `clasificar_cambio(lr, umbral_db=2.0) == -1`, so `changeThresholdDb` = `-2`                             |
| severity classes               | log-ratio bands: low `(-4, -2]`, moderate `(-6, -4]`, high `≤ -6` dB (a proposal: tune with real fires) |
| `affectedAreaHa`, `severityHa` | pixel count × pixel area (`pixelSizeM`² / 10,000)                                                       |
| `meanChangeDb`                 | mean of `lr` over burned pixels                                                                         |
| `layers.*`                     | PNGs rendered from the stack and the classes, reprojected to EPSG:4326 over `bounds`                    |

## PNG layers

- **Projection:** EPSG:4326 (plain lon/lat), north up, covering exactly `layers.bounds`. The globe
  stretches each image over that rectangle, so a UTM image would be slightly distorted.
- **`beforeUrl` / `afterUrl`:** γ⁰ of the hazard's polarization (HV for wildfire) in dB, grayscale, stretched from −22 dB (black) to −4 dB
  (white). Same stretch for both, so the two dates can be compared.
- **`severityUrl`:** RGBA, transparent where unaffected, in the hazard's colours (wildfire: low
  `#facc15`, moderate `#f97316`, high `#dc2626`).
- **CORS:** the API and the PNG URLs must allow the front end's origin.
- About 256–1024 px per side is plenty. Data URLs (`data:image/png;base64,...`) also work.

## Adding a hazard (e.g. floods)

1. **Pipeline:** accept `hazard=flood` and return the same response shape. Floods would use HH
   (open water turns dark) with its own threshold.
2. **Front end:** add `"flood"` to `HazardId` and an entry to `HAZARDS` in
   `src/features/analysis/hazards.ts` (label, polarization, colours, legend copy, demo).
3. **Enable it:** `VITE_ENABLED_HAZARDS=wildfire,flood`. The hazard picker appears automatically
   when more than one is enabled.

## Open questions for the team

1. **Analysis area:** the whole frame (~240 km, slow) or a fixed area at its centre? The demo uses a
   120 km square. This is the "square size" test from the Oct 19 meeting.
2. **Sync or async:** if processing takes minutes, switch to `POST` returning a job ID, plus polling.
   The UI already has a loading state, so only `analysisApi.ts` would change.
3. **Severity thresholds:** check them against a known fire (e.g. a NASA FIRMS perimeter).
