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
- **Explorer (`/explore`)**: the app, described below.

The app is a **mission-control look over a real planet**. The globe is the hero and fills the screen; every
control floats above it on dark, translucent cards. Colour is reserved for **data**: the UI chrome
stays neutral slate so burn scars, flood extents and interferogram fringes are the brightest thing
on screen.

Three words: **calm, scientific, legible**. Nothing should look like a marketing page except the
landing hero.

### Direction: one system for landing and app

The landing v4 sets the system the explorer will move to: Albert Sans everywhere, JetBrains Mono
for data labels, the gold accent in place of `sky-500`, pill buttons and glass panels. **The
landing and method pages implement it** through `src/pages/site/` (`site.css` holds the tokens,
type, pills, chips, nav and footer as `s-*` classes; `SiteNav.tsx`; `siteMotion.ts` for smooth
scroll and section entrances). Each page keeps only its layout (`l-*`, `m-*`). The explorer keeps
the tokens below (General Sans, sky, slate) until its redesign lands; don't mix the two inside one
page before then.

## Colors

All colours are Tailwind tokens; hex values are given for exports and image rendering.

### Brand & Accent

| Role            | Token                       | Hex       | Use                                                                                |
| --------------- | --------------------------- | --------- | ---------------------------------------------------------------------------------- |
| Primary action  | `sky-500` / hover `sky-400` | `#0ea5e9` | The single main button per view (Launch the explorer, Start with a featured event) |
| Links and focus | `sky-300` / `sky-400`       | `#7dd3fc` | Inline links, focus ring                                                           |

### Surface

| Role                                          | Token                            | Hex       |
| --------------------------------------------- | -------------------------------- | --------- |
| Page background                               | `slate-950`                      | `#020617` |
| Floating card                                 | `slate-950/85` + `backdrop-blur` |           |
| Card border                                   | `white/10` (hover `white/30`)    |           |
| Inset surface (event banner, segmented track) | `white/5`                        |           |
| Selected segment                              | `white/10`                       |           |

### Text

| Role                     | Token                     |
| ------------------------ | ------------------------- |
| Primary                  | `slate-100`               |
| Secondary, body on cards | `slate-300` / `slate-400` |
| Captions, labels, hints  | `slate-500`               |

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

| Status                       | Token                                                        |
| ---------------------------- | ------------------------------------------------------------ |
| Demo data badge, demo values | `amber-500/20` background, `amber-300` text                  |
| Error                        | `red-500/30` border, `red-500/10` background, `red-300` text |
| HH+HV badge                  | `sky-500/20` background, `sky-300` text                      |
| HH only badge                | `slate-500/20` background, `slate-400` text                  |
| Selected frame outline       | `#f97316`; hovered frame `#e2e8f0`                           |

## Typography

### Font Family

**General Sans** (Fontshare) everywhere in the app, falling back to `system-ui`, `sans-serif`. The
landing page loads its pair from Google Fonts in `site/site.css`: **Albert Sans** 300/400/500/600 for
all text, and **JetBrains Mono** 400/500 for data labels only (uppercase, letter-spacing
0.04–0.06em, 11–13 px).

### Hierarchy

| Element             | Classes                                          |
| ------------------- | ------------------------------------------------ |
| Page title          | `text-4xl`                                       |
| Section title       | `text-2xl`                                       |
| Card / panel title  | `text-lg`                                        |
| Card section title  | `text-sm text-slate-300`                         |
| Key figure (ha, cm) | `text-3xl tabular-nums`                          |
| Body                | `text-sm` on cards, `text-lg` for landing leads  |
| Overline labels     | `text-xs uppercase tracking-wide text-slate-500` |

### Landing scale

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

### Landing colours

| Token      | Value                                   | Use                                                  |
| ---------- | --------------------------------------- | ---------------------------------------------------- |
| `space`    | `#04070e`                               | Page background                                      |
| `deep`     | `#08101f`                               | Image wells, panels                                  |
| `night`    | `#0e1930`                               | Inset surfaces                                       |
| `ink`      | `#ebe9e4`                               | Primary text                                         |
| `ink-2`    | `#d4d2cc`                               | Secondary text on images                             |
| `muted`    | `#a9a69e`                               | Secondary body, captions                             |
| `gold`     | `#c9b48b` (hover `#dccaa3`)             | The only accent: actions, key figures, orbit, marker |
| `gold-ink` | `#16120a`                               | Text on gold                                         |
| `demo`     | `#fcd34d`                               | DEMO DATA labels                                     |
| `hairline` | `rgba(235,233,228,.10–.12)`             | Borders, the pipeline rail                           |
| `glass`    | `rgba(8,16,31,.72–.80)` + blur 16–20 px | Nav pill, callouts                                   |

### Principles

- **App: regular weight only.** Hierarchy comes from size and colour, not bold. The landing uses
  500 for headings and actions, 600 for the wordmark, and 300 only for the "12" counter.
- **Sentence case** for headings, buttons and labels ("Burn analysis", "Launch the explorer").
  This is deliberate and consistent; do not mix in Title Case.
- `tabular-nums` on every number that changes or is compared (areas, centimetres, dates).
- Headings use `text-wrap: balance` (global).
- `…` for ellipses and loading text ("Loading NISAR frames…").
- Dates are ISO `YYYY-MM-DD`: scientific audience, unambiguous across countries.

## Layout

### Spacing System

Tailwind's 4 px scale. Cards use `p-4` (controls) or `p-5` (details panel); stacked blocks inside a
card use `mt-1` (tight label/value), `mt-3` (related), `mt-4`/`gap-5` (sections).

### Grid & Container

- **Explorer:** full-screen globe. Left control card `w-80` (top-4, left-4), right details panel
  `w-96` (top-4, right-4, bottom-4), map buttons bottom-left, _Did you know?_ bottom-right.
- **Content pages:** centred `max-w-6xl` (landing) or `max-w-5xl` (method), `px-6`, sections
  `py-16`, card grids `md:grid-cols-2` / `md:grid-cols-3` with `gap-4`.

### Whitespace Philosophy

The globe needs room to breathe: never add a third floating card. The camera leaves space on both
sides for the cards when it flies to a frame (`paddedRectangle`).

## Elevation & Depth

| Level | Use                       | Style                                                                    |
| ----- | ------------------------- | ------------------------------------------------------------------------ |
| 0     | Globe                     | Full bleed                                                               |
| 1     | Floating cards and panels | `bg-slate-950/85 backdrop-blur border-white/10 shadow-2xl rounded-xl`    |
| 2     | Tooltip, fact card        | `bg-slate-950/85–90 shadow-lg/xl`                                        |
| 3     | Modal dialog              | Native `<dialog>`, `bg-slate-950`, `backdrop:bg-black/60`, `rounded-2xl` |

### Decorative Depth

In the app, nothing gets gradients, glows or glass beyond the card blur. The landing's depth lives
mostly in the WebGL scene (Earth's Fresnel atmosphere, a soft blue halo, a starfield, NISAR's gold
orbit). On the page itself it allows exactly these: a text shadow on text over the planet or a
photo, a bottom gradient on event cards, glass on the nav pill, callout and image chips, and a soft
gold ring on the epicentre marker.

## Shapes

### Border Radius Scale

| Radius         | Use                                             |
| -------------- | ----------------------------------------------- |
| `rounded`      | Badges                                          |
| `rounded-md`   | Small buttons, list rows, segments              |
| `rounded-lg`   | Buttons, inner cards, segmented track           |
| `rounded-xl`   | Floating cards, content cards                   |
| `rounded-2xl`  | Dialog                                          |
| `rounded-full` | Pills (_Did you know?_), severity bars, legends |

### Photography & Illustrations

No stock imagery or illustrations. The only images are Earth itself (Esri imagery) and data layers.

## Components

### Top Navigation

Content pages: app name left (link home), text links right (`text-sm text-slate-300`, hover
white), optional primary button. The explorer has no top bar; its title lives in the control card.

### Buttons

- **Primary:** `rounded-lg bg-sky-500 px-4–6 py-2–3 text-slate-950 hover:bg-sky-400`. One per view.
- **Secondary:** `rounded-lg border border-white/20 px-4 py-2 hover:border-white/40`.
- **Map button:** floating card style, `text-sm`.
- **Text button:** `underline` or `text-sky-300 hover:underline` for retry and inline actions.
- Every icon-only button has an `aria-label`.

### Cards & Containers

Floating card (level 1) on the globe; `bg-white/[0.03] border-white/10 rounded-xl p-5–6` on content
pages. Inset blocks inside a card use `bg-white/5 rounded-lg p-3`.

### Inputs & Forms

Only the dialog checkbox today: native control wrapped in its `<label>`.

### Tags / Badges

`rounded px-1.5 py-0.5 text-xs` with a 20 % tint background and a 300-level text colour (see
Status). On the landing, data labels are JetBrains Mono chips (`rgba(4,7,14,.6)` + blur, radius 999)
and the callout's DEMO DATA label is mono in `#fcd34d`.

### Tab / Filter

`SegmentedControl`: `role="group"` with `aria-pressed` buttons on a `bg-white/5` track; selected is
`bg-white/10 text-slate-100`. More than three options wrap into a two-column grid.

### CTA / Footer

Landing: gold pill buttons (radius 999, `gold` on `gold-ink`, hover `gold-hover`, active
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

## Do's and Don'ts

### Do

- Keep colour for data; keep chrome slate.
- Label anything simulated with the amber **Demo data** / **Demo values** badge.
- Design every async view's states: loading (skeleton, `motion-safe:animate-pulse`), error with a
  retry, empty, success.
- Put shareable state in the URL (`?event=`, `?frame=`, `?hazard=`).
- Respect `prefers-reduced-motion`: no idle spin, instant camera flights.
- Give the camera room for the cards when framing an area.

### Don't

- Don't use hazard colours for buttons, links or decoration.
- Don't show a number without its unit and source (ha, cm, dB; which passes).
- Don't add bold weights, a second font, or Title Case in the app (the landing's type is above).
- Don't hide data behind hover only: the events list is the keyboard path into the globe.
- Don't present demo results or validation figures as real.

## Responsive Behavior

### Breakpoints

Built desktop-first for judging and demos (1280–1920 px). Content pages reflow at `sm` and `md`.

### Touch Targets

Buttons are at least ~36 px high; `touch-action: manipulation` on controls; pinch zooms the globe.

### Collapsing Strategy

The details panel caps at `max-w-[calc(100vw-2rem)]`. Below ~900 px the two explorer cards overlap
the globe: see Known Gaps.

### Image Behavior

Data layers are draped over their lon/lat bounds on the globe and scale with it; no `<img>` tags.

## Iteration Guide

1. Start from an existing component (`SegmentedControl`, floating card, `MethodDetails`) before
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

- No mobile layout for the explorer: on narrow screens the control card and details panel should
  become bottom sheets.
- The globe has no keyboard way to pick an arbitrary frame (only featured events); a
  "go to track/frame" search would close it.
- UI copy is English only.
