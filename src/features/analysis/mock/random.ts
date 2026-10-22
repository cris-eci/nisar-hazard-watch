// Seeded randomness for the demo fields: the same seed always draws the same scene.

const hashSeed = (seed: string): number => {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
};

// mulberry32: tiny, fast, good enough for visuals.
export const createRandom = (seed: string): (() => number) => {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const gaussianNoise = (random: () => number): number =>
  Math.sqrt(-2 * Math.log(random() || Number.EPSILON)) * Math.cos(2 * Math.PI * random());

// Smooth value noise on a coarse grid: natural-looking irregularity for the demo fields.
export const createValueNoise = (
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
