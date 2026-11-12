import type { Subject } from "@/features/case-panel/subject";
import { VERDICT } from "@/features/case-panel/verdicts";
import type { Case, Source } from "@/features/cases/cases";
import type { ChartMode } from "@/features/charts/chartTokens";

/*
 * Nova is rule-based for now (DEMO): it only rephrases what is on screen and cites the case's own
 * sources. Ported from `answer(q)` in the v7 prototype. `novaAnswer(question, context)` is the only
 * seam the chat uses, so a real model with citations can replace it without touching the UI.
 */

export type Citation = { n: string; label: string; href: string };
export type NovaReply =
  { kind: "answer"; text: string; cites: Citation[] } | { kind: "nodata"; text: string };

export type NovaContext = {
  // A ready result (measured case or finished live question).
  subject: Subject | undefined;
  // A case with no measurement yet (Chocó).
  pending: Case | undefined;
  // A live question whose job is still running.
  running: boolean;
  // Plain or Technical, the same switch as the panel and the sheet.
  mode: ChartMode;
};

const MODELING = "https://github.com/Ch0comilo/NISAR-Modeling";

const IMPACT = /people|victim|dead|death|affected|damage|cost|injur|casualt|killed|homes|houses/;
const PROVENANCE = /real|demo|true|fake|simulat/;
const COLOURS = /gr[ae]y|white/;
const LIMITS = /can.?t|cannot|limit|sure|cause|why/;

const citesOf = (sources: Source[]): Citation[] =>
  sources.slice(0, 2).map((source, index) => ({
    n: String(index + 1),
    label: source.label.split("·")[0]?.trim() ?? source.label,
    href: source.href,
  }));

export const NO_IMPACT =
  "I don't have impact figures. Radar measures how the ground's echo changed, not what happened to people or buildings. The official report is the place to check.";

export const suggestionsFor = (hasSelection: boolean): string[] =>
  hasSelection
    ? ["What does this mean?", "What can't it tell me?", "Is this data real?"]
    : ["Where should I start?", "Why grey on the map?", "How many people were affected?"];

const provenance = (subject: Subject): string => {
  if (subject.demo)
    return "This live answer is simulated. The passes come from NASA's Observation Plan, but the verdict and the chart are demo until the backend runs. Every demo value carries a DEMO chip.";
  const map = subject.crops === undefined ? "" : " The map on the globe is a crop of its figure.";
  return `The verdict, percentages and cell counts for ${subject.name} come from the backend's published report.${map} The point time series, the pass dates on the timeline and their bars are demo until the backend serves them, and each carries a DEMO chip.`;
};

export const novaAnswer = (question: string, context: NovaContext): NovaReply => {
  const q = question.toLowerCase();
  if (IMPACT.test(q)) return { kind: "nodata", text: NO_IMPACT };
  if (COLOURS.test(q))
    return {
      kind: "answer",
      text: "White means the echo didn't change. Grey means there was no measurement there, so we can't say anything. We never mix the two.",
      cites: [
        {
          n: "1",
          label: "Exploration lenses",
          href: `${MODELING}/blob/main/docs/EXPLORATION_LENSES.md`,
        },
      ],
    };
  const { subject, pending, running, mode } = context;
  if (pending !== undefined)
    return {
      kind: "answer",
      text: [pending.verdictLine, pending.reason].filter(Boolean).join(" "),
      cites: citesOf(pending.sources),
    };
  if (running)
    return {
      kind: "nodata",
      text: "The radar job is still running, so there's no result to explain yet. The checklist shows where it is.",
    };
  if (subject === undefined)
    return {
      kind: "answer",
      text: "Pick a measured case on the globe, or click any land to ask the radar about that spot. I'll explain the result once it's on screen.",
      cites: [{ n: "1", label: "NISAR-Modeling", href: MODELING }],
    };
  const cites = citesOf(subject.sources);
  if (PROVENANCE.test(q)) return { kind: "answer", text: provenance(subject), cites };
  if (LIMITS.test(q))
    return {
      kind: "answer",
      text: mode === "plain" ? subject.plainLimit : `${subject.plainLimit} ${subject.techLimit}`,
      cites,
    };
  const verdict = VERDICT[subject.verdict];
  if (mode === "technical")
    return {
      kind: "answer",
      text: `State ${verdict.state}. ${subject.verdictLine} ${subject.techLimit}`,
      cites,
    };
  const stat =
    subject.stat !== undefined && subject.kind === "case"
      ? ` Across the area: ${subject.stat} ${subject.statLine ?? ""}`
      : "";
  return { kind: "answer", text: `${verdict.label}. ${subject.verdictLine}${stat}`.trim(), cites };
};
