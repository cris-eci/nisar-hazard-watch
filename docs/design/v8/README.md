# design_handoff_v8 · Explorer v8 (states v2)

For Claude Code. Build the Explorer v8 from **states v2** (the didactic version the team chose). Landing, Cases and Method stay at v7 (only the Chocó card in Cases reads "Coherence only").

Read in this order
1. `SPECS-v8.md` — what changes from v7, screen by screen, with the data each element needs, motion (§9), Nova (§10), icon (§11).
2. `COPY-v8.md` — every visible string, verbatim. Don't write new copy.
3. `DATA_PROVENANCE-v8.md` — what is REAL, DEMO DATA, TO FILL or HYPOTHESIS, and what replaces it.
4. `ISSUES-for-Daniel.md` — backend asks; until each ships, keep its chip.
5. `brand/README.md` — Meridian icon install.
6. `reference/` — design files. Open `Explorer v8 States v2.dc.html` in a browser to see every state at 1440 and 390 px. They are references; rebuild as React components in `src/`, reusing v7 tokens and components.

Also read `design_handoff_v7/SPECS.md` for tokens, type and the components v8 keeps.

Non-negotiables
- Fixed −30…0 dB gray for HH/HV everywhere; change −8…+8 dB diverging; coherence cividis 0–1.
- Only measured dates on the timeline.
- "N of M analysis cells", never hectares or probabilities.
- Possible drivers always carry HYPOTHESIS · NOT A RESULT and cite returned numbers.
- All motion respects prefers-reduced-motion.
