import type { BBox } from "@/features/frames/frame.types";

// An image the globe drapes over a lon/lat rectangle.
export type GlobeOverlay = { url: string; bounds: BBox };
