import { describe, expect, it } from "vitest";

import real from "../fixtures/exploration-qadirabad.json";
import { explorationSchema, type ExplorationView } from "@/features/explore/exploreSchemas";
import { exploreSubject } from "@/features/explore/exploreSubject";
import { novaAnswer, suggestionsFor, type NovaContext } from "@/features/nova/novaAnswer";
import { cardFactsOf } from "@/features/nova/novaFacts";

// Nova on the v8 lens card of the real Qadirabad flood answer: every reply names the fields it read.
const VIEW: ExplorationView = explorationSchema.parse(real);
const SUBJECT = exploreSubject(VIEW, {
  name: "32.33° N, 73.71° E",
  frameLabel: "Track 84 · Frame 18",
  point: [73.713, 32.329],
});
if (SUBJECT === undefined) throw new Error("fixture has a subject");
const CARD = cardFactsOf(SUBJECT, VIEW);

const context = (mode: NovaContext["mode"] = "plain"): NovaContext => ({
  subject: SUBJECT,
  pending: undefined,
  running: false,
  mode,
  card: CARD,
});

const answer = (question: string, mode: NovaContext["mode"] = "plain") => {
  const reply = novaAnswer(question, context(mode));
  if (reply.kind !== "answer") throw new Error(`expected an answer to "${question}"`);
  return reply;
};

describe("cardFactsOf", () => {
  it("reads what the flood card shows, in its own words", () => {
    expect(CARD?.question).toBe("Did water appear here?");
    expect(CARD?.verdict).toEqual({ field: "Verdict", text: "Within its usual range" });
    expect(CARD?.headline?.text).toBe(
      "No new water at the exact spot you clicked. Around it, about a tenth of the area darkened the way calm new water does.",
    );
    expect(CARD?.rule).toEqual({
      field: "WHERE THE FLOOD RULE IS MET",
      text: "208,344 of 1,048,576 cells",
    });
    expect(CARD?.pixel?.text).toBe(
      "HH −1.2 dB (band ±3.0 dB · inside), HV −0.8 dB (band ±5.8 dB · inside)",
    );
    expect(CARD?.fire).toBeUndefined();
  });

  it("has no card facts for a measured case or ground motion (they keep the v7 summary)", () => {
    expect(cardFactsOf({ ...SUBJECT, kind: "case" }, VIEW)).toBeUndefined();
    expect(cardFactsOf({ ...SUBJECT, lens: "insar" }, VIEW)).toBeUndefined();
  });
});

describe("novaAnswer on a lens card", () => {
  it("explains the result with the verdict and the headline on screen, citing both", () => {
    const reply = answer("What does this mean?");
    expect(reply.text).toBe(
      'The Flood & wetland lens asks "Did water appear here?" Verdict: Within its usual range. No new water at the exact spot you clicked. Around it, about a tenth of the area darkened the way calm new water does.',
    );
    expect(reply.fields).toEqual(["Verdict", "Headline"]);
  });

  it("adds the rule cells in technical mode and cites them", () => {
    const reply = answer("What does this mean?", "technical");
    expect(reply.text).toContain("208,344 of 1,048,576 cells meet the rule.");
    expect(reply.fields).toEqual(["Verdict", "Headline", "WHERE THE FLOOD RULE IS MET"]);
  });

  it("answers the pixel, the two channels, the cells and the surroundings from their blocks", () => {
    expect(answer("What happened at my pixel?").fields).toEqual(["AT THE PIXEL YOU CLICKED"]);
    expect(answer("Why two channels?").fields).toEqual(["WHY TWO"]);
    const cells = answer("How many cells meet the rule?");
    expect(cells.text).toContain("208,344 of 1,048,576 cells");
    expect(cells.text).toContain("not an affected area");
    expect(answer("How does it compare with its surroundings?").fields).toEqual([
      "THIS SPOT VS ITS SURROUNDINGS",
    ]);
  });

  it("says it can't answer what the card does not show (no fire context on a flood answer)", () => {
    const reply = novaAnswer("Were there fires?", context());
    expect(reply).toEqual({
      kind: "nodata",
      text: "That isn't on this card for this answer, so I can't say. I only explain what the card shows.",
    });
  });

  it("never guesses: an off-card question lists what it can explain instead", () => {
    const reply = novaAnswer("Will it rain tomorrow?", context());
    expect(reply.kind).toBe("nodata");
    expect(reply.text).toContain("I can only explain what's on this card: the verdict");
    expect(reply.text).not.toMatch(/probab|hectare|caused by/i);
  });

  it("still refuses impact numbers before anything else", () => {
    expect(novaAnswer("How many people were affected?", context()).kind).toBe("nodata");
  });

  it("offers the card's own questions", () => {
    expect(suggestionsFor(true, true)).toEqual([
      "What does this mean?",
      "What happened at my pixel?",
      "Why two channels?",
      "Is this data real?",
    ]);
  });
});

describe("novaAnswer with nothing on screen", () => {
  it("says there is nothing to explain yet instead of answering", () => {
    const reply = novaAnswer("Where should I start?", {
      subject: undefined,
      pending: undefined,
      running: false,
      mode: "plain",
    });
    expect(reply.kind).toBe("nodata");
  });
});
