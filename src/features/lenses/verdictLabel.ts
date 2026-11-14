import { STEP_6 } from "@/content/copyV8";
import type { Subject } from "@/features/case-panel/subject";
import type { Verdict } from "@/features/cases/cases";

export const VERDICT_LABEL: Record<Verdict, string> = {
  departure: STEP_6.verdictDeparture,
  within: STEP_6.verdictWithin,
  insufficient: STEP_6.verdictNotEnough,
};

// The lens card has no "measured" state: a ground-motion style answer reads as not enough data.
export const cardVerdictOf = (subject: Subject): Verdict =>
  subject.verdict === "measured" ? "insufficient" : subject.verdict;
