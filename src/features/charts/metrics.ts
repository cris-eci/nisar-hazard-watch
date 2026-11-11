import type { ChartMode } from "@/features/charts/chartTokens";

/*
 * Scores of the experimental classifiers, as published in each NISAR-Models model card. A model
 * can carry several tests side by side (held-out next to development) so nothing is cherry-picked.
 */

export type MetricId = "precision" | "recall" | "f1" | "iou";

// null = the model card does not report it. It is drawn as an empty track, never as 0.
export type MetricValues = Record<MetricId, number | null>;

export type ModelTest = {
  label: string;
  tag: string;
  // Development data reused as the test: the tag turns into a dashed amber warning.
  warn?: boolean;
  values: MetricValues;
};

export type ModelScores = {
  name: string;
  sub: string;
  impl: string;
  href: string;
  source: string;
  tests: ModelTest[];
};

export const METRIC_ORDER: MetricId[] = ["precision", "recall", "f1", "iou"];

export const METRIC_LABEL: Record<MetricId, string> = {
  precision: "Precision",
  recall: "Recall",
  f1: "F1",
  iou: "IoU",
};

export const METRIC_MEANING: Record<MetricId, string> = {
  precision: "Of the cells the model marked, the share that were right.",
  recall: "Of the cells that really were the class, the share the model found.",
  f1: "One number balancing precision and recall.",
  iou: "Overlap between the model's map and the reference map.",
};

// Plain shows F1; where a card reports no F1 it falls back to precision and recall, so a test
// never disappears just because one number is missing.
export const visibleMetrics = (values: MetricValues, mode: ChartMode): MetricId[] => {
  if (mode === "technical") return METRIC_ORDER;
  return values.f1 === null ? ["precision", "recall"] : ["f1"];
};

// Three decimals only where two would round a 0.997 up to a perfect-looking 1.00.
export const formatMetric = (value: number): string =>
  value >= 0.995 && value < 1 ? value.toFixed(3) : value.toFixed(2);

const MODELS_REPO = "https://github.com/Ch0comilo/NISAR-Models/blob/main";

export const MODEL_SCORES: ModelScores[] = [
  {
    name: "Water",
    sub: "Water or not water on one date",
    impl: "HGB round5 · radar + terrain prior",
    href: `${MODELS_REPO}/nisar-water/model-card-spatial-v2.md`,
    source: "NISAR-Models · nisar-water/model-card-spatial-v2.md",
    tests: [
      {
        label: "Unseen lake · Lake Red Rock, Iowa",
        tag: "1 held-out site",
        values: { precision: 0.9864, recall: 0.809, f1: 0.8889, iou: 0.8001 },
      },
      {
        label: "Development data",
        tag: "Development",
        values: { precision: 0.5807, recall: 0.7108, f1: null, iou: null },
      },
    ],
  },
  {
    name: "Tree cover",
    sub: "Canopy on one date",
    impl: "Hybrid spatial CNN v2 · threshold 0.90",
    href: `${MODELS_REPO}/nisar-forest/docs/spatial-forest-v2-model-card.md`,
    source: "NISAR-Models · nisar-forest/docs/spatial-forest-v2-model-card.md",
    tests: [
      {
        label: "Brittany, France",
        tag: "Test site",
        values: { precision: 0.9973, recall: 0.9426, f1: 0.9692, iou: null },
      },
      {
        label: "Chiang Mai, Thailand",
        tag: "Test site",
        values: { precision: 1, recall: 0.9439, f1: 0.9711, iou: null },
      },
    ],
  },
  {
    name: "Tree-cover disturbance",
    sub: "Loss across five dates, 3 before and 2 after",
    impl: "Temporal CPU v2 · threshold 0.50",
    href: `${MODELS_REPO}/nisar-land-change/docs/MODELO_TEMPORAL_CPU_V2.md`,
    source:
      "NISAR-Models · nisar-land-change/docs/MODELO_TEMPORAL_CPU_V2.md · scored on reused development data only",
    tests: [
      {
        label: "Development data · no independent test yet",
        tag: "Reused dev data",
        warn: true,
        values: { precision: 0.9024, recall: 0.9737, f1: 0.9367, iou: 0.881 },
      },
    ],
  },
];
