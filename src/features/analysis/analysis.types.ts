import type { BBox, PassDirection } from "@/features/frames/frame.types";

// Contract with the data pipeline (NISAC_Data_Lab). Documented in docs/analysis-api.md:
// change both together.

export type BurnAnalysisRequest = {
  track: number;
  frame: number;
  beforeDate: string; // YYYY-MM-DD, an HH+HV pass
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
  beforeHvUrl: string; // HV backscatter in dB, grayscale
  afterHvUrl: string;
  severityUrl: string; // classified burn severity, transparent where unburned
};

export type BurnAnalysis = {
  track: number;
  frame: number;
  pass: PassDirection;
  before: AnalysisScene;
  after: AnalysisScene;
  method: {
    polarization: "HVHV";
    changeThresholdDb: number; // log-ratio below this counts as burned
    multilook: number;
    pixelSizeM: number;
  };
  burnedAreaHa: number;
  meanHvChangeDb: number; // mean HV log-ratio inside the burned area (negative = loss)
  severityHa: SeverityHa;
  layers: AnalysisLayers;
  generatedAt: string; // ISO timestamp
  isDemo: boolean;
};
