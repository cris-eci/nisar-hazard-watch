import type { BBox, LonLat, PassDirection } from "@/features/frames/frame.types";

// Contract with the data pipeline (NISAC_Data_Lab). Documented in docs/analysis-api.md:
// change both together.

// Add a hazard here, in HAZARDS (hazards.ts) and in the pipeline. Nothing else in the UI changes.
export type HazardId = "wildfire" | "flood" | "deforestation" | "earthquake";

// Two families: surface change compares backscatter (GCOV); deformation reads interferograms (GUNW).
export type AnalysisKind = "change" | "deformation";

export type Polarization = "HHHH" | "HVHV";

export type AnalysisRequest = {
  hazard: HazardId;
  track: number;
  frame: number;
  beforeDate: string; // YYYY-MM-DD
  afterDate: string;
  focus?: LonLat; // centre of interest, e.g. an epicentre; defaults to the frame centre
};

export type SeverityHa = { low: number; moderate: number; high: number };

export type AnalysisScene = {
  date: string;
  granuleId: string; // NISAR granule the pixels come from
};

type AnalysisBase = {
  hazard: HazardId;
  track: number;
  frame: number;
  pass: PassDirection;
  before: AnalysisScene;
  after: AnalysisScene;
  generatedAt: string; // ISO timestamp
  isDemo: boolean;
};

// PNG layers are draped over `bounds` (lon/lat). URLs may be data: URLs.
export type ChangeAnalysis = AnalysisBase & {
  kind: "change";
  method: {
    polarization: Polarization;
    changeThresholdDb: number; // log-ratio at or below this counts as affected
    multilook: number;
    pixelSizeM: number;
  };
  affectedAreaHa: number;
  meanChangeDb: number; // mean log-ratio inside the affected area
  severityHa: SeverityHa;
  layers: {
    bounds: BBox;
    beforeUrl: string; // backscatter in dB, grayscale
    afterUrl: string;
    severityUrl: string; // classified severity, transparent where unaffected
  };
};

// Line-of-sight (LOS) displacement between the two dates: positive moves toward the satellite.
export type DeformationAnalysis = AnalysisBase & {
  kind: "deformation";
  method: {
    product: "GUNW";
    wavelengthCm: number;
    ionosphereCorrected: boolean;
    pixelSizeM: number;
  };
  maxTowardCm: number;
  maxAwayCm: number;
  deformedAreaKm2: number; // area that moved more than `deformedThresholdCm`
  deformedThresholdCm: number;
  layers: {
    bounds: BBox;
    displacementUrl: string; // diverging blue (away) to red (toward), symmetric ±colorScaleCm
    fringesUrl: string; // wrapped phase, one colour cycle per half wavelength
    colorScaleCm: number;
  };
};

export type HazardAnalysis = ChangeAnalysis | DeformationAnalysis;
