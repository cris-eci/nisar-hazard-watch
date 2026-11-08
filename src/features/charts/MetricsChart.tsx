import "@/features/charts/charts.css";

import type { ChartMode } from "@/features/charts/chartTokens";
import {
  formatMetric,
  METRIC_LABEL,
  METRIC_ORDER,
  METRIC_MEANING,
  visibleMetrics,
  type MetricId,
  type ModelScores,
} from "@/features/charts/metrics";
import { ProvenanceChip } from "@/lib/ProvenanceChip";

type MetricsChartProps = {
  models: ModelScores[];
  mode: ChartMode;
};

const CAPTION: Record<ChartMode, string> = {
  plain:
    "Scores from each model card. A score near 1 means the model matched the reference closely, but only on the few places tested. All three stay experimental.",
  technical:
    "Scores from each model card. Test sites are few and specific; the disturbance scores reuse development data. All three stay not_ready_for_general_use: tree cover doesn't prove natural forest, and disturbance doesn't prove permanent deforestation.",
};

// Plain HTML bars on one fixed 0–1 axis for every row; metrics differ by shade and pattern
// (c-metric--<id>), so colour is never the only cue.
export const MetricsChart = ({ models, mode }: MetricsChartProps) => {
  const tech = mode === "technical";
  const legend: MetricId[] = tech ? METRIC_ORDER : ["f1"];
  return (
    <figure className={`c-metrics${tech ? "c-metrics--tech" : ""}`} data-testid="metrics-chart">
      <div className="c-metrics__legend">
        {legend.map((id) => (
          <span key={id} className="c-metrics__key">
            <span className={`c-metrics__swatch c-metric--${id}`} aria-hidden="true" />
            {tech
              ? METRIC_LABEL[id]
              : "F1 score, 0 to 1 (precision and recall where no F1 is reported)"}
          </span>
        ))}
        <span className="c-metrics__axis">0 → 1 · same axis for every row</span>
      </div>

      {models.map((model) => (
        <div key={model.name} className="c-metrics__model" data-testid="metrics-model">
          <div className="c-metrics__head">
            <p className="c-metrics__name">
              {model.name}
              <span className="c-metrics__badge">Experimental</span>
              <ProvenanceChip kind="real" source={model.source} />
            </p>
            <p className="c-metrics__sub">{model.sub}</p>
            {tech && <p className="c-metrics__impl">{model.impl}</p>}
            <a
              href={model.href}
              target="_blank"
              rel="noopener noreferrer"
              className="c-metrics__card"
            >
              Model card →
            </a>
          </div>
          <div className="c-metrics__tests">
            {model.tests.map((test) => (
              <div key={test.label} className="c-metrics__test">
                <p className="c-metrics__label">
                  {test.label}
                  <span
                    className={`c-metrics__tag${test.warn === true ? "c-metrics__tag--warn" : ""}`}
                  >
                    {test.tag}
                  </span>
                </p>
                {visibleMetrics(test.values, mode).map((id) => {
                  const value = test.values[id];
                  const name = `${model.name} · ${test.label} · ${METRIC_LABEL[id]}`;
                  return (
                    <div
                      key={id}
                      className="c-metrics__row"
                      data-testid={`metric-${id}`}
                      tabIndex={0}
                      {...(value === null
                        ? { role: "img", "aria-label": `${name}: not reported` }
                        : {
                            role: "meter",
                            "aria-label": name,
                            "aria-valuemin": 0,
                            "aria-valuemax": 1,
                            "aria-valuenow": value,
                          })}
                    >
                      <span className="c-metrics__k">{METRIC_LABEL[id]}</span>
                      <span
                        className={`c-metrics__track${value === null ? "c-metrics__track--empty" : ""}`}
                      >
                        {value === null ? (
                          <span className="c-metrics__none">Not reported</span>
                        ) : (
                          <span
                            className={`c-metrics__fill c-metric--${id}`}
                            style={{ width: `${value * 100}%` }}
                          />
                        )}
                      </span>
                      <span className="c-metrics__v">
                        {value === null ? "—" : formatMetric(value)}
                      </span>
                      <span className="c-tip c-metrics__tip" role="tooltip">
                        <span className="c-metrics__tip-title">{name}</span>
                        <span className="c-metrics__tip-v">
                          {value === null ? "not reported" : formatMetric(value)}
                        </span>
                        <span className="c-metrics__tip-d">{METRIC_MEANING[id]}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}

      <figcaption className="c-metrics__caption">{CAPTION[mode]}</figcaption>
    </figure>
  );
};
