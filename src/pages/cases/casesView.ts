import {
  CASES,
  LENSES,
  type Case,
  type IconId,
  type LensId,
  type Verdict,
} from "@/features/cases/cases";

// Copy for the backend's three outcomes; the glyph shape tells them apart, never colour alone.
export const VERDICT_LABEL: Record<Verdict, string> = {
  departure: "Changed beyond its normal range",
  within: "Within its normal range",
  insufficient: "Not enough radar yet",
};

export type CaseFilter = LensId | "all";

export type FilterOption = { id: CaseFilter; label: string; icon?: IconId; count: number };

export const filterCases = (cases: Case[], filter: CaseFilter): Case[] =>
  filter === "all" ? cases : cases.filter((item) => item.lens === filter);

// Every lens stays listed, even with no case yet, so the page shows what the radar can be asked.
export const filterOptions = (cases: Case[] = CASES): FilterOption[] => [
  { id: "all", label: "All", count: cases.length },
  ...LENSES.map((lens) => ({
    id: lens.id,
    label: lens.chip,
    icon: lens.icon,
    count: filterCases(cases, lens.id).length,
  })),
];

// "Chenab River, Pakistan" → "Pakistan": the carousel names the case by place and country.
export const caseCountry = (item: Case): string =>
  item.place.split(",").at(-1)?.trim() ?? item.place;

// A pending case has no measurement, so its line says why instead of showing a number.
export const caseSummary = (item: Case): string =>
  item.pending === true ? item.verdictLine : `${item.stat} ${item.statLine}`;

export const caseHref = (item: Case): string => `/explore?case=${item.id}`;

// Where a card's headline number comes from (SPECS §7), for the REAL chip's tooltip. The first
// listed source can be the event bulletin, which has no radar numbers in it.
export const statSource = (item: Case): string =>
  item.lens === "insar"
    ? "NISAR-Modeling · TEAM_HANDOFF.md and README.md"
    : "NISAR-Modeling · flood_pilot_summary.json and FLOOD_CHARACTERIZATION.md";

// Landslides have an icon but no lens and no measured case yet, so their ring is dashed.
export const HAZARD_ROW: { id: IconId; label: string; hasLens: boolean }[] = [
  { id: "earthquake", label: "Earthquakes", hasLens: true },
  { id: "wildfire", label: "Wildfires", hasLens: true },
  { id: "deforestation", label: "Deforestation", hasLens: true },
  { id: "flood", label: "Floods", hasLens: true },
  { id: "landslide", label: "Landslides", hasLens: false },
];
