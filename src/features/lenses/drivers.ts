import { DRIVERS } from "@/content/copyV8";
import type { LensEvaluation, OpticalGroup } from "@/features/explore/exploreSchemas";
import { GROUP, groupOf, shareOf } from "@/features/lenses/opticalWitnessView";
import { formatDay } from "@/features/timeline/timelineLayout";

export type Fit = "fitsBest" | "partly" | "weak";

export type Driver = {
  id: "flooding" | "existingWater" | "wetSoil";
  title: string;
  fit: Fit;
  for: string;
  against: string;
};

export type DriversView = { drivers: Driver[]; footer: string };

// SPECS-v8 §6.5 fit rules for flood, the only thresholds the team has fixed.
const FITS_BEST_NEW_WATER = 0.7;
const FITS_BEST_DRY_CEILING = 0.05;
const WEAK_DRY_CEILING = 0.01;
const PERCENT = 100;

// Confounders the driver cards stand for, so the footer doesn't list them again.
const COVERED_BY_CARDS = new Set(["existing_water", "rain_or_soil_moisture"]);
const CHECKED = "evaluated";

type Groups = readonly OpticalGroup[];

/*
 * Each driver shows only when its own §6.5 rule gives it a tag; a driver whose rule doesn't fire
 * has no defined fit and stays hidden rather than getting one we made up.
 *  - River flooding · FITS BEST: ≥ 70 % of new-water cells meet the rule and ≤ 5 % of stayed-dry.
 *  - Water already there · PARTLY: the stable-water group adds cells meeting the rule.
 *  - Wet soil or crops · WEAK: ≤ 1 % of stayed-dry cells meet the rule.
 */
const flooding = (groups: Groups, d1: string, d2: string): Driver | undefined => {
  const newWater = groupOf(groups, GROUP.newWater);
  const share = shareOf(newWater);
  const dry = shareOf(groupOf(groups, GROUP.stayedDry));
  if (newWater === undefined || share === undefined || dry === undefined) return undefined;
  if (share < FITS_BEST_NEW_WATER || dry > FITS_BEST_DRY_CEILING) return undefined;
  return {
    id: "flooding",
    title: DRIVERS.flooding.title,
    fit: "fitsBest",
    for: DRIVERS.flooding.for(newWater.cells, d1, d2, Math.round(share * PERCENT)),
    against: DRIVERS.flooding.against,
  };
};

const existingWater = (groups: Groups): Driver | undefined => {
  const stable = groupOf(groups, GROUP.stableWater);
  if (stable === undefined || stable.signatureCells <= 0) return undefined;
  return {
    id: "existingWater",
    title: DRIVERS.existingWater.title,
    fit: "partly",
    for: DRIVERS.existingWater.for(stable.cells),
    against: DRIVERS.existingWater.against(stable.signatureCells),
  };
};

const wetSoil = (groups: Groups): Driver | undefined => {
  const dry = groupOf(groups, GROUP.stayedDry);
  const share = shareOf(dry);
  if (dry === undefined || share === undefined || share > WEAK_DRY_CEILING) return undefined;
  return {
    id: "wetSoil",
    title: DRIVERS.wetSoil.title,
    fit: "weak",
    for: DRIVERS.wetSoil.for,
    against: DRIVERS.wetSoil.against(dry.cells, dry.signatureCells),
  };
};

const footerOf = (evaluation: LensEvaluation): string => {
  const notChecked = evaluation.confounders
    .filter(({ id, status }) => status !== CHECKED && !COVERED_BY_CARDS.has(id))
    .flatMap(({ id }) => {
      const words = DRIVERS.confounder[id];
      return words === undefined ? [] : [words];
    });
  return notChecked.length === 0
    ? DRIVERS.footerSettle
    : `${DRIVERS.footerSettle} ${DRIVERS.footerNotChecked(...notChecked)}`;
};

// Flood drivers from a ready `water_comparison`; undefined when there is no evidence to weigh.
export const floodDrivers = (evaluation: LensEvaluation | undefined): DriversView | undefined => {
  const water = evaluation?.water;
  const groups = water?.groups;
  if (evaluation === undefined || water?.status !== "evaluated" || groups === undefined)
    return undefined;
  const pre = water.pre?.date;
  const post = water.post?.date;
  const drivers = [
    pre === undefined || post === undefined
      ? undefined
      : flooding(groups, formatDay(pre, false), formatDay(post, false)),
    existingWater(groups),
    wetSoil(groups),
  ].filter((driver): driver is Driver => driver !== undefined);
  return drivers.length === 0 ? undefined : { drivers, footer: footerOf(evaluation) };
};
