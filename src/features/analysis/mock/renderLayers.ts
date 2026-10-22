import type { ScarField } from "@/features/analysis/mock/scarField";

// Turns the simulated field into the PNG layers the real pipeline would serve.

type Rgba = [number, number, number, number];

const DB_RANGE = { min: -22, max: -4 }; // stretch for HV backscatter, like the notebook's 2-98 %

// Alert colours for burn severity: the data literally means damage here.
const SEVERITY_COLORS: Rgba[] = [
  [0, 0, 0, 0],
  [250, 204, 21, 190], // low
  [249, 115, 22, 210], // moderate
  [220, 38, 38, 230], // high
];

const toPngUrl = (size: number, paint: (pixel: number) => Rgba): string => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("Canvas 2D is not available");
  const image = context.createImageData(size, size);
  for (let i = 0; i < size * size; i++) image.data.set(paint(i), i * 4);
  context.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
};

const grayscale = (db: number): Rgba => {
  const t = (db - DB_RANGE.min) / (DB_RANGE.max - DB_RANGE.min);
  const level = Math.round(255 * Math.min(1, Math.max(0, t)));
  return [level, level, level, 255];
};

export const renderLayers = (field: ScarField, size: number) => ({
  beforeHvUrl: toPngUrl(size, (i) => grayscale(field.beforeDb[i] ?? DB_RANGE.min)),
  afterHvUrl: toPngUrl(size, (i) => grayscale(field.afterDb[i] ?? DB_RANGE.min)),
  severityUrl: toPngUrl(size, (i) => SEVERITY_COLORS[field.severity[i] ?? 0] ?? [0, 0, 0, 0]),
});
