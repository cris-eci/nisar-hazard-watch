import type { SeverityHa } from "@/features/analysis/analysis.types";

// Simulates what the pipeline computes from two HV scenes: a speckled backscatter image before and
// after a fire, and the per-pixel log-ratio between them. Pure and seeded, so it is testable and the
// same frame and dates always produce the same scar.

export const GRID_SIZE = 256;
export const CHANGE_THRESHOLD_DB = -2; // same default as clasificar_cambio in NISAC_Data_Lab

export type Severity = 0 | 1 | 2 | 3; // none, low, moderate, high

export type ScarField = {
  beforeDb: Float32Array;
  afterDb: Float32Array;
  changeDb: Float32Array;
  severity: Uint8Array;
};

const hashSeed = (seed: string): number => {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
};

// mulberry32: tiny, fast, good enough for visuals.
const createRandom = (seed: string): (() => number) => {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const gaussianNoise = (random: () => number): number =>
  Math.sqrt(-2 * Math.log(random() || Number.EPSILON)) * Math.cos(2 * Math.PI * random());

type Blob = { x: number; y: number; sigma: number; weight: number };

// A fire spreads in one direction, so blobs follow a short random walk from an ignition point.
const createBlobs = (random: () => number): Blob[] => {
  const blobs: Blob[] = [];
  let x = 0.35 + random() * 0.3;
  let y = 0.35 + random() * 0.3;
  const heading = random() * 2 * Math.PI;
  for (let i = 0, count = 6 + Math.floor(random() * 5); i < count; i++) {
    blobs.push({ x, y, sigma: 0.025 + random() * 0.035, weight: 0.7 + random() * 0.5 });
    const angle = heading + (random() - 0.5) * 1.6;
    x += Math.cos(angle) * 0.05;
    y += Math.sin(angle) * 0.05;
  }
  return blobs;
};

// Smooth value noise on a coarse grid; it makes the scar edges ragged instead of oval.
const createValueNoise = (
  random: () => number,
  cells: number,
): ((u: number, v: number) => number) => {
  const grid = Array.from({ length: (cells + 1) ** 2 }, () => random());
  const at = (gx: number, gy: number): number => grid[gy * (cells + 1) + gx] ?? 0;
  const smooth = (t: number): number => t * t * (3 - 2 * t);
  return (u, v) => {
    const fx = u * cells;
    const fy = v * cells;
    const gx = Math.min(cells - 1, Math.floor(fx));
    const gy = Math.min(cells - 1, Math.floor(fy));
    const tx = smooth(fx - gx);
    const ty = smooth(fy - gy);
    const top = at(gx, gy) * (1 - tx) + at(gx + 1, gy) * tx;
    const bottom = at(gx, gy + 1) * (1 - tx) + at(gx + 1, gy + 1) * tx;
    return top * (1 - ty) + bottom * ty;
  };
};

// Burn intensity 0..1 from the blobs, eroded by noise so the outline is irregular.
const burnIntensity = (
  blobs: Blob[],
  noise: (u: number, v: number) => number,
  u: number,
  v: number,
): number => {
  const core = blobs.reduce(
    (acc, { x, y, sigma, weight }) =>
      acc + weight * Math.exp(-((u - x) ** 2 + (v - y) ** 2) / (2 * sigma ** 2)),
    0,
  );
  return Math.min(1, Math.max(0, core * (0.2 + 1.6 * noise(u, v)) - 0.25));
};

export const classifySeverity = (changeDb: number): Severity => {
  if (changeDb > CHANGE_THRESHOLD_DB) return 0;
  if (changeDb > -4) return 1;
  if (changeDb > -6) return 2;
  return 3;
};

export const generateScarField = (seed: string, size = GRID_SIZE): ScarField => {
  const random = createRandom(seed);
  const blobs = createBlobs(random);
  const coarse = createValueNoise(random, 12);
  const fine = createValueNoise(random, 40);
  const noise = (u: number, v: number): number => 0.65 * coarse(u, v) + 0.35 * fine(u, v);
  const pixels = size * size;
  const field: ScarField = {
    beforeDb: new Float32Array(pixels),
    afterDb: new Float32Array(pixels),
    changeDb: new Float32Array(pixels),
    severity: new Uint8Array(pixels),
  };

  for (let i = 0; i < pixels; i++) {
    const u = (i % size) / size;
    const v = Math.floor(i / size) / size;
    // Forest HV is around -12 dB; speckle adds ~1.5 dB of grain to each scene independently.
    const ground = -12 + 1.5 * Math.sin(u * 9 + random()) * Math.cos(v * 7);
    // Severity varies inside a scar: patches of crown fire next to lightly burned understorey.
    const burn = burnIntensity(blobs, noise, u, v) * (0.45 + 0.75 * fine(u, v));
    const before = ground + 1.5 * gaussianNoise(random);
    const after = ground - 8 * burn + 1.5 * gaussianNoise(random);
    // The pipeline multilooks before comparing, so the change itself is far less noisy.
    const change = -8 * burn + 0.4 * gaussianNoise(random);

    field.beforeDb[i] = before;
    field.afterDb[i] = after;
    field.changeDb[i] = change;
    field.severity[i] = classifySeverity(change);
  }
  return field;
};

export const summarizeField = (
  { changeDb, severity }: ScarField,
  pixelAreaHa: number,
): { affectedAreaHa: number; meanChangeDb: number; severityHa: SeverityHa } => {
  const counts = [0, 0, 0, 0];
  let changeSum = 0;
  for (let i = 0; i < severity.length; i++) {
    const level = severity[i] ?? 0;
    counts[level] = (counts[level] ?? 0) + 1;
    if (level > 0) changeSum += changeDb[i] ?? 0;
  }
  const [, low = 0, moderate = 0, high = 0] = counts;
  const burnedPixels = low + moderate + high;
  return {
    affectedAreaHa: Math.round(burnedPixels * pixelAreaHa),
    meanChangeDb: burnedPixels === 0 ? 0 : Number((changeSum / burnedPixels).toFixed(1)),
    severityHa: {
      low: Math.round(low * pixelAreaHa),
      moderate: Math.round(moderate * pixelAreaHa),
      high: Math.round(high * pixelAreaHa),
    },
  };
};
