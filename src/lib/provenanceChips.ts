import { CHIP_COPY } from "@/content/copyV8";

export type Provenance = keyof typeof CHIP_COPY;

export type ChipSpec = {
  text: string;
  testId: string;
  // The CSS look (`c-prov--<look>`): the dated variants share the look of their plain kind.
  look: string;
  // Tooltip when the caller gives no source; only where the design writes one.
  title?: string;
  // Only REAL can be hidden (Help → "Show REAL labels"); DEMO, TO FILL and HYPOTHESIS never hide.
  hideable: boolean;
};

export const CHIPS: Record<Provenance, ChipSpec> = {
  real: { text: CHIP_COPY.real, testId: "prov-real", look: "real", hideable: true },
  realDates: {
    text: CHIP_COPY.realDates,
    testId: "prov-real-dates",
    look: "real",
    title: "Dates and values from the job manifest",
    hideable: false,
  },
  demo: { text: CHIP_COPY.demo, testId: "prov-demo", look: "demo", hideable: false },
  demoDates: {
    text: CHIP_COPY.demoDates,
    testId: "prov-demo-dates",
    look: "demo",
    hideable: false,
  },
  todo: { text: CHIP_COPY.todo, testId: "prov-todo", look: "todo", hideable: false },
  pending: { text: CHIP_COPY.pending, testId: "prov-pending", look: "pending", hideable: false },
  unavailable: {
    text: CHIP_COPY.unavailable,
    testId: "prov-unavailable",
    look: "unavailable",
    hideable: false,
  },
  experimental: {
    text: CHIP_COPY.experimental,
    testId: "prov-experimental",
    look: "experimental",
    hideable: false,
  },
  hypothesis: {
    text: CHIP_COPY.hypothesis,
    testId: "prov-hypothesis",
    look: "hypothesis",
    title: "Interpretation, not a measurement",
    hideable: false,
  },
  instant: { text: CHIP_COPY.instant, testId: "prov-instant", look: "instant", hideable: false },
};

export const isChipHidden = (kind: Provenance, hideReal: boolean): boolean =>
  hideReal && CHIPS[kind].hideable;

export const chipTitle = (kind: Provenance, source?: string): string | undefined =>
  source ?? CHIPS[kind].title;
