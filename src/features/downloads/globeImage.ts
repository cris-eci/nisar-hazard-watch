import type { Viewer } from "cesium";

/*
 * "Screenshot of the globe": the Cesium canvas plus a context strip drawn into the same PNG, so the
 * image still says what it shows (place, question, dates, legend, DEMO) once it leaves the app.
 */

export type StripLegend = { ramp: string[]; scale: [string, string, string]; text: string };

export type GlobeStrip = {
  title: string;
  question: string;
  dates: string;
  legend: StripLegend | undefined;
  demo: boolean;
};

export const STRIP_BRAND = "NISAR Hazard Watch · Nova Frontier";

const INK = "#ebe9e4";
const MUTED = "#a9a69e";
const DEMO_BG = "rgba(245,158,11,0.18)";
const DEMO_INK = "#fcd34d";
const STRIP_BG = "#08101f";

// The text lines of the strip, also what a screen reader or a test can check.
export const stripLines = (strip: GlobeStrip): string[] => [
  strip.title,
  [strip.question, strip.dates].filter(Boolean).join(" · "),
  strip.legend?.text ?? "",
  STRIP_BRAND,
];

const font = (px: number, weight = 400, mono = false): string =>
  `${weight} ${px}px ${mono ? '"JetBrains Mono", ui-monospace, monospace' : '"Albert Sans", system-ui, sans-serif'}`;

const drawLegend = (
  ctx: CanvasRenderingContext2D,
  legend: StripLegend,
  x: number,
  y: number,
  width: number,
  scale: number,
) => {
  const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
  legend.ramp.forEach((colour, index) =>
    gradient.addColorStop(index / Math.max(1, legend.ramp.length - 1), colour),
  );
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, 8 * scale);
  ctx.fillStyle = MUTED;
  ctx.font = font(11 * scale, 400, true);
  const labelY = y + 24 * scale;
  ctx.textAlign = "left";
  ctx.fillText(legend.scale[0], x, labelY);
  ctx.textAlign = "center";
  ctx.fillText(legend.scale[1], x + width / 2, labelY);
  ctx.textAlign = "right";
  ctx.fillText(legend.scale[2], x + width, labelY);
  ctx.textAlign = "left";
};

// Renders a frame and copies it in the same task, so the WebGL buffer is still there to read
// without turning on preserveDrawingBuffer for the whole session.
export const captureGlobe = (viewer: Viewer, strip: GlobeStrip): Promise<Blob | null> => {
  viewer.render();
  const source = viewer.scene.canvas;
  const scale = Math.max(1, source.width / Math.max(1, source.clientWidth));
  const stripHeight = Math.round(112 * scale);
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height + stripHeight;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return Promise.resolve(null);
  ctx.drawImage(source, 0, 0);

  const top = source.height;
  const pad = 24 * scale;
  ctx.fillStyle = STRIP_BG;
  ctx.fillRect(0, top, canvas.width, stripHeight);
  ctx.fillStyle = "rgba(235,233,228,0.14)";
  ctx.fillRect(0, top, canvas.width, Math.max(1, scale));

  const [title, question, legendText, brand] = stripLines(strip);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = font(20 * scale, 500);
  ctx.fillText(title ?? "", pad, top + 36 * scale);
  ctx.fillStyle = MUTED;
  ctx.font = font(14 * scale);
  ctx.fillText(question ?? "", pad, top + 60 * scale);
  ctx.font = font(11 * scale, 400, true);
  ctx.fillText((brand ?? "").toUpperCase(), pad, top + 92 * scale);

  const right = canvas.width - pad;
  if (strip.legend !== undefined) {
    const width = Math.min(260 * scale, canvas.width * 0.3);
    drawLegend(ctx, strip.legend, right - width, top + 26 * scale, width, scale);
    ctx.fillStyle = MUTED;
    ctx.font = font(11 * scale);
    ctx.textAlign = "right";
    ctx.fillText(legendText ?? "", right, top + 72 * scale, width + 120 * scale);
    ctx.textAlign = "left";
  }
  if (strip.demo) {
    const label = "DEMO VALUES IN THIS VIEW";
    ctx.font = font(11 * scale, 500, true);
    const width = ctx.measureText(label).width + 16 * scale;
    const x = right - width;
    const y = top + 84 * scale;
    ctx.fillStyle = DEMO_BG;
    ctx.fillRect(x, y, width, 18 * scale);
    ctx.fillStyle = DEMO_INK;
    ctx.fillText(label, x + 8 * scale, y + 13 * scale);
  }
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
};
