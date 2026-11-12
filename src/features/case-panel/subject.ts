import type {
  Case,
  ContrastGroup,
  Crops,
  LensId,
  Matched,
  QualityItem,
  Source,
  Verdict,
} from "@/features/cases/cases";
import { caseBandPasses, type BandPass } from "@/features/cases/demoBand";
import type { LonLat } from "@/features/frames/frame.types";
import {
  formatLonLat,
  LIVE_CHIP_KM,
  LIVE_LIMITS,
  LIVE_LINE,
  LIVE_REASON,
  LIVE_SOURCES,
  type LiveAnswer,
} from "@/features/live/liveQuestion";

/*
 * What the panel and the sheet show, whether it comes from a measured case (REAL report numbers) or
 * from a live question (DEMO answer on a real frame). `demo` decides every verdict/quality chip.
 */
export type Subject = {
  kind: "case" | "live";
  id: string;
  name: string;
  place: string;
  lens: LensId;
  focus: LonLat;
  chipKm: number | undefined;
  target: string | undefined;
  when: string;
  verdict: Verdict;
  verdictLine: string;
  reason: string | undefined;
  passes: BandPass[] | undefined;
  stat: string | undefined;
  statLine: string | undefined;
  groups: ContrastGroup[];
  matched: Matched | undefined;
  witness: { label: string; note: string } | undefined;
  quality: QualityItem[];
  plainLimit: string;
  techLimit: string;
  alternatives: string[];
  empties: string[];
  sources: Source[];
  figure: string | undefined;
  crops: Crops | undefined;
  demo: boolean;
};

export const caseSubject = (item: Case): Subject => ({
  kind: "case",
  id: item.id,
  name: item.name,
  place: item.place,
  lens: item.lens,
  focus: item.focus,
  chipKm: item.chipKm,
  target: item.target,
  when: item.when,
  verdict: item.verdict,
  verdictLine: item.verdictLine,
  reason: item.reason,
  passes: caseBandPasses(item),
  stat: item.stat,
  statLine: item.statLine,
  groups: item.groups ?? [],
  matched: item.matched,
  witness: item.witness,
  quality: item.quality,
  plainLimit: item.plainLimit,
  techLimit: item.techLimit,
  alternatives: item.alternatives,
  empties: item.empties,
  sources: item.sources,
  figure: item.figure,
  crops: item.crops,
  demo: false,
});

export const liveSubject = (
  point: LonLat,
  lens: LensId,
  frameLabel: string,
  answer: LiveAnswer,
): Subject => ({
  kind: "live",
  id: "live",
  name: formatLonLat(point),
  place: frameLabel,
  lens,
  focus: point,
  chipKm: LIVE_CHIP_KM,
  target: undefined,
  when: "Last 6 passes",
  verdict: answer.verdict,
  verdictLine: LIVE_LINE[answer.verdict],
  reason: answer.verdict === "insufficient" ? LIVE_REASON : undefined,
  passes: answer.passes,
  stat: undefined,
  statLine: undefined,
  groups: [],
  matched: undefined,
  witness: undefined,
  quality: answer.quality,
  plainLimit: LIVE_LIMITS.plain,
  techLimit: LIVE_LIMITS.tech,
  alternatives: LIVE_LIMITS.alternatives,
  empties: LIVE_LIMITS.empties,
  sources: LIVE_SOURCES,
  figure: undefined,
  crops: undefined,
  demo: true,
});
