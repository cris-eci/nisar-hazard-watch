import type { ReactNode } from "react";

import { LENS_COPY, type V8LensId } from "@/content/copyV8";
import type { LensId } from "@/features/cases/cases";
import type { Subject } from "@/features/case-panel/subject";
import type { ExplorationView, LensEvaluation } from "@/features/explore/exploreSchemas";
import type { LiveLayer } from "@/features/explore/exploreLayers";

/*
 * How a lens adds its parts to LensResultCard without touching the shell. Each lens has its own
 * file (floodSlots.tsx, vegetationSlots.tsx, wildfireSlots.tsx, agricultureSlots.tsx) exporting a
 * function from this context to its slots; lensSlotsRegistry.ts only maps ids to them.
 */
export type CardLens = V8LensId;

export const isCardLens = (lens: LensId): lens is CardLens => lens in LENS_COPY;

export type LensSlotContext = {
  // The whole answer (dates, scenes, layers).
  view: ExplorationView;
  // The lens evaluation in camelCase (exploreSchemas.lensEvaluationOf); undefined when absent.
  evaluation: LensEvaluation | undefined;
  // What the rest of the panel reads: verdict, normal range, fire context…
  subject: Subject;
  // The answer's layers, and the one on the globe now, for a slot that offers "On the globe".
  layers: LiveLayer[];
  shownLayerId: string | undefined;
  onShowLayer: (id: string | undefined) => void;
  // Reduced motion: render the final state at once.
  reduce: boolean;
};

export type LensSlots = {
  // The headline sentence, built from fields by the lens's pure module (flood: floodHeadline).
  headline?: string | undefined;
  // The lens's own "where the rule is met" block, right after the header.
  extra?: ReactNode;
  // SECOND WITNESS (#22 OPERA optical, #27 NASA FIRMS for wildfire).
  witness?: ReactNode;
  // POSSIBLE DRIVERS, always with its HYPOTHESIS · NOT A RESULT chip (SPECS-v8 §6.5).
  drivers?: ReactNode;
};

export type LensSlotsOf = (context: LensSlotContext) => LensSlots;
