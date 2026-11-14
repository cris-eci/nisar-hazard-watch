import { STEP_4 } from "@/content/copyV8";
import type { TimelinePass } from "@/features/cases/cases";
import {
  changeLayer,
  defaultLayerId,
  isPassLayerId,
  passLayer,
  type LiveLayer,
  type Pol,
} from "@/features/explore/exploreLayers";
import { ruleLayerOf } from "@/features/lenses/flood";

/*
 * What the v8 layer dock offers for one live answer and one selected pass (SPECS-v8 §4). Pure: the
 * dock, the thumbnails, the globe and the time-lapse all read the same answers from here.
 */

// A channel of the selected pass, any other layer by id, or nothing on the globe.
export type DockPick = { kind: "pass"; pol: Pol } | { kind: "layer"; id: string } | undefined;

export type DockRowKey = "hh" | "hv" | "change" | "rule" | "coherence" | "landCover";

export type DockRow = {
  key: DockRowKey;
  label: string;
  enabled: boolean;
  on: boolean;
  // What a click does: show a layer, open the ground-motion pair picker (decision 2), or nothing.
  action: { kind: "pass"; pol: Pol } | { kind: "layer"; id: string } | { kind: "pair" } | undefined;
  why?: string;
  chip?: "noPair" | "todo";
};

const PASS_PARTS = /^display_(\d{4}-\d{2}-\d{2})_(HH|HV)$/;

const passOfId = (id: string): { date: string; pol: Pol } | undefined => {
  const match = PASS_PARTS.exec(id);
  const date = match?.[1];
  const pol = match?.[2];
  return date !== undefined && (pol === "HH" || pol === "HV") ? { date, pol } : undefined;
};

const coherenceLayer = (layers: LiveLayer[]): LiveLayer | undefined =>
  layers.find((layer) => layer.kind === "coherence");

export const measuredPasses = (passes: TimelinePass[]): TimelinePass[] =>
  passes.filter((item) => item.kind !== "plan");

// The layer the globe shows; a pass with no image for the channel shows nothing, never another date.
export const shownLayer = (
  layers: LiveLayer[],
  pick: DockPick,
  date: string | undefined,
): LiveLayer | undefined => {
  if (pick === undefined) return undefined;
  if (pick.kind === "layer") return layers.find((layer) => layer.id === pick.id);
  return date === undefined ? undefined : passLayer(layers, date, pick.pol);
};

const isPicked = (pick: DockPick, id: string | undefined): boolean =>
  pick?.kind === "layer" && id !== undefined && pick.id === id;

export const dockRows = (
  layers: LiveLayer[],
  date: string | undefined,
  pick: DockPick,
): DockRow[] => {
  const passRow = (key: "hh" | "hv", pol: Pol, label: string): DockRow => {
    const image = date === undefined ? undefined : passLayer(layers, date, pol);
    return {
      key,
      label,
      enabled: image !== undefined,
      // The channel stays chosen across passes, but a row with no image never reads as on.
      on: image !== undefined && pick?.kind === "pass" && pick.pol === pol,
      action: image === undefined ? undefined : { kind: "pass", pol },
      ...(image === undefined && { why: STEP_4.noPassImage(pol) }),
    };
  };
  const layerRow = (
    key: "change" | "rule",
    label: string,
    layer: LiveLayer | undefined,
  ): DockRow => ({
    key,
    label,
    enabled: layer !== undefined,
    on: isPicked(pick, layer?.id),
    action: layer === undefined ? undefined : { kind: "layer", id: layer.id },
  });
  const coherence = coherenceLayer(layers);
  return [
    passRow("hh", "HH", STEP_4.dockHH),
    passRow("hv", "HV", STEP_4.dockHV),
    layerRow("change", STEP_4.dockChange, changeLayer(layers)),
    layerRow("rule", STEP_4.dockRule, ruleLayerOf(layers)),
    coherence === undefined
      ? {
          key: "coherence",
          label: STEP_4.dockCoherence,
          enabled: true,
          on: false,
          action: { kind: "pair" },
          chip: "noPair",
        }
      : {
          key: "coherence",
          label: STEP_4.dockCoherence,
          enabled: true,
          on: isPicked(pick, coherence.id),
          action: { kind: "layer", id: coherence.id },
        },
    {
      key: "landCover",
      label: STEP_4.dockLandCover,
      enabled: false,
      on: false,
      action: undefined,
      chip: "todo",
    },
  ];
};

// Decision 9: every layer the rows don't cover stays listed under them.
export const otherLayers = (layers: LiveLayer[]): LiveLayer[] => {
  const used = new Set(
    [changeLayer(layers), ruleLayerOf(layers), coherenceLayer(layers)].map((layer) => layer?.id),
  );
  return layers.filter((layer) => !isPassLayerId(layer.id) && !used.has(layer.id));
};

export type DockView = { pick: DockPick; date: string | undefined };

// The target's HH, else the newest pass with an HH image, else the older default layer.
export const defaultView = (layers: LiveLayer[], passes: TimelinePass[]): DockView => {
  const measured = measuredPasses(passes);
  const target = measured.find((item) => item.kind === "target");
  const withHH = [...(target === undefined ? [] : [target]), ...measured.toReversed()].find(
    (item) => passLayer(layers, item.date, "HH") !== undefined,
  );
  if (withHH !== undefined) return { pick: { kind: "pass", pol: "HH" }, date: withHH.date };
  const fallbackDate = target?.date ?? measured.at(-1)?.date;
  const id = defaultLayerId(layers);
  if (id === undefined) return { pick: undefined, date: fallbackDate };
  const pass = passOfId(id);
  return pass === undefined
    ? { pick: { kind: "layer", id }, date: fallbackDate }
    : { pick: { kind: "pass", pol: pass.pol }, date: pass.date };
};

export type TimeLapseStep = {
  date: string;
  // Undefined: this pass has no image for the channel, so the step shows no overlay.
  layerId: string | undefined;
  role: "BASELINE" | "TARGET" | undefined;
  k: number;
  n: number;
};

export const timeLapseSteps = (
  passes: TimelinePass[],
  layers: LiveLayer[],
  pol: Pol,
): TimeLapseStep[] => {
  const measured = measuredPasses(passes);
  return measured.map((item, index) => ({
    date: item.date,
    layerId: passLayer(layers, item.date, pol)?.id,
    role: item.kind === "target" ? "TARGET" : item.kind === "base" ? "BASELINE" : undefined,
    k: index + 1,
    n: measured.length,
  }));
};

// Play starts at pass 1, or at the current pass when it isn't the last one.
export const playStart = (current: number, n: number): number =>
  current < 0 || current >= n - 1 ? 0 : current;

// The time-lapse stops on the last pass instead of looping.
export const nextStep = (index: number, n: number): number | undefined =>
  index + 1 < n ? index + 1 : undefined;
