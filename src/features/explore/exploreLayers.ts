import type { BBox } from "@/features/frames/frame.types";
import type { ExplorationLayer, ExplorationView } from "@/features/explore/exploreSchemas";
import { absoluteApiPath } from "@/lib/api/apiClient";

export type LiveLayer = {
  id: string;
  title: string;
  kind: "observed" | "diagnostic" | "change" | "coherence" | "phase" | "layer";
  units: string;
  legend: Record<string, string> | null;
  valueRange: [number, number] | null;
  colormap: string;
  // Fetchable from this origin: the backend redirects it to the image.
  href: string;
  bounds: BBox;
};

const KINDS = ["observed", "diagnostic", "change", "coherence", "phase"] as const;

const kindOf = (kind: string): LiveLayer["kind"] =>
  (KINDS as readonly string[]).includes(kind) ? (kind as LiveLayer["kind"]) : "layer";

const toLayer = (layer: ExplorationLayer): LiveLayer => ({
  id: layer.id,
  title: layer.title,
  kind: kindOf(layer.kind),
  units: layer.units,
  legend: layer.legend,
  valueRange: layer.valueRange,
  colormap: layer.colormap,
  href: absoluteApiPath(layer.url),
  bounds: layer.bounds,
});

export const liveLayers = (view: ExplorationView): LiveLayer[] =>
  view.result?.layers.map(toLayer) ?? [];

// What the globe shows first: a change map or a diagnostic flag layer, else the newest measured pass.
export const defaultLayerId = (layers: LiveLayer[]): string | undefined =>
  (
    layers.find((layer) => layer.kind === "change") ??
    layers.find((layer) => layer.kind === "coherence") ??
    layers.find((layer) => layer.kind === "diagnostic") ??
    layers.findLast((layer) => layer.kind === "observed") ??
    layers[0]
  )?.id;

export const LAYER_GROUPS: Array<{ kind: LiveLayer["kind"]; label: string }> = [
  { kind: "change", label: "Change" },
  { kind: "diagnostic", label: "Diagnostic" },
  { kind: "coherence", label: "Coherence" },
  { kind: "phase", label: "Wrapped phase" },
  { kind: "observed", label: "Measured passes" },
  { kind: "layer", label: "Other" },
];

// "display_flood_signature_flags_co_pol_brightening" reads better without its prefix.
export const layerTitle = (layer: LiveLayer): string =>
  layer.title.replace(/^display /, "").replaceAll("_", " ");
