import type {
  AnalysisRequest,
  HazardAnalysis,
  HazardId,
  Polarization,
  SeverityHa,
} from "@/features/analysis/analysis.types";
import { mockChangeAnalysis } from "@/features/analysis/mock/mockAnalysis";
import type { Frame } from "@/features/frames/frame.types";

// Everything that differs between hazards lives here, so the UI stays hazard-agnostic.
export type HazardDefinition = {
  id: HazardId;
  label: string; // hazard picker
  analysisTitle: string;
  affectedLabel: string; // "<area> burned"
  polarization: Polarization;
  requiresCrossPol: boolean; // only compare HH+HV passes
  backscatterHint: string; // how to read the before/after images
  severityColors: Record<keyof SeverityHa, string>;
  runDemo: (frame: Frame, request: AnalysisRequest, signal: AbortSignal) => Promise<HazardAnalysis>;
};

const WILDFIRE_COLORS = { low: "#facc15", moderate: "#f97316", high: "#dc2626" };
const FLOOD_COLORS = { low: "#7dd3fc", moderate: "#38bdf8", high: "#2563eb" };

export const HAZARDS: Record<HazardId, HazardDefinition> = {
  wildfire: {
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
