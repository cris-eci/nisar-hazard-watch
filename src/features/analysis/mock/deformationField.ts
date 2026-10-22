import { createRandom, createValueNoise, gaussianNoise } from "@/features/analysis/mock/random";

// Simulates the coseismic line-of-sight (LOS) displacement an unwrapped interferogram shows: two
// lobes of opposite sign on either side of a fault, plus smooth atmospheric noise. Pure and seeded.

export const DEFORMED_THRESHOLD_CM = 2;
export const NISAR_L_BAND_WAVELENGTH_CM = 23.84;

export type DeformationField = { losCm: Float32Array };

export const generateDeformationField = (seed: string, size: number): DeformationField => {
  const random = createRandom(seed);
  const strike = random() * Math.PI;
  const centerU = 0.45 + random() * 0.1;
  const centerV = 0.45 + random() * 0.1;
  const halfLength = 0.18 + random() * 0.1; // along the fault
  const halfWidth = 0.08 + random() * 0.05; // across it
  const offset = 0.07;
  const amplitudeCm = 15 + random() * 25;
  const atmosphere = createValueNoise(random, 6);

  const losCm = new Float32Array(size * size);
  for (let i = 0; i < losCm.length; i++) {
    const du = (i % size) / size - centerU;
    const dv = Math.floor(i / size) / size - centerV;
    const along = du * Math.cos(strike) + dv * Math.sin(strike);
    const across = -du * Math.sin(strike) + dv * Math.cos(strike);
    const lobe = (shift: number): number =>
      Math.exp(-((along / halfLength) ** 2) - ((across - shift) / halfWidth) ** 2);
    losCm[i] =
      amplitudeCm * (lobe(offset) - 0.65 * lobe(-offset)) +
      3 * (atmosphere((i % size) / size, Math.floor(i / size) / size) - 0.5) +
      0.4 * gaussianNoise(random);
  }
  return { losCm };
};

export const summarizeDeformation = (
  { losCm }: DeformationField,
  pixelAreaKm2: number,
): { maxTowardCm: number; maxAwayCm: number; deformedAreaKm2: number; colorScaleCm: number } => {
  let max = 0;
  let min = 0;
  let deformedPixels = 0;
  for (const value of losCm) {
    max = Math.max(max, value);
    min = Math.min(min, value);
    if (Math.abs(value) > DEFORMED_THRESHOLD_CM) deformedPixels++;
  }
  return {
    maxTowardCm: Number(max.toFixed(1)),
    maxAwayCm: Number((-min).toFixed(1)),
    deformedAreaKm2: Math.round(deformedPixels * pixelAreaKm2),
    // Symmetric and rounded to 5 cm so the legend reads cleanly.
    colorScaleCm: Math.max(5, Math.ceil(Math.max(max, -min) / 5) * 5),
  };
};
