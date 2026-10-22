import { HAZARDS } from "@/features/analysis/hazards";
import { analysisBounds, areaKm2 } from "@/features/analysis/mock/demoCommon";
import {
  generateDeformationField,
  summarizeDeformation,
} from "@/features/analysis/mock/deformationField";
import { displacementColor, fringeColor } from "@/features/analysis/mock/mockDeformation";
import { toPngUrl } from "@/features/analysis/mock/png";
import { renderLayers } from "@/features/analysis/mock/renderLayers";
import { generateScarField, GRID_SIZE, summarizeField } from "@/features/analysis/mock/scarField";
import { findEvent, type FeaturedEvent } from "@/features/events/events";
import type { BBox } from "@/features/frames/frame.types";

// The explorer's seeded demos for two featured events, drawn as the pictures the method steps
// walk through. Same seeds as the explorer (hazard:frame:before:after), so the pictures and peak
// values match it; areas can differ a little because the explorer clips to the frame's box.

export const FIRE_EVENT_ID = "andes-fire-demo";
export const QUAKE_EVENT_ID = "venezuela-2026";

// For an event without a fixed pair (the fire demo site); the explorer takes the latest usable one.
const DEMO_PAIR: [string, string] = ["2026-10-03", "2026-10-15"];

// Without frames.json the frame box is unknown; the whole world keeps the square on the focus.
const WORLD: BBox = [-180, -90, 180, 90];

const CHANGE_DB_RANGE = { min: -10, max: 2 };

export type FireDemo = {
  beforeDate: string;
  afterDate: string;
  beforeUrl: string;
  afterUrl: string;
  changeUrl: string;
  severityUrl: string;
  affectedAreaHa: number;
};

export type QuakeDemo = {
  beforeDate: string;
  afterDate: string;
  fringesUrl: string;
  displacementUrl: string;
  maxTowardCm: number;
  maxAwayCm: number;
  deformedAreaKm2: number;
};

const requireEvent = (id: string): FeaturedEvent => {
  const event = findEvent(id);
  if (event === undefined) throw new Error(`Featured event ${id} is missing`);
  return event;
};

const FIRE_EVENT = requireEvent(FIRE_EVENT_ID);
const QUAKE_EVENT = requireEvent(QUAKE_EVENT_ID);

export const FIRE_PAIR = FIRE_EVENT.pair ?? DEMO_PAIR;
export const QUAKE_PAIR = QUAKE_EVENT.pair ?? DEMO_PAIR;
export const QUAKE_DATE = QUAKE_EVENT.date;

const seed = (hazard: string, event: FeaturedEvent, [before, after]: [string, string]): string =>
  `${hazard}:${event.frameId}:${before}:${after}`;

export const buildFireDemo = (): FireDemo => {
  const [beforeDate, afterDate] = FIRE_PAIR;
  const hazard = HAZARDS.wildfire;
  if (hazard.kind !== "change") throw new Error("Wildfire must be a change hazard");
  const field = generateScarField(seed("wildfire", FIRE_EVENT, FIRE_PAIR));
  const pixelAreaHa = (areaKm2(analysisBounds(WORLD, FIRE_EVENT.focus)) * 100) / GRID_SIZE ** 2;
  const layers = renderLayers(field, GRID_SIZE, hazard.severityColors);
  const changeUrl = toPngUrl(GRID_SIZE, (i) => {
    const t =
      ((field.changeDb[i] ?? 0) - CHANGE_DB_RANGE.min) /
      (CHANGE_DB_RANGE.max - CHANGE_DB_RANGE.min);
    const level = Math.round(255 * Math.min(1, Math.max(0, t)));
    return [level, level, level, 255];
  });
  return {
    beforeDate,
    afterDate,
    ...layers,
    changeUrl,
    affectedAreaHa: summarizeField(field, pixelAreaHa).affectedAreaHa,
  };
};

export const buildQuakeDemo = (): QuakeDemo => {
  const [beforeDate, afterDate] = QUAKE_PAIR;
  const field = generateDeformationField(seed("earthquake", QUAKE_EVENT, QUAKE_PAIR), GRID_SIZE);
  const pixelAreaKm2 = areaKm2(analysisBounds(WORLD, QUAKE_EVENT.focus)) / GRID_SIZE ** 2;
  const { colorScaleCm, ...summary } = summarizeDeformation(field, pixelAreaKm2);
  return {
    beforeDate,
    afterDate,
    fringesUrl: toPngUrl(GRID_SIZE, (i) => fringeColor(field.losCm[i] ?? 0)),
    displacementUrl: toPngUrl(GRID_SIZE, (i) =>
      displacementColor(field.losCm[i] ?? 0, colorScaleCm),
    ),
    ...summary,
  };
};
