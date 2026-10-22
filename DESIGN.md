# DESIGN.md: NISAR Hazard Watch

The visual system of the app. Read this before building or changing any UI, so screens made by
different people (and agents) look like one product.

## Overview

Two surfaces share one product:

- **Landing page (`/`)**: **dressed as a film**. A title card over a 3D Earth with its atmosphere
  and a starfield, one figure owning a screen ("12 days"), the optical/radar comparison on one
  widescreen frame, the pipeline printed as a call sheet, end credits for the data sources and a
  ticket as the closing call to action. Mood: elegant, quiet, cinematic; deep space blacks and
  blues, champagne gold used sparingly. Its own tokens live in `src/pages/landing/landing.css`. The
  one glow is Earth's atmosphere, drawn in WebGL (`EarthHero.tsx`); no CSS gradients, thin rules,
  shadows at rest, glass, eyebrows, emoji or accent words in headlines.
- **Explorer (`/explore`) and Method (`/method`)**: the app, described below.

The app is a **mission-control look over a real planet**. The globe is the hero and fills the screen; every
control floats above it on dark, translucent cards. Colour is reserved for **data**: the UI chrome
stays neutral slate so burn scars, flood extents and interferogram fringes are the brightest thing
on screen.

Three words: **calm, scientific, legible**. Nothing should look like a marketing page except the
landing hero.

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
landing page has its own pair, loaded from Google Fonts in `landing.css`: **Imbue** (condensed
high-contrast serif, uppercase, for titles and the big figures) and **Albert Sans** (text).

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

Five steps, defined in `landing.css`: display (`--step-display`, Imbue uppercase, leading 0.86),
head (`--step-head`, Imbue uppercase), lead, body (17–19 px, Albert Sans, leading 1.55) and small
(14 px). Headlines never run past two lines at any width. Outside the scale on purpose: the "12"
figure, the Optical/Radar switch and the footer's full-width title.

### Landing colours

Space `#04070e` ground, with `#08101f` (deep) and `#0e1930` (night) as whole-field steps; starlight
ink `#ebe9e4`, muted `#a9a69e`. Champagne gold `#c9b48b` is the only accent: buttons, the pressed
switch, the "12" figure, hovered events and the footer title. Paper `#dcdad4` with ink `#12151c`
for the call sheet and the ticket. Each section keeps to one ground.

### Principles

- **App: regular weight only.** Hierarchy comes from size and colour, not bold. The landing page's
  display face (Imbue) carries hierarchy by size and case, also at weight 400.
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

Only the landing hero has decoration, and it lives in the WebGL scene: Earth's Fresnel atmosphere,
a soft blue halo behind the planet and a starfield. Nothing else gets gradients, glows or glass
beyond the card blur.

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
Status). The landing page has no badges.

### Tab / Filter

`SegmentedControl`: `role="group"` with `aria-pressed` buttons on a `bg-white/5` track; selected is
`bg-white/10 text-slate-100`. More than three options wrap into a two-column grid.

### CTA / Footer

Landing ends with end credits (role and source, centred, each source linked), a ticket card with
the "Open the globe" bar, and a footer whose title runs the full width in gold, then links and the
picture credits. Landing buttons are square.

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
- Don't add bold weights, a second font, or Title Case.
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
least 4.5:1; every section has a heading; five type sizes; real pictures (NASA public domain, and
the HLS/Sentinel-2 optical frame), credited in the footer; motion uses transform and opacity only and stops under
`prefers-reduced-motion`. Component classes must win over base styles: base resets in
`landing.css` use `:where()` for zero specificity.

## Known Gaps

- No mobile layout for the explorer: on narrow screens the control card and details panel should
  become bottom sheets.
- The globe has no keyboard way to pick an arbitrary frame (only featured events); a
  "go to track/frame" search would close it.
- UI copy is English only.
