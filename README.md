<div align="center">

<img src="docs/screenshots/landing-hero.jpg" alt="NISAR Hazard Watch landing page: the headline &quot;Earth, without the clouds.&quot; over a 3D Earth with its cloud cover" width="100%">

# NISAR Hazard Watch

**Earth, without the clouds.**

NASA-ISRO NISAR radar sees the ground through cloud, smoke and night. NISAR Hazard Watch turns its
passes into maps anyone can read: burn scars, floods, forest loss and earthquake ground motion, on
an interactive 3D globe.

[![Live demo](https://img.shields.io/badge/live%20demo-open%20the%20globe-c9b48b?style=for-the-badge&labelColor=04070e)](https://nisar-hazard-watch.vercel.app)
[![Method](https://img.shields.io/badge/method-%26%20validation-c9b48b?style=for-the-badge&labelColor=04070e)](https://nisar-hazard-watch.vercel.app/method)

[![CI](https://github.com/cris-eci/nisar-hazard-watch/actions/workflows/ci.yml/badge.svg)](https://github.com/cris-eci/nisar-hazard-watch/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![CesiumJS](https://img.shields.io/badge/CesiumJS-3D%20globe-6caddf)
![three.js](https://img.shields.io/badge/three.js-landing%20scene-04070e?logo=threedotjs&logoColor=white)
![NASA Space Apps 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026-0b3d91)

**[Live demo](https://nisar-hazard-watch.vercel.app)** ·
**[Guided tour](https://nisar-hazard-watch.vercel.app/explore)** ·
**[Method & validation](https://nisar-hazard-watch.vercel.app/method)** ·
**[API contract](docs/analysis-api.md)**

</div>

> [!IMPORTANT]
> **Prototype status.** Everything that says _where_ and _when_ is real NASA, ASF and USGS data:
> the 16,663 frame outlines, every satellite pass, the earthquakes and their radar pairs. The
> analysis drawn on top (burn maps, flood extents, ground motion, validation figures) is
> **simulated demo data**, labelled **Demo data** in the app, until the
> [NISAC_Data_Lab](#architecture) pipeline is connected. See [What is real and what is demo](#what-is-real-and-what-is-demo).

## Contents

- [The story](#the-story)
- [The explorer](#the-explorer)
- [Four hazards, one contract](#four-hazards-one-contract)
- [Method & validation](#method--validation)
- [Why radar](#why-radar)
- [Features](#features)
- [What is real and what is demo](#what-is-real-and-what-is-demo)
- [Featured events](#featured-events)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [Data sources and credits](#data-sources-and-credits)

## The story

The landing page is one scroll over a fixed Earth. The clouds dissolve, NISAR's orbit appears while
a counter climbs to twelve days, then the planet turns to the M7.5 epicentre in Venezuela and shows
what two passes can measure.

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/landing-orbit.jpg" alt="The planet with NISAR's gold orbit and a counter reading 12 days: every place, every twelve days"></td>
    <td width="50%"><img src="docs/screenshots/landing-epicentre.jpg" alt="The planet turned to the Venezuela epicentre, a callout showing demo interferogram fringes and 31.3 cm of peak motion"></td>
  </tr>
  <tr>
    <td align="center"><b>Every place, every twelve days</b><br><sub>NISAR's orbit and its 12-day repeat cycle</sub></td>
    <td align="center"><b>Down to the centimetre</b><br><sub>The Venezuela M7.5 epicentre, demo fringes</sub></td>
  </tr>
</table>

<img src="docs/screenshots/landing-compare.jpg" alt="Drag-to-compare view of North Dakota farmland: NISAR radar on the left shows every field and gold centre-pivot circles, Sentinel-2 on the right is mostly cloud" width="100%">

<p align="center"><b>Same fields, one day apart.</b> Drag across NISAR radar and a cloudy Sentinel-2 view of North Dakota.<br><sub>NISAR first image (NASA/JPL-Caltech) and NASA HLS (contains modified Copernicus Sentinel-2 data).</sub></p>

## The explorer

A real globe of every NISAR frame. Start with a two-minute guided tour of four events, or explore
freely: point at any land to see its frame, click to compare its latest two passes.

<img src="docs/screenshots/explorer-tour.jpg" alt="Guided tour on the Venezuela M7.5 earthquake: the real NISAR frame outline in gold, demo line-of-sight displacement lobes on the coast, and the panel with 31.3 cm of peak motion" width="100%">

<p align="center"><b>Guided tour, event 1 of 4:</b> the M7.5 earthquake at Catia La Mar, Venezuela, on its real NISAR frame (track 162 A, frame 7).</p>

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/explorer-intro.jpg" alt="Explorer intro card over the globe: four real events, two minutes, with Start the tour and Explore freely"></td>
    <td width="50%"><img src="docs/screenshots/explorer-hover.jpg" alt="Explore mode: hovering the globe shows track 47, frame 3, HH+HV, with gold markers on the featured events"></td>
  </tr>
  <tr>
    <td align="center"><b>Four real events, two minutes</b><br><sub>The intro on a first visit</sub></td>
    <td align="center"><b>16,663 frames, hover to inspect</b><br><sub>Real outlines from the NISAR Observation Plan</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/explorer-fringes.jpg" alt="Interferogram fringes of the Venezuela earthquake draped on the globe, one colour cycle per 11.9 cm of motion"></td>
    <td width="50%"><img src="docs/screenshots/explorer-wildfire.jpg" alt="Burn analysis on track 47, frame 3: severity classes on the globe, hectares by class, and the real pass dates with upcoming passes in gold"></td>
  </tr>
  <tr>
    <td align="center"><b>Interferogram fringes</b><br><sub>Count the rings: 11.9 cm of motion each (demo)</sub></td>
    <td align="center"><b>Burn severity and live passes</b><br><sub>Hectares by class (demo); pass dates from the live plan</sub></td>
  </tr>
</table>

## Four hazards, one contract

Two families of analysis share one API contract: **surface change** from GCOV backscatter
(hectares) and **ground motion** from GUNW interferograms (centimetres). Each hazard is one entry in
a registry; the UI never hard-codes a hazard.

<table>
  <tr>
    <td width="25%"><img src="docs/screenshots/explorer-wildfire.jpg" alt="Wildfire burn severity"></td>
    <td width="25%"><img src="docs/screenshots/explorer-flood.jpg" alt="Flood extent"></td>
    <td width="25%"><img src="docs/screenshots/explorer-deforestation.jpg" alt="Forest loss"></td>
    <td width="25%"><img src="docs/screenshots/explorer-tour.jpg" alt="Earthquake displacement"></td>
  </tr>
  <tr>
    <td align="center"><b>Wildfire</b><br><sub>HV drop · burn severity</sub></td>
    <td align="center"><b>Flood</b><br><sub>HH drop · open water</sub></td>
    <td align="center"><b>Forest loss</b><br><sub>HV drop · cleared canopy</sub></td>
    <td align="center"><b>Earthquake</b><br><sub>GUNW · line-of-sight cm</sub></td>
  </tr>
</table>

<p align="center"><sub>All four analyses are demo data until the pipeline runs on them; flood and forest loss sit behind the hazard flag.</sub></p>

## Method & validation

Four steps per hazard, told on the explorer's own demo rasters, then how each result is checked
against independent data.

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/method-fringes.jpg" alt="Method step 2 of 4 for earthquakes: convert phase to motion, with fringes beside the displacement map"></td>
    <td width="50%"><img src="docs/screenshots/method-severity.jpg" alt="Method step 4 of 4 for wildfires: classify, with the severity classes over the after-fire HV image"></td>
  </tr>
  <tr>
    <td align="center"><b>Convert phase to motion</b><br><sub>d = −λ / 4π × φ</sub></td>
    <td align="center"><b>Classify the burn</b><br><sub>≤ −2 · −4 · −6 dB</sub></td>
  </tr>
</table>

<img src="docs/screenshots/method-validation.jpg" alt="Validation grid: 87 % of FIRMS detections inside the scar, 0.71 kappa against HLS dNBR, 1.8 cm RMS against GNSS, all labelled demo values" width="100%">

<p align="center"><b>Checked against independent data:</b> NASA FIRMS, HLS dNBR and GNSS stations.<br><sub>Demo values until real runs exist; the comparison method is final.</sub></p>

## Why radar

|                                   |                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Sees through clouds and smoke** | Optical satellites go blind over an active fire or a tropical storm. Radar brings its own signal.         |
| **Every 12 days, day and night**  | NISAR maps almost all of Earth's land on a fixed cycle, so every change has a clean before and after.     |
| **Down to the centimetre**        | L-band (24 cm) reaches through forest canopy, and comparing two passes measures how far the ground moved. |

## Features

- **A scroll-driven landing** over a three.js Earth: the clouds dissolve, the orbit appears, the
  planet turns to an epicentre; a drag-to-compare radar vs. optical view; reduced motion honoured.
- **3D globe of all 16,663 NISAR frames.** Hover to find a frame, click to fly to it. Frames come
  from NASA's NISAR Observation Plan and are hit-tested locally, so hovering is instant.
- **Two families of analysis behind one contract**
  - _Surface change_ (GCOV backscatter): wildfire burn severity, flood extent, forest loss, in
    hectares, with severity classes and before/after radar images draped on the terrain.
  - _Ground motion_ (GUNW interferograms): earthquake line-of-sight displacement in centimetres,
    with displacement and interferometric fringe layers.
- **Featured events** with real NISAR before/after pairs: three 2026 earthquakes and a fire site.
- **Satellite passes per frame**, live from the Observation Plan, flagging the HH+HV passes that
  burn mapping needs.
- **Shareable views**: `/explore?event=venezuela-2026`, `/explore?frame=47-3`.
- **Guided tour**: an intro card, a step-by-step tour of the featured events (arrow keys work
  too), then free exploration.
- **Method & validation page**: the four steps per hazard on the app's own rasters, validation
  sources and limits.
- **Multi-hazard feature flag**: `VITE_ENABLED_HAZARDS` turns hazards on and off per deployment.

## What is real and what is demo

### ✅ Real

| Element                                                                    | Source                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 3D globe, navigation, hover, selection, deep links                         | The app itself                                                      |
| The 16,663 NISAR frames (outlines, track, frame, pass, polarization modes) | NASA NISAR Observation Plan (snapshot in `public/data/frames.json`) |
| Satellite passes per frame (past and planned dates, HH+HV or HH only)      | NASA NISAR Observation Plan API, fetched live                       |
| Earthquakes in the featured events (date, magnitude, depth, epicentre)     | USGS earthquake catalogue                                           |
| Before/after interferogram pairs for those earthquakes                     | NISAR L2 GUNW products on ASF DAAC (verified 2026-10-21)            |
| Choice of the passes to compare (latest HH+HV pair for fires)              | App logic over the live pass data                                   |
| Hazard feature flag, pages, intro and guided tour                          | The app itself (copy from public NISAR mission information)         |
| Client for the analysis API (`VITE_ANALYSIS_API_URL`)                      | Working code; there is no backend to call yet                       |

### 🟡 Demo (simulated, labelled in the app)

| Element                                                  | What it takes to make it real                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Burn maps: hectares, severity, before/after radar images | The NISAC_Data_Lab GCOV pipeline behind the [analysis API](docs/analysis-api.md) |
| Earthquake displacement: centimetres, lobes, fringes     | Processing the real GUNW files for the featured pairs                            |
| Flood and forest loss analyses                           | Same pipeline as wildfire, with their own thresholds                             |
| Validation figures on `/method` (87 %, 0.71 κ, 1.8 cm)   | Comparing real results with NASA FIRMS, HLS dNBR and GNSS stations               |
| The wildfire event (Colombian Andes)                     | Choosing a real fire with FIRMS detections inside the NISAR data window          |
| Analysis loading time (~1.5 s)                           | Real time depends on the pipeline                                                |

Demo results are seeded per frame and date pair, so the same view always shows the same result,
and the map always agrees with the numbers next to it.

## Featured events

| Event                                                 | Date       | NISAR pair (before → after) | Frame                |
| ----------------------------------------------------- | ---------- | --------------------------- | -------------------- |
| M7.5 earthquake, Catia La Mar, Venezuela (10 km deep) | 2026-06-24 | 2026-06-13 → 2026-06-25     | Track 162 A, frame 7 |
| M6.8 earthquake, Kumamoto, Japan (8 km deep)          | 2026-07-28 | 2026-07-21 → 2026-08-14     | Track 24 A, frame 18 |
| M7.7 earthquake, Pitaloza Arriba, Panama (13 km deep) | 2026-10-09 | 2026-10-05 → 2026-10-17     | Track 76 A, frame 5  |
| Wildfire, Colombian Andes (demo site)                 | 2026-10-15 | Latest HH+HV pair           | Track 47 A, frame 3  |

Kumamoto and Panama also have descending pairs, which allow separating vertical from horizontal
motion.

## Architecture

```mermaid
flowchart LR
  OP["NASA NISAR<br/>Observation Plan API"] -->|frames snapshot| FJ["public/data/frames.json"]
  OP -->|passes per frame, live| APP
  FJ --> APP["NISAR Hazard Watch<br/>React + CesiumJS"]
  USGS["USGS earthquake<br/>catalogue"] -->|curated events| APP
  ASF["ASF DAAC<br/>NISAR GCOV / GUNW"] --> PIPE["NISAC_Data_Lab<br/>pipeline (Python)"]
  PIPE -->|"analysis API<br/>(docs/analysis-api.md)"| APP
  APP -.->|no API configured| DEMO["Seeded demo<br/>analyses"]
```

- **Analysis contract:** [`docs/analysis-api.md`](docs/analysis-api.md), mirrored by
  `src/features/analysis/analysis.types.ts`. It maps every field to the pipeline functions.
- **Hazard registry:** `src/features/analysis/hazards.ts`. Each hazard declares its family,
  polarization, colours, copy and demo; the UI never hard-codes a hazard.

## Getting started

Requirements: Node.js 20.19+ and pnpm 8.

```bash
pnpm install
pnpm dev            # http://localhost:5173
```

| Command                              | What it does                                                |
| ------------------------------------ | ----------------------------------------------------------- |
| `pnpm dev`                           | Dev server                                                  |
| `pnpm build` / `pnpm preview`        | Production build and local preview                          |
| `pnpm typecheck`                     | TypeScript, strict                                          |
| `pnpm lint` / `pnpm format`          | oxlint / Prettier                                           |
| `pnpm test`                          | Unit tests (Vitest)                                         |
| `pnpm test:e2e` / `pnpm test:e2e:ui` | End-to-end tests (Playwright), headless or in UI mode       |
| `pnpm frames:fetch`                  | Refresh the NISAR frames snapshot from the Observation Plan |

## Configuration

Copy `.env.example` to `.env.local` to override the defaults in `.env`.

| Variable                | Default                                   | Description                                                                                              |
| ----------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `VITE_ENABLED_HAZARDS`  | `wildfire,earthquake,flood,deforestation` | Hazards shown in the app. The picker appears with more than one. Unknown values fall back to `wildfire`. |
| `VITE_ANALYSIS_API_URL` | _(empty)_                                 | Base URL of the analysis service. Empty runs on demo data.                                               |

## Testing

- **Unit (Vitest):** hit-testing, Observation Plan parsing, pair selection, the hazard flag and the
  demo simulations, including regression tests for fixed bugs.
- **End-to-end (Playwright):** Page Object Model, `data-testid` locators and mocked network. Tests
  run against the **production build** with pinned configuration, so local settings cannot change
  the results.
- **CI** runs lint, format, typecheck, unit tests, build and E2E on every push and pull request.

## Project structure

```text
src/
├── pages/            Landing, Explorer, Method (one folder each) and the shared site/ system
├── features/
│   ├── analysis/     Contract, hazard registry, API client, demo simulations
│   ├── events/       Featured events (real earthquakes, demo fire)
│   ├── frame-panel/  Frame details, passes, analysis results
│   ├── frames/       Frames snapshot, hit-testing, Observation Plan client
│   ├── globe/        CesiumJS viewer, entities, camera
│   └── onboarding/   Intro and guided tour cards
└── lib/              Router, async state, shared UI
docs/                 API contract and screenshots
scripts/              Frames snapshot generator
tests/                Unit (Vitest) and E2E (Playwright, page objects)
```

## Contributing

- **Conventional commits** (`feat:`, `fix:`, `docs:`, …), enforced by commitlint. Husky and
  lint-staged run oxlint and Prettier before each commit.
- **TypeScript strict** with `noUncheckedIndexedAccess`; named exports; `@/` imports; comments say
  _why_, not _what_.
- Every async view handles loading, error (with retry) and empty states.
- Project conventions for people and AI agents: [`CLAUDE.md`](CLAUDE.md).

## Roadmap

- [x] Globe with all NISAR frames and live passes
- [x] Multi-hazard analysis contract (surface change + ground motion) and feature flag
- [x] Featured events with real coseismic NISAR pairs
- [x] Landing, method & validation and explorer in one visual system (v4), with a guided tour
- [ ] Real GCOV burn analysis from the pipeline, validated against NASA FIRMS and HLS
- [ ] Real GUNW ground motion for Kumamoto and Venezuela, validated against GNSS
- [ ] A real wildfire event inside the NISAR data window
- [ ] Ascending + descending decomposition into vertical and east-west motion
- [ ] 3D terrain deformation view for earthquakes

## Data sources and credits

- **NASA-ISRO NISAR** L2 GCOV and GUNW products, distributed by the
  [Alaska Satellite Facility DAAC](https://search.asf.alaska.edu/).
- **NASA NISAR Observation Plan** (frames and planned passes).
- **USGS** [earthquake catalogue](https://earthquake.usgs.gov/earthquakes/search/).
- **NASA FIRMS** and **HLS** (planned validation sources).
- Landing pictures, all public domain: NISAR's first image of North Dakota and the artist's
  concept of NISAR (NASA/JPL-Caltech); Blue Marble and cloud imagery (NASA Visible Earth). Optical
  view: NASA HLS, contains modified Copernicus Sentinel-2 data (2025), via NASA Worldview.
- Base imagery © Esri, Maxar, Earthstar Geographics. Globe by [CesiumJS](https://cesium.com/platform/cesiumjs/).

Built for the **NASA International Space Apps Challenge 2026** (_NISAR surface change_ challenge).
