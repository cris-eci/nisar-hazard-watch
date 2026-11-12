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

/*
 * What the panel and the sheet show, whether it comes from a measured case (REAL report numbers) or
 * from a live exploration (the backend's answer). `demo` decides every verdict/quality chip.
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
  // Live results: where the target pass sits against the spot's own normal range, per channel.
  normalRange: NormalRange | undefined;
  // Live wildfire results: independent fire evidence, shown apart from the radar.
  fireContext: FireContextView | undefined;
  // Live results: the stages the service reported, with their seconds.
  compute: ComputeStep[] | undefined;
  demo: boolean;
};

export type NormalRangeChannel = { channel: string; delta: number; halfWidth: number };
export type NormalRange = { channels: NormalRangeChannel[]; baselinePasses: number };
export type ComputeStep = { label: string; sub: string };
export type FireContextView = {
  status: "available" | "unavailable" | "notConfigured";
  headline: string;
  facts: { k: string; v: string }[];
  note: string;
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
  normalRange: undefined,
  fireContext: undefined,
  compute: undefined,
  demo: false,
});
