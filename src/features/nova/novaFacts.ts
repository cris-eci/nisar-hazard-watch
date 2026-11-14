import { LENS_COPY, STEP_6 } from "@/content/copyV8";
import type { Subject } from "@/features/case-panel/subject";
import { lensEvaluationOf, type ExplorationView } from "@/features/explore/exploreSchemas";
import { floodHeadline, ruleBlockOf } from "@/features/lenses/flood";
import { isCardLens, type CardLens } from "@/features/lenses/lensSlots";
import { surroundingsRow } from "@/features/lenses/surroundings";
import { cardVerdictOf, VERDICT_LABEL } from "@/features/lenses/verdictLabel";

// One thing the lens card shows, under the name it carries on screen, so a reply can cite it.
export type NovaFact = { field: string; text: string };

export type CardFacts = {
  lens: string;
  question: string;
  verdict: NovaFact;
  headline: NovaFact | undefined;
  rule: NovaFact | undefined;
  pixel: NovaFact | undefined;
  whyTwo: NovaFact;
  surroundings: NovaFact | undefined;
  fire: NovaFact | undefined;
};

const signed = (value: number): string =>
  `${value < 0 ? "−" : value > 0 ? "+" : ""}${Math.abs(value).toFixed(1)}`;

// The lens card's own headline functions. A lens without one shows no headline, so Nova has none.
const HEADLINE: Partial<Record<CardLens, (view: ExplorationView) => string | undefined>> = {
  flood_wetland: (view) =>
    floodHeadline(view.result === null ? undefined : lensEvaluationOf(view.result)),
};

// What the v8 lens card puts on screen for a live answer, built by the same pure functions it uses.
export const cardFactsOf = (subject: Subject, view: ExplorationView): CardFacts | undefined => {
  if (subject.kind !== "live" || !isCardLens(subject.lens)) return undefined;
  const lens = subject.lens;
  const copy = LENS_COPY[lens];
  const evaluation = view.result === null ? undefined : lensEvaluationOf(view.result);
  const headline = HEADLINE[lens]?.(view);
  const rule = lens === "flood_wetland" ? ruleBlockOf(evaluation, false) : undefined;
  const around = surroundingsRow(evaluation);
  const range = subject.normalRange;
  const fire = subject.fireContext;
  return {
    lens: copy.label,
    question: copy.question,
    verdict: { field: "Verdict", text: VERDICT_LABEL[cardVerdictOf(subject)] },
    headline: headline === undefined ? undefined : { field: "Headline", text: headline },
    rule: rule === undefined ? undefined : { field: STEP_6.ruleTitle, text: rule.text },
    pixel:
      range === undefined
        ? undefined
        : {
            field: STEP_6.pixelTitle,
            text: range.channels
              .map(
                ({ channel, delta, halfWidth }) =>
                  `${channel} ${STEP_6.pixelDelta(signed(delta))} (${STEP_6.pixelBand(halfWidth.toFixed(1), Math.abs(delta) <= halfWidth)})`,
              )
              .join(", "),
          },
    whyTwo: { field: STEP_6.whyTwoTitle, text: STEP_6.whyTwo[lens] },
    surroundings:
      around === undefined
        ? undefined
        : { field: STEP_6.surroundingsTitle, text: `${around.label}. ${around.sentence}` },
    fire:
      fire === undefined
        ? undefined
        : { field: "NASA FIRMS", text: `${fire.headline}. ${fire.note}` },
  };
};
