import type { BBox, PassDirection } from "@/features/frames/frame.types";

// Contract with the data pipeline (NISAC_Data_Lab). Documented in docs/analysis-api.md:
// change both together.

// Add a hazard here, in HAZARDS (hazards.ts) and in the pipeline. Nothing else in the UI changes.
export type HazardId = "wildfire";

export type Polarization = "HHHH" | "HVHV";

export type AnalysisRequest = {
  hazard: HazardId;
  track: number;
  frame: number;
  beforeDate: string; // YYYY-MM-DD
  afterDate: string;
};

export type SeverityHa = { low: number; moderate: number; high: number };

export type AnalysisScene = {
  date: string;
  granuleId: string; // NISAR L2 GCOV granule the pixels come from
};

// PNG layers the globe drapes over `bounds` (lon/lat). URLs may be data: URLs.
export type AnalysisLayers = {
  bounds: BBox;
  beforeUrl: string; // backscatter in dB, grayscale
  afterUrl: string;
  severityUrl: string; // classified severity, transparent where unaffected
};

export type HazardAnalysis = {
  hazard: HazardId;
  track: number;
  frame: number;
  pass: PassDirection;
  before: AnalysisScene;
  after: AnalysisScene;
  method: {
    polarization: Polarization;
    changeThresholdDb: number; // log-ratio at or below this counts as affected
    multilook: number;
    pixelSizeM: number;
  };
  affectedAreaHa: number;
  meanChangeDb: number; // mean log-ratio inside the affected area
  severityHa: SeverityHa;
  layers: AnalysisLayers;
  generatedAt: string; // ISO timestamp
  isDemo: boolean;
};
