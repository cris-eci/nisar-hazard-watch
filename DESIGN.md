# DESIGN.md: NISAR Hazard Watch

The visual system of the app. Read this before building or changing any UI, so screens made by
different people (and agents) look like one product.

## Overview

Two surfaces share one product:

- **Landing page (`/`)**: **one scroll-driven story over a fixed Earth**. The planet stays on
  screen while the pitch plays out on it: the clouds dissolve ("Radar brings its own light"), NISAR's
  orbit appears while a counter climbs to 12 days, then the planet turns to the Venezuela M7.5
  epicentre and a callout shows the demo fringes. After the story: a draggable optical/radar
  comparison, a pipeline timeline that fills as you scroll, a horizontal events carousel, the
  mission and a closing call to action. Mood: calm, product-grade, space; deep space blacks and
  blues with one gold accent. Tokens live in `src/pages/site/site.css`; the scene in
  `EarthHero.tsx`, the motion in `useLandingMotion.ts`.
- **Method (`/method`)**: same system as the landing. A scrollytelling of the four steps per
  hazard (wildfire, earthquake; a pill switch, `?hazard=` in the URL): the steps scroll on the left
  and a sticky square figure cross-fades the explorer's demo rasters on the right. Then validation
  in a gold-figure grid, limits, and one closing action. Layout in `src/pages/method/method.css`.
- **Explorer (`/explore`)**: the app. A **mission-control look over a real planet**: the Cesium
  globe fills the screen and glass cards float over it. A top bar (wordmark pill, Guided tour /
  Explore switch, Whole globe, Method), one card at the bottom left and the frame panel on the
  right. Three modes: an **intro** card on a first visit, a **guided tour** through the featured
  events (chapter, title, dots, Next event), and **explore** (hazard, pass direction, featured
  events; hover a real NISAR frame, click it to analyse it). Layout in
  `src/pages/explorer/explorer.css`.

Three words: **calm, scientific, legible**. Colour is reserved for **data** and the one gold
accent: chrome stays ink on deep blue, so burn scars, flood extents and interferogram fringes are
the brightest thing on screen.

### One system

All three pages share `src/pages/site/`: `site.css` holds the tokens, type, pills, chips, nav and
footer (`s-*` classes); `SiteNav.tsx`; `siteMotion.ts` for smooth scroll and section entrances.
Each page keeps only its own layout (`l-*` landing, `m-*` method, `x-*` explorer). Tailwind stays
available for one-off utilities, but new UI uses the tokens below.

## Colors

Tokens live on `.site` in `site/site.css`.

| Token      | Value                                   | Use                                                         |
| ---------- | --------------------------------------- | ----------------------------------------------------------- |
| `space`    | `#04070e`                               | Page background                                             |
| `deep`     | `#08101f`                               | Image wells, panels                                         |
| `night`    | `#0e1930`                               | Inset surfaces                                              |
| `ink`      | `#ebe9e4`                               | Primary text; the picked segment                            |
| `ink-2`    | `#d4d2cc`                               | Secondary text on images and panels                         |
| `muted`    | `#a9a69e`                               | Secondary body, captions, mono labels                       |
| `gold`     | `#c9b48b` (hover `#dccaa3`)             | The only accent: actions, key figures, selection, the orbit |
| `gold-ink` | `#16120a`                               | Text on gold                                                |
| `demo`     | `#fcd34d` on `rgba(245,158,11,.18)`     | DEMO DATA / DEMO VALUES chips                               |
| `hairline` | `rgba(235,233,228,.08–.12)`             | Borders, dividers, rails                                    |
| `glass`    | `rgba(8,16,31,.72–.80)` + blur 16–20 px | Nav pills, callouts, explorer cards and panel               |

### Semantic (data colours)

Data colours are owned by each hazard in `src/features/analysis/hazards.ts`. Never reuse them for
UI chrome.

| Hazard                      | Low       | Moderate  | High      |
| --------------------------- | --------- | --------- | --------- |
| Wildfire (burn severity)    | `#facc15` | `#f97316` | `#dc2626` |
| Flood (extent)              | `#7dd3fc` | `#38bdf8` | `#2563eb` |
| Deforestation (forest loss) | `#e9c46a` | `#d97706` | `#b45309` |

| Layer                      | Scale                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| Earthquake displacement    | Diverging `#2563eb` (away) → white → `#dc2626` (toward), symmetric ±N cm, transparent near 0 |
| Interferogram fringes      | Hue wheel, one cycle per λ/2 = 11.92 cm                                                      |
| Backscatter (before/after) | Grayscale, −22 dB black → −4 dB white                                                        |

| Status                      | Style                                                       |
| --------------------------- | ----------------------------------------------------------- |
| Demo data chip, demo values | `demo` token, mono uppercase                                |
| Error                       | `rgba(239,68,68,.3)` border on `rgba(239,68,68,.08)`, retry |
| HH only passes              | Dimmed (50 %) in the pass grid; HH+HV is the normal case    |
| Selected frame outline      | `gold` with a 6–8 % fill; hovered frame `#e2e8f0`           |
| Featured event markers      | Gold points with the country label, explore mode only       |

## Typography

### Font Family

**Albert Sans** 300/400/500/600 for all text, and **JetBrains Mono** 400/500 for data labels only
(uppercase, letter-spacing 0.04–0.06em, 11–13 px), both from Google Fonts in `site/site.css`.

### Explorer hierarchy

| Element                 | Style                                       |
| ----------------------- | ------------------------------------------- |
| Intro title             | `clamp(28px, 3.2vw, 40px)`, −0.035em        |
| Tour title, panel title | 26 / 24 px, −0.03em                         |
| Key figure (ha, cm)     | 52 px, −0.045em, `tabular-nums`             |
| Body on cards           | 14–15 px                                    |
| Panel section titles    | 14 px in `ink-2`                            |
| Labels, meta, dates     | JetBrains Mono 11–12 px, uppercase, `muted` |

### Content-page scale (landing, method)

Defined in `site/site.css`:

| Step    | Size                                         | Weight / tracking / leading |
| ------- | -------------------------------------------- | --------------------------- |
| Display | `clamp(3.25rem, 1rem + 7vw, 8.5rem)`         | 500 / −0.045em / 0.92       |
| Head    | `clamp(2.5rem, 1.4rem + 3.6vw, 5rem)`        | 500 / −0.035em / 0.98       |
| Lead    | `clamp(1.125rem, 1rem + 0.5vw, 1.375rem)`    | 400 / — / 1.45              |
| Body    | `clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)` | 400 / — / 1.55              |
| Small   | 14–15 px                                     | 400                         |

Outside the scale on purpose: the "12" counter (weight 300, gold), "Pick any frame." and the
callout's centimetre value. Headlines never run past two lines at any width.

### Principles

- **Weights:** 400 for text, 500 for headings and actions, 600 for the wordmark, 300 only for the
  big gold figures ("12", validation values).
- **Sentence case** for headings, buttons and labels ("Burn analysis", "Open the globe").
  This is deliberate and consistent; do not mix in Title Case.
- `tabular-nums` on every number that changes or is compared (areas, centimetres, dates).
- Headings use `text-wrap: balance` (global).
- Mono labels are written in sentence case in code and uppercased with CSS, so screen readers
  and tests read words, not letters.
- `…` for ellipses and loading text ("Loading NISAR frames…").
- Dates are ISO `YYYY-MM-DD`: scientific audience, unambiguous across countries.

## Layout

### Spacing System

Content pages use the clamp-based `--margin` and section gaps in `site.css`. Explorer cards sit
16 px from the edges (12 px on phones), with 16–22 px padding and 12–22 px between blocks.

### Grid & Container

- **Explorer:** full-screen globe. Top bar 16 px from the top; bottom-left card 340 px (explore) or
  up to 440 px (tour); frame panel 400 px on the right, from 76 px to 20 px off the bottom.
- **Content pages:** `s-container`, max 76rem, centred.

### Whitespace Philosophy

The globe needs room to breathe: never add a third floating card. The camera centres a frame in the
free band between the left card and the right panel when it flies there (`framedRectangle`).

## Elevation & Depth

| Level | Use                          | Style                                                 |
| ----- | ---------------------------- | ----------------------------------------------------- |
| 0     | Globe                        | Full bleed                                            |
| 1     | Explorer cards, panel, pills | `glass` + 1 px hairline border, radius 24 (pills 999) |
| 2     | Tooltip                      | `glass`, mono 11 px, radius 10, follows the cursor    |

### Decorative Depth

The landing's depth lives mostly in the WebGL scene (Earth's Fresnel atmosphere, a soft blue halo,
a starfield, NISAR's gold orbit). Pages allow exactly these: a text shadow on text over the planet
or a photo, a bottom gradient on event cards, glass on pills, callouts, chips and explorer cards,
and a soft gold ring on the epicentre marker. No other gradients or glows.

## Shapes

### Border Radius Scale

| Radius                     | Use                                       |
| -------------------------- | ----------------------------------------- |
| 999                        | Buttons, pills, segmented controls, chips |
| 24                         | Explorer cards and panel                  |
| `clamp(14px, 1.6vw, 28px)` | Images and cards on content pages         |
| 16                         | Callouts, the hazard grid                 |
| 10–12                      | Tooltip, event rows, formula blocks       |

### Photography & Illustrations

No stock imagery or illustrations: NASA public-domain pictures on content pages (credited in the
footer), Esri imagery and data layers in the explorer.

## Components

### Top Navigation

Content pages: `SiteNav` (wordmark left; Events, Method and a glass "Open the globe" pill right;
clear over the landing's planet, glass on the method page). Explorer: its own top bar of glass
pills (wordmark, mode switch, Whole globe, Method).

### Buttons

- **Primary:** gold pill (`gold` on `gold-ink`, hover `gold-hover`, active `scale(.97)`). One per
  view.
- **Secondary:** ghost pill with a hairline border.
- **Text button:** `muted`, or gold for "Back to tour" and retry-style actions.
- Every icon-only button has an `aria-label`.

### Cards & Containers

Explorer cards and panel: level 1 glass. The panel scrolls inside; sections are split by a
hairline. Satellite passes and method details fold into `<details>`.

### Inputs & Forms

None today beyond buttons.

### Tags / Badges

JetBrains Mono chips: data labels on `rgba(4,7,14,.6)` + blur; DEMO DATA on the `demo` token.

### Tab / Filter

`SegmentedControl`: `role="group"` with `aria-pressed` buttons; the picked one is an `ink` pill on
a faint track. Variants: `pills`, `small` (pass direction), `bar` (glass, the mode switch) and
`grid` (two columns with colour dots, the hazard picker).

### CTA / Footer

Content pages: gold pill buttons (radius 999, `gold` on `gold-ink`, hover `gold-hover`, active
`scale(.97)`); the nav's "Open the globe" is a glass pill. The page closes with a mono label, "Pick
any frame." and one gold pill, then a footer with three auto-fit columns (identity, six links,
"Role: Source" credits) and the picture credits line.

### Landing motion

- **Smooth scroll:** Lenis (`lerp: .1`) driven from `gsap.ticker`, feeding ScrollTrigger.
- **Story:** one GSAP timeline scrubbed by the 520vh story section (`scrub: .6`); it tweens a
  `controls` object (view offset, camera distance, planet rotation, orbit opacity, drift, callout)
  that `EarthHero` reads every frame, so scrolling never re-renders React. The callout is moved
  with `style.transform` from a per-frame callback.
- **Sections:** entrances with `gsap.from` (y 28, opacity 0, `power3.out`, stagger .08, once at
  `top 78%`), so nothing stays hidden if JS fails. Compare slides 92 → 50 once; the pipeline bar
  and steps fill with the scroll; events slide sideways in a 300vh pinned section; the mission
  picture has a gentle parallax.
- **Easing:** `power3.out` for entrances, `power2.inOut` for camera moves,
  `cubic-bezier(.22,1,.36,1)` and 160 ms for CSS hovers.
- **Below 40rem** layer C moves above the planet and the callout card sits under the marker; the
  callout card always slides to stay on screen.

### Landing reduced motion

No Lenis, no idle spin, drift or orbit. The story becomes the hero followed by layers A, B and C as
plain sections over a static globe (clouds at .35, no callout); compare starts at 50; events become
a native horizontal scroll. This is the layout the E2E tests see.

## Explorer behaviour

- **Real data only for geometry:** frame polygons come from `public/data/frames.json` (the
  Observation Plan snapshot) and passes from the live Observation Plan API. Only the analysis on
  top is demo until the pipeline serves it.
- **Modes:** the intro shows on a first visit (remembered in localStorage); a shared link
  (`?event=`, `?frame=`) skips it and opens in explore mode. Frames answer the pointer and event
  markers show only in explore mode. The tour steps with ←/→ and hands over to explore after the
  last event. Esc closes the panel and zooms out.
- **Camera:** arrives from deep space (2.4 s, quartic out), spins slowly until the first touch,
  flies 1.8 s to a frame and then to the analysis area; instant with reduced motion.

## Do's and Don'ts

### Do

- Keep colour for data and the gold accent; keep chrome ink on deep blue.
- Label anything simulated with the **Demo data** / **Demo values** chip.
- Design every async view's states: loading (shimmer, still under reduced motion), error with a
  retry, empty, success.
- Put shareable state in the URL (`?event=`, `?frame=`, `?hazard=`).
- Respect `prefers-reduced-motion`: no idle spin, instant camera flights, no smooth scroll.
- Give the camera room for the cards when framing an area.

### Don't

- Don't use hazard colours for buttons, links or decoration.
- Don't show a number without its unit and source (ha, cm, dB; which passes).
- Don't add a third font or Title Case.
- Don't hide data behind hover only: the events list is the keyboard path into the globe.
- Don't present demo results or validation figures as real.

## Responsive Behavior

### Breakpoints

Built desktop-first for judging and demos (1280–1920 px). Content pages reflow down to 390 px.
Below 48rem the explorer drops the mode switch, the bottom card spans the width and the panel
covers the screen when open.

### Touch Targets

Buttons are at least ~36 px high; `touch-action: manipulation` on controls; pinch zooms the globe.

### Image Behavior

Data layers are draped over their lon/lat bounds on the globe and scale with it.

## Iteration Guide

1. Start from an existing component (`SegmentedControl`, glass card, `MapLegend`, `MethodDetails`) before
   creating a new one.
2. A new hazard only adds an entry in `hazards.ts` (label, colours, copy); the UI must not change.
3. Check focus, reduced motion and every async state before calling a screen done.
4. Verify in the browser with screenshots at 1440×900, not just in code.

## Landing page checks

Before shipping a landing change: no headline over two lines at 1440, 768 and 390 px; contrast at
least 4.5:1 (text over the planet keeps its shadow); every section has a heading; type from the
landing scale; the story checked at several scroll points; real pictures (NASA public domain, and
the HLS/Sentinel-2 optical frame), credited in the footer; motion uses transform and opacity only and stops under
`prefers-reduced-motion`. Component classes must win over base styles: base resets in
`site.css` use `:where()` for zero specificity.

## Known Gaps

- The explorer on a phone works but is not designed: the panel should become a bottom sheet.
- The globe has no keyboard way to pick an arbitrary frame (only featured events); a
  "go to track/frame" search would close it.
- UI copy is English only.
