export type PassDirection = "A" | "D";

export type LonLat = [lon: number, lat: number];

// Short keys keep public/data/frames.json small (~16k frames).
export type RawFrame = {
  t: number; // track
  f: number; // frame
  p: PassDirection;
  x: 0 | 1; // 1 when any L-band mode records cross-pol (HV/VH), the key signal for burned vegetation
  r: LonLat[][]; // outer rings; frames crossing the antimeridian come split in two
};

export type FramesFile = {
  fetchedAt: string;
  frames: RawFrame[];
};

export type BBox = [west: number, south: number, east: number, north: number];

export type Frame = {
  id: string;
  track: number;
  frame: number;
  pass: PassDirection;
  hasCrossPol: boolean;
  rings: LonLat[][];
  bbox: BBox;
};

export type Acquisition = {
  date: string; // YYYY-MM-DD
  hasCrossPol: boolean;
};
