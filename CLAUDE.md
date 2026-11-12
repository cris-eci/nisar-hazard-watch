# CLAUDE.md — globe-ui

Web app for the NASA Space Apps 2026 NISAR challenge (team project), design v7: a **radar evidence
explorer**. For a place it answers "did the radar echo change beyond this place's own normal
range?", checks it against a second witness (OPERA optical) and says what the radar can't tell. No
forecasts, probabilities or causes.

Pages (`src/App.tsx` switches on the pathname; no router dependency):

- `/` landing (`src/pages/landing/`), `/cases` (`src/pages/cases/`), `/method`
  (`src/pages/method/`), `/about` (`src/pages/about/`, team data in `src/content/team.ts`).
- `/explore` the CesiumJS explorer (`src/pages/explorer/`). Deep links: `?case=<id>` opens a
  measured case; `?frame=<track-frame>[&lens=<id>]` asks a live question on a point;
  `?bbox=<west,south,east,north>` (east below west crosses ±180°) or `?geo=<lon,lat_lon,lat_…>`
  asks it on a drawn rectangle or polygon; `?story=1` starts the guided story. Legacy `/?frame=`
  links also open the explorer.
- `/report?case=<id>` a printable one-page report for a measured case (`src/pages/report/`).

Design source of truth: `design_handoff_v7/` next to this repo (outside git) (`SPECS.md`, `DATA_PROVENANCE.md`). Visual system:
`DESIGN.md`.

## Stack

React 19 + TypeScript (strict) · Vite · CesiumJS (Esri imagery, no Cesium ion token) · Recharts 3 ·
three.js (landing Earth, method teardown) + GSAP + Lenis (content-page motion) · Tailwind CSS 4 (one-off utilities only) ·
Vitest · Playwright · oxlint · Prettier · Husky + lint-staged + commitlint.

## Commands

```bash
pnpm dev            # http://localhost:5173
pnpm build          # tsc -b && vite build
pnpm preview        # serve dist/
pnpm typecheck      # tsc -b
pnpm lint           # oxlint
pnpm format         # prettier --write .   (format:check in CI)
pnpm test           # unit tests (Vitest)
pnpm test:e2e       # E2E (Playwright, headless, production build)
pnpm test:e2e:ui    # Playwright UI mode
pnpm frames:fetch   # refresh public/data/frames.json from the Observation Plan
```

Before reporting work: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`
plus the E2E spec(s) you touched.

## Searching a place

`src/features/search/`: `PlaceSearch` is a combobox (TopBar popover and a button on the start card)
that calls `GET /api/v1/places?q=` **only when the text is submitted** (Enter or the button):
OpenStreetMap's Nominatim, which the backend proxies, forbids type-ahead autocomplete. Picking a
place shows a `PlaceCard` with its NISAR frame (or "No NISAR frame covers this place"), flies the
camera to its box or to the 10.24 km square (`placeFraming`) and draws that square; "Analyse this
area" asks the radar at the point. The OpenStreetMap credit comes from the API and is always shown.

## Choosing an area

`src/features/geo/` is pure (no Cesium types): longitudes and the antimeridian (`longitude.ts`,
`antimeridian.ts`), the backend's size limits (`limits.ts`, the same numbers as its
`constants/sar.py`), spherical measures (`measure.ts`), the point's contract square (`square.ts`),
GeoJSON/WKT (`serialize.ts`), shared links (`areaLink.ts`) and the drawing tools as a state machine
(`drawMachine.ts`: point, rectangle, polygon; with no tool nothing fires, which is how the guided
tour keeps the globe still). Rings stay continuous (longitudes may pass ±180°) in the app and are
split into a `MultiPolygon` only in `toGeoJson`. `src/features/globe/drawTools.ts` and `GlobeView`
turn pointer events into machine events; `ExplorerPage` owns the state. Sizes: 10 × 10 km ideal
(110 km²), up to 400 km² accepted, above that the UI explains the limit and offers the centred
square. Cesium's own double-click is removed in `createViewer` so it never fights the polygon tool.

## Data

- **Frames:** `public/data/frames.json` is a snapshot of all 16,663 NISAR frames from the NISAR
  Observation Plan ArcGIS FeatureServer (`OBSERVATION_PLAN_QUERY_URL` in
  `src/features/frames/observationPlanApi.ts`), written by `scripts/fetch-frames.ts`. Hover
  hit-testing runs locally on it, so the explorer doesn't depend on the API being up. Short keys
  (`t`, `f`, `p`, `x`, `r`) keep it small.
- **Passes:** `fetchAcquisitions(track, frame)` queries the same FeatureServer live when a live
  question runs (`src/features/live/useLiveJob.ts`). A pass can list several mode codes
  (`148,212,156`); it is HH+HV when any of them is L-band cross-pol. `nextPlannedPass` picks the
  earliest pass strictly after today from unsorted input.
- **Measured cases:** `src/features/cases/cases.ts` (`CASES`, `LENSES`, `OPTICAL`). Every number is
  copied from the science backend's reports (github.com/Ch0comilo/NISAR-Modeling); layer crops and
  report figures are static files in `public/cases/`. Pass timeline dates in `cases.ts` are DEMO
  (12-day spacing) until the backend serves real ones.
- **Demo values:** the band chart series (`src/features/cases/demoBand.ts`, with the backend's band
  rule; a case's series sits on its own timeline dates up to the target via `caseBandPasses`) and
  the live-question answer (`src/features/live/liveQuestion.ts`, picked from the frame id)
  are DEMO until `POST /v1/explore` exists (spec: NISAR-Modeling `docs/EXPLORE_API.md`). No backend
  is called today.
- **Experimental model metrics** on `/method`: `src/features/charts/metrics.ts`, from the
  NISAR-Models model cards (github.com/Ch0comilo/NISAR-Models).
- **Basemap:** Esri World Imagery tiles (`src/features/globe/cesium.ts`), no key.

## Configuration

The frontend reads **one optional variable**, `VITE_API_BASE_URL` (the backend's origin when it is
not served from the same one; empty in production). In production Vercel rewrites `/api/*` to the
Railway backend (`vercel.json`, before the SPA catch-all, which skips `api/`), so the browser only
talks to its own origin; in development Vite proxies `/api` to `VITE_DEV_API_TARGET` (default
`http://localhost:8000`). Old `VITE_ENABLED_HAZARDS` / `VITE_ANALYSIS_API_URL` are unused. Any
`VITE_*` variable is inlined into the public bundle: never put a secret (LLM key, token) there;
secrets belong in a backend.

`src/lib/api/apiClient.ts` is the only place that calls the backend: `apiRequest(path, zodSchema)`
validates every answer, and a non-2xx answer (always `application/problem+json`) becomes an
`ApiError` with its `reasonCode`. E2E never reaches a real backend: specs mock `/api/v1/**` with
`page.route()`.

## Honesty rules (non-negotiable)

- Never invent a number, date, source or link. Numbers come from `cases.ts` or the science team's
  docs, with the source in the chip tooltip.
- Every DEMO value carries a visible chip (`src/lib/ProvenanceChip.tsx`, `c-prov` classes). DEMO and
  TO FILL chips can never be hidden; Help → "Show REAL labels" hides only REAL chips.
- Shares of a group use a fixed 0–100% axis. "No measurement" is grey `#62666d`, never white. Gaps
  stay gaps. Write "80 m grid" / "40 m grid".
- A planned pass is a promise, not data: never clickable, never drawn as a measurement.

## Code conventions

Mirrors the conventions used at work (consoles-ui-monorepo), kept as simple as the prototype allows.

- **TypeScript strict**, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. No `any`,
  no non-null `!`.
- **`type` over `interface`** (the one exception is the `Window` augmentation in `cesiumBaseUrl.ts`).
- **Named exports only.** Default exports are allowed only in tool configs.
- **Arrow-function components**, props as a `type` above the component.
- **`@/` imports** inside `src/` and tests, never `../`.
- **Feature folders:** `src/features/<feature>/` (cases, case-panel, charts, downloads, frames,
  geo, globe, live, nova, onboarding, search, sheet, story, timeline); shared helpers in `src/lib/`; page code in `src/pages/<page>/`.
- **CSS per page with its prefix:** `s-` shared site (`src/pages/site/site.css`, tokens), `l-`
  landing, `k-` cases, `m-` method, `a-` about, `x-` explorer, `c-` charts and chips
  (`src/features/charts/charts.css`).
- **Comments: KISS.** Say _why_, never _what_. One line when possible. No commented-out code.
- **Code, comments, commits and UI copy in English.**
- Every async view handles **loading, error (with retry) and empty**, never only the happy path.
- `data-testid` on everything a test touches. Respect `prefers-reduced-motion`.

## Testing

- **Unit (Vitest):** `tests/unit/`, for pure logic (Observation Plan parsing, hit-testing, timeline
  layout, case data rules, live-question helpers). A fixed bug gets a regression test that says
  which case it covers.
- **E2E (Playwright):** specs in `tests/e2e/` (`site`, `cases`, `method`, `explorer`, and `story`
  for the guided story, onboarding, Nova, downloads and `/report`), **Page Object Model** in
  `tests/e2e/pom/` (`GlobePage`, `MethodPage`), locators by `data-testid`, the Observation Plan
  mocked with `page.route()` from `tests/e2e/mocks/`.
- The quick tour shows on a first plain `/explore` visit (not on `?case=`, `?frame=` or
  `?story=1`). `GlobePage.skipOnboarding()` marks it seen in `localStorage` before the page loads,
  for tests that must not see it; its overlay lets clicks through except on its card.
- E2E builds and serves the **production build** (`pnpm build && pnpm preview`) on port 5174, or on
  `E2E_PORT` so parallel worktrees can run their own server. With `reuseExistingServer` outside CI,
  stop any stale server on that port first.
- Tests run with `reducedMotion: "reduce"`, which stops the globe's idle spin so the frame under the
  free screen centre (47-3, over Colombia) is predictable.
- Headless Chromium renders Cesium with software WebGL (SwiftShader), so E2E is slow. Keep
  `workers: 2`.

## Git

- **Conventional commits** (`feat:`, `fix:`, `test:`, `chore:`, `docs:`, `refactor:`), enforced by
  commitlint on `commit-msg`. lint-staged runs oxlint + Prettier on `pre-commit`.
- Repo: `github.com/nisar-hazard-watch/nisar-hazard-watch` (org). Push with the academic GitHub
  account (SSH alias `github-academic`).
- CI (`.github/workflows/ci.yml`): lint, format check, typecheck, unit, build, then E2E.
- Deploy: static build on Vercel; `vercel.json` rewrites every path except `data/`, `cesium/` and
  `assets/` to `index.html`.

## Guided story, onboarding, Nova, downloads and report

- **Guided story** (`/explore?story=1`, `src/features/story/`): six chapters on the case marked
  `tour` (Qadirabad, Chenab flood). Card per chapter plus a caption bar (Back / Play / Next, ← →,
  Esc exits); Play advances every 9 s; optional Web Speech voice reads the captions. Numbers are the
  case's REAL values. **TO FILL:** chapter 1 "Areas affected" / "People affected" (PMD/FFD
  bulletin, official figures only) and chapter 5 photos and news; they stay bracketed slots with a
  TO FILL chip until credited, linked material is copied in.
- **Quick onboarding** (`src/features/onboarding/`): four spotlight steps (start card, panel,
  layer dock, timeline), once per browser (`localStorage`, guarded); Help → "Replay the quick tour".
- **Nova** (`src/features/nova/`): rule-based, DEMO chip, says so in the chat. It only rephrases
  what is on screen and cites the case's sources; impact questions get "No data". The swap point
  for a real model is `novaAnswer(question, context)` in `src/features/nova/novaAnswer.ts`; the UI
  only calls that.
- **Downloads** (`src/features/downloads/`): globe PNG with a context strip, timeline JSON/CSV
  (every row `demo: true`), and "PDF report", which opens `/report?case=<id>`: DATA blocks straight
  from `cases.ts` plus a template summary labelled "Not AI-written"; "Save as PDF" prints.
