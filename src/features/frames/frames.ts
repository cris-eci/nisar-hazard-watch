import type {
  BBox,
  Frame,
  FramesFile,
  LonLat,
  PassDirection,
  RawFrame,
} from "@/features/frames/frame.types";

export const FRAMES_URL = "/data/frames.json";

export const frameId = (track: number, frame: number): string => `${track}-${frame}`;

const bboxOf = (rings: LonLat[][]): BBox => {
  const points = rings.flat();
  const lons = points.map(([lon]) => lon);
  const lats = points.map(([, lat]) => lat);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
};

export const toFrame = (raw: RawFrame): Frame => ({
  id: frameId(raw.t, raw.f),
  track: raw.t,
  frame: raw.f,
  pass: raw.p,
  hasCrossPol: raw.x === 1,
  rings: raw.r,
  bbox: bboxOf(raw.r),
});

export const loadFrames = async (signal: AbortSignal): Promise<Frame[]> => {
  const response = await fetch(FRAMES_URL, { signal });
  if (!response.ok) throw new Error(`Could not load frames (HTTP ${response.status})`);
  const file = (await response.json()) as FramesFile;
  return file.frames.map(toFrame);
};

// Ray casting. Planar lon/lat is accurate enough at frame scale, and antimeridian
// frames are already split into rings that each stay on one side of ±180°.
const isInRing = ([lon, lat]: LonLat, ring: LonLat[]): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as LonLat;
    const [xj, yj] = ring[j] as LonLat;
    const crosses = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
};

const isInBBox = ([lon, lat]: LonLat, [west, south, east, north]: BBox): boolean =>
  lon >= west && lon <= east && lat >= south && lat <= north;

// Frames of the same pass overlap slightly at their edges; the first match is good enough.
export const findFrameAt = (
  frames: Frame[],
  point: LonLat,
  pass: PassDirection,
): Frame | undefined =>
  frames.find(
    (frame) =>
      frame.pass === pass &&
      isInBBox(point, frame.bbox) &&
      frame.rings.some((ring) => isInRing(point, ring)),
  );
