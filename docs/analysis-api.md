# Hazard analysis API (draft contract)

How the globe asks the data pipeline (NISAC_Data_Lab) for a change analysis of one hazard, and
what it expects back. The contract is multi-hazard by design, with two families:

- **Surface change** (`kind: "change"`): wildfire, flood, deforestation. Compares backscatter of two
  GCOV scenes and reports an affected area in hectares.
- **Ground motion** (`kind: "deformation"`): earthquake. Reads a GUNW interferogram and reports
  line-of-sight displacement in centimetres.

Wildfire is the validated core; earthquake is the second showcase family. The front end already speaks this contract: it runs on demo data until
`VITE_ANALYSIS_API_URL` points at a real service.

**Status:** draft for the team to agree on. TypeScript source of truth:
`src/features/analysis/analysis.types.ts`. Change both together.

## Request

```http
GET {VITE_ANALYSIS_API_URL}/frames/{track}-{frame}/analysis?hazard=wildfire&before=YYYY-MM-DD&after=YYYY-MM-DD[&lon=..&lat=..]
```

| Param                   | Example                    | Notes                                                                                                |
| ----------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `hazard`                | `wildfire`                 | Which change to analyse. Unknown hazards should return `400`                                         |
| `lon`, `lat` (optional) | `-67.221`, `10.595`        | Centre of interest, e.g. an epicentre. Without it, centre on the frame                               |
| `track`, `frame`        | `47`, `3`                  | NISAR frame, same IDs as ASF and the notebook's `(pista, frame)` groups                              |
| `before`, `after`       | `2026-10-03`, `2026-10-15` | Two passes of the same frame. The UI only sends **HH+HV (DH) passes**, because burn mapping needs HV |

The front end picks the pair: the two most recent HH+HV passes from NASA's Observation Plan.

## Response `200 OK`: surface change (`kind: "change"`)

```jsonc
{
  "kind": "change",
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

## Response `200 OK`: ground motion (`kind: "deformation"`)

```jsonc
{
  "kind": "deformation",
  "hazard": "earthquake",
  "track": 162,
  "frame": 7,
  "pass": "A",
  // A GUNW is one product for the pair, so both point at the same granule.
  "before": { "date": "2026-06-13", "granuleId": "NISAR_L2_PR_GUNW_..." },
  "after": { "date": "2026-06-25", "granuleId": "NISAR_L2_PR_GUNW_..." },
  "method": {
    "product": "GUNW",
    "wavelengthCm": 23.84,
    "ionosphereCorrected": true,
    "pixelSizeM": 80,
  },
  "maxTowardCm": 31.3, // peak line-of-sight motion toward the satellite
  "maxAwayCm": 19.0, // peak motion away from it (positive number)
  "deformedAreaKm2": 3384, // area that moved more than deformedThresholdCm
  "deformedThresholdCm": 2,
  "layers": {
    "bounds": [-68.1, 10.0, -67.0, 11.1],
    "displacementUrl": "https://.../los_cm.png", // diverging blue (away) → white → red (toward)
    "fringesUrl": "https://.../fringes.png", // wrapped phase, one hue cycle per λ/2 = 11.92 cm
    "colorScaleCm": 35, // the displacement PNG spans ±colorScaleCm
  },
  "generatedAt": "2026-10-21T22:10:00Z",
  "isDemo": false,
}
```

How to compute it from the GUNW HDF5 (paths to confirm with `h5py` on a real file):

| Field                       | Source                                                                    |
| --------------------------- | ------------------------------------------------------------------------- |
| LOS displacement (cm)       | `unwrappedPhase` (after the ionosphere layer is removed) × −λ / 4π × 100  |
| mask                        | `coherenceMagnitude` below ~0.3 and `connectedComponents` = 0 are dropped |
| `maxTowardCm` / `maxAwayCm` | max / −min of the masked displacement                                     |
| `deformedAreaKm2`           | pixels with abs(displacement) > 2 cm × pixel area                         |
| `fringesUrl`                | displacement wrapped every λ/2, mapped to a hue wheel                     |

Real coseismic pairs found on ASF (2026-10-21): Venezuela M7.5 (track 162 A frame 7,
2026-06-13 → 06-25), Kumamoto M6.8 (track 24 A frame 18, 07-21 → 08-14; also descending track 3
frame 72), Panama M7.7 (track 76 A frame 5, 10-05 → 10-17; also descending track 40 frame 85).

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

## Adding a hazard

1. **Pipeline:** accept the new `hazard` value and return the response of its family (`change` or
   `deformation`). A new family (e.g. volcanic thermal) needs a new `kind` in the contract.
2. **Front end:** add the id to `HazardId` and an entry to `HAZARDS` in
   `src/features/analysis/hazards.ts` (label, polarization, colours, legend copy, demo).
3. **Enable it:** add it to `VITE_ENABLED_HAZARDS` (`.env` for every build, `.env.local` for your
   machine). The hazard picker appears automatically when more than one is enabled.

## Open questions for the team

1. **Analysis area:** the whole frame (~240 km, slow) or a fixed area at its centre? The demo uses a
   120 km square. This is the "square size" test from the Oct 19 meeting.
2. **Sync or async:** if processing takes minutes, switch to `POST` returning a job ID, plus polling.
   The UI already has a loading state, so only `analysisApi.ts` would change.
3. **Severity thresholds:** check them against a known fire (e.g. a NASA FIRMS perimeter).
