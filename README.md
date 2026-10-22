# globe-ui

3D globe for the NASA Space Apps 2026 NISAR challenge. Hover the globe to find a NISAR radar frame,
click it to see its satellite passes and burn analysis.

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

Share a frame with `?frame=<track>-<frame>`, e.g. http://localhost:5173/?frame=47-3

See [CLAUDE.md](./CLAUDE.md) for the stack, data sources, conventions and tests.
