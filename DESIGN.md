# DESIGN.md: NISAR Hazard Watch

The visual system of the app as built for **design v7**. Read this before building or changing any
UI, so screens made by different people (and agents) look like one product. The full spec is the
design handoff (`design_handoff_v7/SPECS.md`, next to this repo); where this file and the code
disagree, the code is current and this file should be fixed.

## Overview

v7 is a **radar evidence explorer**, not a hazard detector. Every answer has the same five beats:
the question → the measurement → the verdict in plain words → the second witness → what this
can't tell you. Three words: **calm, scientific, honest**. Colour is reserved for **data** and the
one gold accent; chrome stays ink on deep blue.

| Page       | Layout file                       | Prefix | What it is                                                                                                                                               |
| ---------- | --------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`        | `src/pages/landing/landing.css`   | `l-`   | Scroll story over a fixed three.js Earth, compare slider, pipeline, cases carousel, "where it fails", data sources, mission, close                       |
| `/explore` | `src/pages/explorer/explorer.css` | `x-`   | Full-screen Cesium globe with glass cards: start card, case panel, layer dock, pass timeline, "More information" sheet                                   |
| `/cases`   | `src/pages/cases/cases.css`       | `k-`   | The measured cases as cards, filtered by question, plus the five-hazard icon row                                                                         |
| `/method`  | `src/pages/method/method.css`     | `m-`   | Satellite teardown, Qadirabad scroll sequence, six steps, band chart in three states, lenses, works / fails, experimental models, landslides, colour key |
| `/about`   | `src/pages/about/about.css`       | `a-`   | Crew orbit round the team logo, crew manifest, project links                                                                                             |

### One system

Content pages share `src/pages/site/`: `site.css` holds the tokens, type scale, buttons, chips,
nav and footer (`s-*`); `SiteNav.tsx`, `SiteFooter.tsx`, `siteMotion.ts`. Charts and provenance
chips are shared by every page in `src/features/charts/charts.css` (`c-*`). Each page keeps only
its own layout under its prefix. Tailwind stays available for one-off utilities; new UI uses the
tokens below.

## Colours

### Chrome tokens

On `.site` in `site/site.css`; the explorer adds its own on `.explorer` in `explorer.css`.

| Token        | Value                                                         | Use                                                                |
| ------------ | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| `--space`    | `#04070e`                                                     | Page background                                                    |
| `--deep`     | `#08101f`                                                     | Image wells, panels                                                |
| `--night`    | `#0e1930`                                                     | Inset surfaces                                                     |
| `--ink`      | `#ebe9e4`                                                     | Primary text; picked segment; explorer primary button              |
| `--ink-2`    | `#d4d2cc`                                                     | Secondary text on panels                                           |
| `--ink-3`    | `#c4c1ba`                                                     | Explorer tertiary text                                             |
| `--muted`    | `#a9a69e`                                                     | Captions, mono labels, planned passes                              |
| `--faint`    | `#8d8a83`                                                     | Explorer keys and meta                                             |
| `--fainter`  | `#6f6c66`                                                     | Explorer month ticks, least important text                         |
| `--gold`     | `#c9b48b` (hover `--gold-hover` `#dccaa3`)                    | The only accent: actions, selection, target pass, baseline bracket |
| `--gold-ink` | `#16120a`                                                     | Text on gold                                                       |
| `--hairline` | `rgba(235,233,228,.12)`                                       | Borders, dividers (explorer `--line`)                              |
| `--glass`    | `rgba(8,16,31,.78)` (explorer `--glass-bg` `.9`) + blur 20 px | Nav, explorer cards                                                |

### Data scales (never in chrome)

From SPECS §6; each lives next to the component that draws it.

| Scale                              | Values                                                                                                                               | Where in code                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Channels                           | HH `#e8894a` solid line, circle markers; HV `#6fb3e8` dashed `6 4`, square markers                                                   | `src/features/charts/chartTokens.ts` (`CHANNEL`)         |
| Signed dB change                   | −8 `#2f6db5` → 0 `#f2f0eb` → +8 `#c2473a`                                                                                            | `LayerDock.tsx`, `MoreInfoSheet.tsx`, `methodContent.ts` |
| Baseline backscatter               | viridis −30…0 dB `#440154 #3b528b #21918c #5ec962 #fde725`                                                                           | same                                                     |
| HH − HV                            | 2 dB `#1f8a80` → 7 `#f2f0eb` → 12 dB `#7b4fae`                                                                                       | `methodContent.ts` (colour key)                          |
| Optical classes (OPERA, Okabe–Ito) | new water `#0072b2` · stable water `#56b4e9` · stayed dry `#a8997a` · water loss `#e69f00` · mixed `#cc79a7` · unsupported `#62666d` | `src/features/cases/cases.ts` (`OPTICAL`)                |
| No measurement                     | `#62666d` (hatch `#54585f`). **Never white.**                                                                                        | everywhere a gap is drawn                                |

### Provenance chips

`src/lib/ProvenanceChip.tsx`, classes `c-prov--real | --demo | --todo`, mono 9.5 px uppercase pills.

| Chip    | Style                                             | Rule                                      |
| ------- | ------------------------------------------------- | ----------------------------------------- |
| Real    | transparent, `rgba(235,233,228,.35)` border       | Can be hidden (Help → "Show REAL labels") |
| Demo    | `rgba(245,158,11,.18)` fill, `#fcd34d` text       | Always visible                            |
| To fill | dashed `rgba(235,233,228,.45)` border, muted text | Always visible                            |

The chip's `title` holds its source, so anyone can check a number on hover.

## Typography

**Albert Sans** 300/400/500/600 for text and **JetBrains Mono** 400/500 for numbers, dates, units
and kickers, both from Google Fonts in `site/site.css`.

| Step        | Size (site.css)                                            | Weight / tracking / leading |
| ----------- | ---------------------------------------------------------- | --------------------------- |
| Display     | `--step-display` `clamp(3.25rem, 1rem + 7vw, 8.5rem)`      | 500 / −0.045em / 0.92       |
| Head        | `--step-head` `clamp(2.5rem, 1.4rem + 3.6vw, 5rem)`        | 500 / −0.035em / 0.98       |
| Title       | `--step-title` `clamp(1.75rem, 1.3rem + 1.2vw, 2.5rem)`    | 500                         |
| Lead        | `--step-lead` `clamp(1.125rem, 1rem + 0.5vw, 1.375rem)`    | 400 / — / 1.45              |
| Body        | `--step-body` `clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)` | 400 / — / 1.55              |
| Small       | `--step-small` 0.875rem                                    | 400                         |
| Mono kicker | 10.5–13 px, letter-spacing 0.05–0.08em, uppercase via CSS  | 400–500                     |

Explorer: panel title 24 px; body 13–15 px; quality-strip key mono 9.5 px, value 12.5 px.

### Principles

- **Sentence case** for headings, buttons and labels. No Title Case.
- Mono labels are written in sentence case in code and uppercased with CSS, so screen readers and
  tests read words.
- `tabular-nums` on every number that changes or is compared.
- Dates read as "26 Jul 2026" in the UI (`formatDay`, `en-GB`, UTC); data stays ISO
  `YYYY-MM-DD`.
- Every number has its unit and source: dB, %, "k of n cells", "80 m grid" / "40 m grid".

## Layout

- **Content pages:** `--margin` `clamp(1rem, 0.5rem + 2vw, 2rem)`, section gaps `--gap-section`,
  image radius `--radius` `clamp(14px, 1.6vw, 28px)`.
- **Explorer** (`--inset` 16 px from the edges): top bar of glass pills (wordmark, case context,
  Guided tour | Explore switch, Cases, Method, Whole globe, Help, Full screen); start card 372 px or
  case panel 360 px on the left; layer dock 256 px on the right; pass timeline at the bottom
  (≤ 680 px); "More information" sheet (radius 28, `rgba(7,13,26,.97)`, blur 24, shadow
  `-30px 0 80px rgba(0,0,0,.45)`) over the globe, leaving a strip of globe visible on the left.
- The globe needs room: the camera frames a case's chip in the free area between the cards.

## Components

### Buttons

- **Content pages:** `s-button`, a gold pill (`--gold` on `--gold-ink`, hover `--gold-hover`,
  active `scale(.97)`), one per view; `s-gold-link` for text actions. The nav's "Open the explorer"
  is a dark pill.
- **Explorer:** `x-primary`, an ink pill (`--ink` background, dark text); `x-ghost`, a hairline
  pill; icon buttons are round glass pills with an `aria-label`.

### Navigation

`SiteNav`: wordmark left; Cases, Method, About and the "Open the explorer" pill right (short label
on phones). The explorer has its own top bar (above). Its "Guided tour" / "Explore" switch starts and leaves
the guided story (`?story=1`).

### Charts (`src/features/charts/`)

- **Band chart** (`BandChart.tsx`, Recharts 3 `ComposedChart`): each channel's normal range as a
  band with dashed edges, HH/HV lines that break at gaps (`connectNulls={false}`), hollow baseline
  dots, a filled target dot, a white ring on out-of-band points, a gold TARGET line. Plain hides the
  axes; Technical adds dB axes, dates and Δ vs median in the glass tooltip. Insufficient data shows
  a dashed overlay with the reason.
- **Contrast bars** (`ContrastBars.tsx`, HTML): shares of a group on a **fixed 0–100% axis**, all
  rows on one subgrid so every track starts at the same x; colour per optical class; "k / n" in
  mono.
- **Matched whisker** (`MatchedWhisker.tsx`): point `#0072b2` with a white ring, interval caps,
  zero tick.
- **Metrics chart** (`MetricsChart.tsx`, Method): fixed 0–1 axis; a missing metric is a dashed
  empty track with "—", never 0; EXPERIMENTAL badge; dashed amber tag on reused dev data.

### Pass timeline (`src/features/timeline/`)

CSS, not Recharts. Measured passes 8 px filled; baseline 10 px hollow gold rings under a gold
"Baseline · n passes" bracket; target 13 px gold with a double ring; planned 11 px dashed
`--muted` after the TODAY line, never clickable; the **next planned pass** gets a brighter 2 px
dashed ring and a "Next" label, and its date sits in the legend. Optical lane: rotated squares.
Tiny bars (6 px wide, ≤ 20 px) for "% outside range". Play steps through measured passes every
900 ms; "Baseline ↔ Target" toggle; a Demo dates chip while dates are spaced.

### Case panel (`src/features/case-panel/`)

Lens chips (`aria-pressed`), verdict glyph + plain line (departure = gold rotated square, within =
ringed circle, insufficient = dashed circle), band chart, contrast bars, a 3-cell quality strip
(values wrap, never inside a date; the why is in the `title`), chips for each block, then "More
information".

### Footer

`SiteFooter`: a Colombian place seen from orbit with a gold marker, headline, team and Space Apps
signature, a place card with its photo credit, link columns, picture credits, the outlined NOVA
FRONTIER wordmark and the non-affiliation notice. Each page picks its own place.

## Motion

- **Content pages:** Lenis smooth scroll driven from `gsap.ticker`, ScrollTrigger reveals (y 28 →
  0, `power3.out`, stagger .08), the landing story scrubbed over a pinned section, the cases
  carousel scrolling sideways, Method's teardown and Qadirabad sequence scrubbed, charts revealed
  with a `clip-path` wipe.
- **Explorer:** camera flights 1.6–2.4 s; the globe spins until the first interaction; UI toggles
  200 ms.
- **Reduced motion** (`prefers-reduced-motion`, or Help → Reduce motion in the explorer): no Lenis,
  no reveals, no spin, instant camera flights; the compare slider starts at 50. E2E runs this way.

## Do's and Don'ts

### Do

- Keep colour for data and the gold accent; chrome stays ink on deep blue.
- Put a Demo chip on every simulated value; keep Demo and To fill chips visible.
- Draw "no measurement" in grey, keep gaps as gaps, use a fixed 0–100% axis for shares.
- Design every async view's states: loading, error with retry, empty, success.
- Put shareable state in the URL (`?case=`, `?frame=`, `?lens=`).

### Don't

- Don't use data colours for buttons, links or decoration.
- Don't show a number without its unit and source.
- Don't present a planned pass, a demo series or a demo verdict as a measurement.
- Don't add a third font or Title Case.
- Don't promise live radar answers while they are a demo.

## Responsive behaviour

Built desktop-first (1280–1920 px); every page works down to 390 px with no horizontal scroll.
Explorer breakpoints: ≤ 1100 px hides the case context pill; ≤ 900 px hides the layer dock; ≤ 760 px
hides the mode switch and page links (they move into the Help menu), docks the start card and
panel to the bottom, hides the pass timeline and turns the sheet into a full page. SPECS §4
proposes a proper mobile bottom sheet for a later round.

## Iteration guide

1. Start from an existing component (charts, `ProvenanceChip`, glass card, quality strip) before
   making a new one.
2. Check focus, reduced motion and every async state before calling a screen done.
3. Verify in the browser with screenshots at 1440 px and 390 px, not just in code.

## Known gaps

- Guided story: chapter 1's areas and people affected and chapter 5's photos and news are TO FILL
  slots. Nova is rule-based (DEMO) until a real model replaces `novaAnswer`.
- HV and HH−HV layers are not drawn until the backend serves them.
- UI copy is English only.
