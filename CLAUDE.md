# CLAUDE.md — globe-ui

Web app for the NASA Space Apps 2026 NISAR challenge (team project). Pages: landing (`/`), 3D
globe explorer (`/explore`, `?frame=` or `?event=` deep links) and method & validation (`/method`).
On the globe the user picks a NISAR radar frame or a featured event and sees its passes and an
analysis: surface change (wildfire core; flood and deforestation behind the flag) or ground motion
(earthquakes, from GUNW interferograms).

## Stack

React 19 + TypeScript (strict) · Vite · CesiumJS (no ion token) · Tailwind CSS 4 · Vitest ·
Playwright · oxlint · Prettier · Husky + lint-staged + commitlint.

## Commands

```bash
pnpm dev            # http://localhost:5173
pnpm typecheck      # tsc -b
pnpm lint           # oxlint
pnpm format         # prettier --write .
pnpm test           # unit tests (Vitest)
pnpm test:e2e       # E2E (Playwright, headless)
pnpm test:e2e:ui    # Playwright UI mode, to watch tests run
pnpm frames:fetch   # refresh public/data/frames.json from the Observation Plan API
```

## Data

- **Frames:** `public/data/frames.json` is a snapshot of all 16,663 NISAR frames from NASA's
  Observation Plan API (`scripts/fetch-frames.ts`). Hover hit-testing runs locally on it, so the demo
  does not depend on the API being up. Short keys (`t`, `f`, `p`, `x`, `r`) keep it small.
- **Passes:** fetched live per frame on click (`observationPlanApi.ts`). A pass can list several
  mode codes (`148,212,156`); it is HH+HV when any of them is L-band cross-pol.
- **Hazard analysis:** two families in one contract (`analysis.types.ts`, `docs/analysis-api.md`):
  `change` (GCOV backscatter, hectares) and `deformation` (GUNW, centimetres). Per-hazard settings
  live in `features/analysis/hazards.ts`; the UI never hard-codes a hazard. `VITE_ENABLED_HAZARDS`
  (feature flag; default in `.env`: `wildfire,earthquake`) picks what shows. `analysisApi.ts` calls
  the pipeline when `VITE_ANALYSIS_API_URL` is set, otherwise the hazard's seeded demo
  (`features/analysis/mock/`). Keep the "Demo data" badge while `isDemo` is true.
- **Featured events:** `features/events/events.ts`. Earthquake pairs are real GUNW pairs on ASF that
  bracket the event (a unit test enforces it); the analysis on top is demo until the pipeline runs.
- **Validation figures** on `/method` are demo values, labelled as such, until real runs exist.

## Code conventions

Mirrors the conventions used at work (consoles-ui-monorepo), kept as simple as the prototype allows.

- **TypeScript strict**, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. No `any`,
  no non-null `!`.
- **`type` over `interface`** (the one exception is the `Window` augmentation in `cesiumBaseUrl.ts`).
- **Named exports only.** Default exports are allowed only in tool configs.
- **Arrow-function components**, props as a `type` above the component.
- **`@/` imports** inside `src/` and tests, never `../`.
- **Feature folders:** `src/features/<feature>/`; shared helpers in `src/lib/`.
- **Comments: KISS.** Say _why_, never _what_. One line when possible. No commented-out code.
- **Code, comments, commits and UI copy in English.**
- Every async view handles **loading, error (with retry) and empty**, never only the happy path.

## Testing

- **Unit (Vitest):** `tests/unit/`, for pure logic (hit-testing, parsing, pair selection). A fixed
  bug gets a regression test that says which case it covers.
- **E2E (Playwright):** `tests/e2e/`, **Page Object Model** in `tests/e2e/pom/`, locators by
  `data-testid`, network mocked with `page.route()` from `tests/e2e/mocks/`.
- E2E runs against the **production build** on port 5174 with pinned env (`wildfire,earthquake`,
  demo data), so local `.env.local` or a running dev server cannot change results. The explorer's
  intro is skipped with `GlobePage.skipIntro()` (explore mode) except in its own test.
- Tests run with `reducedMotion: "reduce"`, which stops the idle spin so the frame under the screen
  centre (47-3, over Colombia) is predictable.
- Headless Chromium renders Cesium with software WebGL (SwiftShader), so E2E is slow. Keep
  `workers: 2`.

## Git

- **Conventional commits** (`feat:`, `fix:`, `test:`, `chore:`, `docs:`, `refactor:`), enforced by
  commitlint on `commit-msg`. lint-staged runs oxlint + Prettier on `pre-commit`.
- Push with the academic GitHub account (SSH alias `github-academic`).
