import { CASES, type Case } from "@/features/cases/cases";

/*
 * The guided story (SPECS §5): six chapters on the case marked `tour` (Qadirabad, Chenab flood).
 * Captions and card copy come from the v7 prototype; every number is the case's REAL report value.
 */

export type ChapterView = "region" | "chip" | "drape";
export type ChapterCard = "facts" | "where" | "map" | "witness" | "ground" | "end";

export type Chapter = {
  kicker: string;
  title: string;
  caption: string;
  view: ChapterView;
  card: ChapterCard;
};

export const STORY_PLACE = "Chenab flood, Pakistan";
export const STORY_ADVANCE_MS = 9000;

export const CHAPTERS: Chapter[] = [
  {
    kicker: "01 · What happened",
    title: "Flood bulletins for the Chenab, July 2026",
    caption:
      "In late July 2026 Pakistan's flood forecasting service issued bulletins for the Chenab river in Punjab.",
    view: "region",
    card: "facts",
  },
  {
    kicker: "02 · Where",
    title: "Qadirabad, on the Chenab",
    caption:
      "This is Qadirabad. NISAR passes over every 12 days. We asked it about one square, a few kilometres across, around a single point.",
    view: "chip",
    card: "where",
  },
  {
    kicker: "03 · What the radar saw",
    title: "Blue is ground that went dark",
    caption:
      "Radar brings its own light. Calm water bounces it away, so flooded ground turns dark. On 26 July large patches here fell below their normal range. This is the real change map from our science team.",
    view: "drape",
    card: "map",
  },
  {
    kicker: "04 · The second witness",
    title: "An optical satellite looked a week later",
    caption:
      "Where the optical satellite saw new water, the radar had flagged 64% of cells. On dry land, 1%. But it also flagged 17% of water that was already there, and we show that too.",
    view: "drape",
    card: "witness",
  },
  {
    kicker: "05 · On the ground",
    title: "What people reported",
    caption: "Every photo and article here is credited and linked to its source.",
    view: "drape",
    card: "ground",
  },
  {
    kicker: "06 · What NISAR adds",
    title: "Measured, not guessed",
    caption:
      "NISAR measures how the ground's echo changed, through clouds and at night, and shows where the rule gets fooled. Now explore it yourself.",
    view: "chip",
    card: "end",
  },
];

export const LAST_CHAPTER = CHAPTERS.length - 1;

// Chapter 1 looks at the Punjab plains around the river, not at the chip.
export const REGION_CENTRE: [number, number] = [73.5, 31.5];

// The case the story tells; the first case is the fallback so the story never breaks.
export const storyCase = (): Case | undefined =>
  CASES.find((item) => item.tour === true) ?? CASES[0];

export const clampChapter = (index: number): number => Math.min(LAST_CHAPTER, Math.max(0, index));

export const chapterCount = (index: number): string =>
  `Chapter ${index + 1} of ${CHAPTERS.length} · ${STORY_PLACE}`;
