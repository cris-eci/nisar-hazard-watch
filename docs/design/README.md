# Design handoffs

The specs every frontend issue labelled `v8` builds from. Read them before writing UI.

| Folder | What |
|---|---|
| `v8/` | **Explorer v8, states v2** (the didactic version the team chose). Start with `v8/README.md`, then `SPECS-v8.md` (what changes, screen by screen, and the data each element needs), `COPY-v8.md` (every visible string, use verbatim) and `DATA_PROVENANCE-v8.md` (which chip each value carries until its data ships). `reference/` holds the design files and their shared content (`v8-data.js` has the facts carousel and the error copy). |
| `v7/` | The v7 specs v8 builds on: tokens, type, glass cards, band chart, contrast bars, pass timeline, provenance chips. Where v8 says "as in v7", this is the file. `DESIGN.md` at the repo root describes v7 as built. |

The handoff files are kept verbatim (Prettier skips `docs/design`). The `.dc.html` files are design
references, not code: they need the design tool's `support.js`, which isn't included, so read their
markup and the specs rather than opening them. Rebuild everything as React components in `src/`,
reusing the v7 tokens and components.

## Where the product differs from the handoff

The handoff was drawn against the science API (`/v2`) before the live pipeline existed. These team
decisions win over the handoff:

1. **One API path.** The frontend talks only to the backend (`/api/v1`, Railway). Every `/v2` field the
   specs name is relayed by the backend; ask in the backend repo when one is missing.
2. **Ground motion.** The InSAR pair measurement stays, presented the v8 way: no lens button; the dock's
   Coherence row opens the pair picker; coherence 0–1, cividis; never centimetres.
3. **Area tools stay.** Point, rectangle and polygon remain, restyled to v8 (dashed gold footprint, dark
   border on light ground).
4. **No L | S switch.** Ascending / Descending takes its place; S-band is out of scope.
5. **Lens before the job, for now.** "Analyze this spot" runs the selected lens and the raw passes come
   with the answer; switching lens is a new short wait (as step 5 already shows).
6. **Wildfire's second witness is NASA FIRMS**, in the place of the OPERA section.
7. **Possible drivers** ship for flood only, always with HYPOTHESIS · NOT A RESULT; other lenses wait for
   their thresholds.
8. **Limits come from the backend.** Never hardcode a daily number (the handoff was drawn for 12/day).
