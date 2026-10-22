import type {
  AnalysisRequest,
  HazardAnalysis,
  HazardId,
  Polarization,
  SeverityHa,
} from "@/features/analysis/analysis.types";
import { mockChangeAnalysis } from "@/features/analysis/mock/mockAnalysis";
import { mockDeformationAnalysis } from "@/features/analysis/mock/mockDeformation";
import type { Frame } from "@/features/frames/frame.types";

// Everything that differs between hazards lives here, so the UI stays hazard-agnostic.
type HazardBase = {
  id: HazardId;
  label: string; // hazard picker
  analysisTitle: string;
  polarization: Polarization;
  requiresCrossPol: boolean; // only compare HH+HV passes
  runDemo: (frame: Frame, request: AnalysisRequest, signal: AbortSignal) => Promise<HazardAnalysis>;
};

export type ChangeHazard = HazardBase & {
  kind: "change";
  affectedLabel: string; // "<area> burned"
  backscatterHint: string; // how to read the before/after images
  severityColors: Record<keyof SeverityHa, string>;
};

export type DeformationHazard = HazardBase & { kind: "deformation" };

export type HazardDefinition = ChangeHazard | DeformationHazard;

const WILDFIRE_COLORS = { low: "#facc15", moderate: "#f97316", high: "#dc2626" };
const FLOOD_COLORS = { low: "#7dd3fc", moderate: "#38bdf8", high: "#2563eb" };
// Soil browns, light enough for the labels to stay readable on the dark panel.
const DEFORESTATION_COLORS = { low: "#e9c46a", moderate: "#d97706", high: "#b45309" };

export const HAZARDS: Record<HazardId, HazardDefinition> = {
  wildfire: {
    kind: "change",
    id: "wildfire",
    label: "Wildfire",
    analysisTitle: "Burn analysis",
    affectedLabel: "burned",
    polarization: "HVHV",
    requiresCrossPol: true,
    backscatterHint: "Dark is smooth or burned ground, bright is dense canopy.",
    severityColors: WILDFIRE_COLORS,
    runDemo: (frame, request, signal) =>
      mockChangeAnalysis(frame, request, signal, {
        polarization: "HVHV",
        colors: WILDFIRE_COLORS,
      }),
  },
  // Off by default: enable with VITE_ENABLED_HAZARDS=wildfire,flood. Open water is smooth and
  // turns dark in HH, so floods can use every pass, not only HH+HV ones.
  flood: {
    kind: "change",
    id: "flood",
    label: "Flood",
    analysisTitle: "Flood analysis",
    affectedLabel: "flooded",
    polarization: "HHHH",
    requiresCrossPol: false,
    backscatterHint: "Dark is open water, bright is vegetation or buildings.",
    severityColors: FLOOD_COLORS,
    runDemo: (frame, request, signal) =>
      mockChangeAnalysis(frame, request, signal, { polarization: "HHHH", colors: FLOOD_COLORS }),
  },
  // Off by default. HV tracks the forest canopy, so clearing shows up as an HV drop like a burn,
  // but slower: compare passes months apart, not weeks.
  deforestation: {
    kind: "change",
    id: "deforestation",
    label: "Deforestation",
    analysisTitle: "Forest loss analysis",
    affectedLabel: "cleared",
    polarization: "HVHV",
    requiresCrossPol: true,
    backscatterHint: "Dark is cleared or bare ground, bright is standing forest.",
    severityColors: DEFORESTATION_COLORS,
    runDemo: (frame, request, signal) =>
      mockChangeAnalysis(frame, request, signal, {
        polarization: "HVHV",
        colors: DEFORESTATION_COLORS,
      }),
  },
  // Ground motion comes from interferograms (GUNW), not backscatter. Any pass works, but the pair
  // must bracket the event, which is why earthquakes are best opened from a featured event.
  earthquake: {
    kind: "deformation",
    id: "earthquake",
    label: "Earthquake",
    analysisTitle: "Ground motion",
    polarization: "HHHH",
    requiresCrossPol: false,
    runDemo: mockDeformationAnalysis,
  },
};

export type EnabledHazards = [HazardDefinition, ...HazardDefinition[]];

const isHazardId = (id: string): id is HazardId => Object.hasOwn(HAZARDS, id);

// Feature flag: VITE_ENABLED_HAZARDS="wildfire,flood". Unknown ids are ignored and an empty or
// invalid value falls back to wildfire, so a typo never takes the demo down.
export const parseEnabledHazards = (value: string | undefined): EnabledHazards => {
  const ids = new Set((value ?? "").split(",").map((id) => id.trim()));
  const [first, ...rest] = [...ids].filter(isHazardId).map((id) => HAZARDS[id]);
  return first === undefined ? [HAZARDS.wildfire] : [first, ...rest];
};

export const ENABLED_HAZARDS = parseEnabledHazards(import.meta.env.VITE_ENABLED_HAZARDS);

export const polarizationShort = (polarization: Polarization): string => polarization.slice(0, 2);
