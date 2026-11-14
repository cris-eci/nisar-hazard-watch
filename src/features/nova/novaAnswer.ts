import type { Subject } from "@/features/case-panel/subject";
import { VERDICT } from "@/features/case-panel/verdicts";
import type { Case, Source } from "@/features/cases/cases";
import type { ChartMode } from "@/features/charts/chartTokens";
import type { CardFacts, NovaFact } from "@/features/nova/novaFacts";

/*
 * Nova is rule-based for now (DEMO): it only rephrases what is on screen and cites the case's own
 * sources. Ported from `answer(q)` in the v7 prototype. `novaAnswer(question, context)` is the only
 * seam the chat uses, so a real model with citations can replace it without touching the UI.
 * On a v8 lens card every reply names the on-screen fields it read (`fields`), or says it can't
 * answer: never a cause beyond SPECS-v8 §6.5, never a number the card doesn't show.
 */

export type Citation = { n: string; label: string; href: string };
export type NovaReply =
  | { kind: "answer"; text: string; cites: Citation[]; fields: string[] }
  | { kind: "nodata"; text: string };

export type NovaContext = {
  // A ready result (measured case or finished live question).
  subject: Subject | undefined;
  // A case with no measurement yet (Chocó).
  pending: Case | undefined;
  // A live question whose job is still running.
  running: boolean;
  // Plain or Technical, the same switch as the panel and the sheet.
  mode: ChartMode;
  // What the v8 lens card shows for a live answer (novaFacts.cardFactsOf); undefined elsewhere.
  card?: CardFacts | undefined;
};

const MODELING = "https://github.com/nisar-hazard-watch/NISAR-Modeling";

const IMPACT = /people|victim|dead|death|affected|damage|cost|injur|casualt|killed|homes|houses/;
const PROVENANCE = /real|demo|true|fake|simulat/;
const COLOURS = /gr[ae]y|white/;
const LIMITS = /can.?t|cannot|limit|sure|cause|why/;
const WHY_TWO = /why two|both|channel|polari|hh|hv/;
const PIXEL = /pixel|clicked|exact spot|my spot|point/;
const CELLS = /cells?|rule|how much|how many|share|percent|fraction|area/;
const AROUND = /surround|neighbo|around|nearby/;
const FIRE = /fire|firms|burn|thermal/;
const MEANING = /mean|result|verdict|explain|summar|what happened|tell me|answer|start/;

const citesOf = (sources: Source[]): Citation[] =>
  sources.slice(0, 2).map((source, index) => ({
    n: String(index + 1),
    label: source.label.split("·")[0]?.trim() ?? source.label,
    href: source.href,
  }));

export const NO_IMPACT =
  "I don't have impact figures. Radar measures how the ground's echo changed, not what happened to people or buildings. The official report is the place to check.";

export const suggestionsFor = (hasSelection: boolean, hasCard = false): string[] =>
  hasCard
    ? [
        "What does this mean?",
        "What happened at my pixel?",
        "Why two channels?",
        "Is this data real?",
      ]
    : hasSelection
      ? ["What does this mean?", "What can't it tell me?", "Is this data real?"]
      : ["Where should I start?", "Why grey on the map?", "How many people were affected?"];

const NOT_ON_SCREEN =
  "That isn't on this card for this answer, so I can't say. I only explain what the card shows.";

const fieldsOf = (facts: (NovaFact | undefined)[]): string[] =>
  facts.flatMap((fact) => (fact === undefined ? [] : [fact.field]));

// A reply from on-screen facts; nothing to cite means nothing to say.
const fromFacts = (
  facts: (NovaFact | undefined)[],
  text: string | undefined,
  cites: Citation[],
): NovaReply =>
  text === undefined || fieldsOf(facts).length === 0
    ? { kind: "nodata", text: NOT_ON_SCREEN }
    : { kind: "answer", text, cites, fields: fieldsOf(facts) };

const onScreen = (card: CardFacts): string =>
  [
    "the verdict",
    card.headline && "the sentence under it",
    card.rule && "the cells meeting the rule",
    card.pixel && "the pixel you clicked",
    "why the lens reads two channels",
    card.surroundings && "this spot against its surroundings",
    card.fire && "the NASA FIRMS fire context",
  ]
    .filter(Boolean)
    .join(", ");

const cardAnswer = (q: string, card: CardFacts, subject: Subject, mode: ChartMode): NovaReply => {
  const cites = citesOf(subject.sources);
  if (PROVENANCE.test(q))
    return { kind: "answer", text: provenance(subject), cites, fields: ["REAL chips"] };
  if (FIRE.test(q)) return fromFacts([card.fire], card.fire?.text, cites);
  if (WHY_TWO.test(q)) return fromFacts([card.whyTwo], card.whyTwo.text, cites);
  if (AROUND.test(q)) return fromFacts([card.surroundings], card.surroundings?.text, cites);
  if (PIXEL.test(q))
    return fromFacts(
      [card.pixel],
      card.pixel && `At the pixel you clicked: ${card.pixel.text}.`,
      cites,
    );
  if (CELLS.test(q))
    return fromFacts(
      [card.rule],
      card.rule &&
        `${card.rule.text} meet the lens's rule. Cells meeting a rule, not an affected area.`,
      cites,
    );
  if (LIMITS.test(q))
    return {
      kind: "answer",
      text: mode === "plain" ? subject.plainLimit : `${subject.plainLimit} ${subject.techLimit}`,
      cites,
      fields: ["More information"],
    };
  if (MEANING.test(q)) {
    const facts = [card.verdict, card.headline, mode === "technical" ? card.rule : undefined];
    const rule = mode === "technical" && card.rule ? ` ${card.rule.text} meet the rule.` : "";
    const text = `The ${card.lens} lens asks "${card.question}" Verdict: ${card.verdict.text}.${
      card.headline ? ` ${card.headline.text}` : ""
    }${rule}`;
    return fromFacts(facts, text, cites);
  }
  return {
    kind: "nodata",
    text: `I can only explain what's on this card: ${onScreen(card)}. Try one of the questions below.`,
  };
};

const provenance = (subject: Subject): string => {
  if (subject.demo)
    return "This answer is synthetic: the service marked it as a stand-in, not a measurement. Every demo value carries a DEMO chip.";
  if (subject.kind === "live")
    return "This answer was computed for this spot just now from NISAR L-band scenes: the passes, the numbers and the layers come from the radar service. It is diagnostic evidence, not a validated classifier, and the chips say what each value is.";
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
      fields: ["Map legend"],
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
      fields: ["Verdict"],
    };
  if (running)
    return {
      kind: "nodata",
      text: "The radar job is still running, so there's no result to explain yet. The panel shows where it is.",
    };
  // Nothing on screen to cite yet: say so, and how to get something.
  if (subject === undefined)
    return {
      kind: "nodata",
      text: "Pick a measured case on the globe, or click any land to ask the radar about that spot. I'll explain the result once it's on screen.",
    };
  if (context.card !== undefined) return cardAnswer(q, context.card, subject, mode);
  const cites = citesOf(subject.sources);
  if (PROVENANCE.test(q))
    return { kind: "answer", text: provenance(subject), cites, fields: ["Provenance chips"] };
  if (LIMITS.test(q))
    return {
      kind: "answer",
      text: mode === "plain" ? subject.plainLimit : `${subject.plainLimit} ${subject.techLimit}`,
      cites,
      fields: ["Limits"],
    };
  const verdict = VERDICT[subject.verdict];
  if (mode === "technical")
    return {
      kind: "answer",
      text: `State ${verdict.state}. ${subject.verdictLine} ${subject.techLimit}`,
      cites,
      fields: ["Verdict", "Limits"],
    };
  const stat =
    subject.stat !== undefined && subject.kind === "case"
      ? ` Across the area: ${subject.stat} ${subject.statLine ?? ""}`
      : "";
  return {
    kind: "answer",
    text: `${verdict.label}. ${subject.verdictLine}${stat}`.trim(),
    cites,
    fields: stat === "" ? ["Verdict"] : ["Verdict", "Across the area"],
  };
};
