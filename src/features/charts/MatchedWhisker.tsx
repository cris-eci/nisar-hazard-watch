import "@/features/charts/charts.css";

import type { Matched } from "@/features/cases/cases";

const MIN = -10;
const MAX = 0;
const TICKS = [-10, -8, -6, -4, -2, 0];

const toX = (value: number): number => ((value - MIN) / (MAX - MIN)) * 100;

// One matched-pairs contrast with its resampling interval, against a marked zero.
export const MatchedWhisker = ({ matched }: { matched: Matched }) => {
  const [low, high] = matched.ci;
  return (
    <figure className="c-whisker" data-testid="matched-whisker">
      <p className="c-whisker__title">{matched.title}</p>
      <p className="c-whisker__n">{matched.n}</p>
      <svg viewBox="0 0 100 18" preserveAspectRatio="none" className="c-whisker__plot" aria-hidden>
        <line x1="0" y1="9" x2="100" y2="9" stroke="rgba(235,233,228,0.14)" strokeWidth="0.4" />
        <line x1={toX(0)} y1="2" x2={toX(0)} y2="16" stroke="#ebe9e4" strokeWidth="0.5" />
        <line x1={toX(low)} y1="9" x2={toX(high)} y2="9" stroke="#ebe9e4" strokeWidth="0.6" />
        <line x1={toX(low)} y1="5" x2={toX(low)} y2="13" stroke="#ebe9e4" strokeWidth="0.6" />
        <line x1={toX(high)} y1="5" x2={toX(high)} y2="13" stroke="#ebe9e4" strokeWidth="0.6" />
      </svg>
      <div className="c-whisker__point" style={{ left: `${toX(matched.v)}%` }}>
        <span>{matched.v.toFixed(2)} dB</span>
      </div>
      <div className="c-whisker__ticks" aria-hidden>
        {TICKS.map((tick) => (
          <span key={tick} style={{ left: `${toX(tick)}%` }}>
            {tick}
          </span>
        ))}
      </div>
      <figcaption className="c-whisker__line">{matched.line}</figcaption>
    </figure>
  );
};
