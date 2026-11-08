import type { ChartMode } from "@/features/charts/chartTokens";
import { ContrastBars } from "@/features/charts/ContrastBars";
import { ProvenanceChip } from "@/lib/ProvenanceChip";
import {
  BENCH,
  BENCH_MAX_DB,
  BENCH_METHODS,
  BENCH_SOURCE,
  EVIDENCE,
  formatSignedDb,
  INTERVAL_DOMAIN,
  toPercent,
  type Evidence,
  type Interval,
} from "@/pages/method/methodContent";

const pct = (value: number): string => `${toPercent(value, INTERVAL_DOMAIN).toFixed(2)}%`;

// A matched contrast with its resampling interval against a marked zero, one row per channel.
const IntervalRow = ({ interval }: { interval: Interval }) => (
  <div
    className={`m-interval m-interval--${interval.channel.toLowerCase()}`}
    role="img"
    aria-label={`${interval.channel} ${formatSignedDb(interval.value)} dB, interval ${formatSignedDb(interval.low)} to ${formatSignedDb(interval.high)} dB`}
  >
    <span className="m-interval__k">{interval.channel}</span>
    <span className="m-interval__track">
      <span className="m-interval__axis" />
      <span className="m-interval__zero" style={{ left: pct(0) }} />
      <span
        className="m-interval__ci"
        style={{
          left: pct(interval.low),
          width: `calc(${pct(interval.high)} - ${pct(interval.low)})`,
        }}
      />
      <span className="m-interval__point" style={{ left: pct(interval.value) }} />
    </span>
    <span className="m-interval__v">{formatSignedDb(interval.value)}</span>
  </div>
);

const EvidenceCard = ({ item, mode }: { item: Evidence; mode: ChartMode }) => (
  <article
    className={item.works ? "m-card m-card--works" : "m-card"}
    data-reveal
    data-testid={`evidence-${item.id}`}
  >
    <div className="m-card__top">
      <span className="m-card__tag">
        <span className="m-card__glyph" aria-hidden="true" />
        {item.works ? "Works" : "Fails or unclear"}
      </span>
      <span className="m-card__where">{item.where}</span>
    </div>
    <h3 className="m-card__title">{item.title}</h3>
    {item.group !== undefined && (
      <div data-draw>
        <ContrastBars group={item.group} mode={mode} />
      </div>
    )}
    {item.intervals !== undefined && (
      <div className="m-card__intervals" data-draw>
        {item.intervals.map((interval) => (
          <IntervalRow key={interval.channel} interval={interval} />
        ))}
        <p className="m-card__note">Vertical line · zero difference · dB</p>
      </div>
    )}
    {item.stat !== undefined && <p className="m-card__stat">{item.stat}</p>}
    <p className="m-card__body">{item.body}</p>
    <p className="m-card__foot">
      <a href={item.href} target="_blank" rel="noopener noreferrer">
        {item.link}
      </a>
      <ProvenanceChip kind="real" source={item.source} />
    </p>
  </article>
);

const Benchmark = () => (
  <div className="m-bench" data-reveal data-testid="method-benchmark">
    <div className="m-bench__copy">
      <span className="m-card__tag m-bench__tag">
        <span className="m-bench__glyph" aria-hidden="true" />A learned model that loses
      </span>
      <h3 className="m-bench__title">
        Our Transformer rebuilds hidden passes worse than two simple baselines.
      </h3>
      <p className="m-bench__body">
        So it stays an experiment and never labels anything. Error in dB, lower is better, on two
        cases left out of training (not yet an independent geographic holdout).
      </p>
      <p className="m-card__foot">
        <a href={BENCH_SOURCE} target="_blank" rel="noopener noreferrer">
          Benchmark results →
        </a>
        <ProvenanceChip
          kind="real"
          source="NISAR-Modeling · docs/results/model_benchmark_all_dates.json · pooled RMSE"
        />
      </p>
    </div>
    <div className="m-bench__regions" data-draw>
      {BENCH.map(({ region, hidden, rmse }) => (
        <div key={region} className="m-bench__region">
          <p className="m-bench__head">
            <span>{region}</span>
            <span className="m-bench__hidden">{hidden}</span>
          </p>
          {BENCH_METHODS.map((method, i) => {
            const value = rmse[i] ?? 0;
            return (
              <div key={method} className={`m-bench__row m-bench__row--${i}`}>
                <span className="m-bench__k">{method}</span>
                <span
                  className="m-bench__track"
                  role="meter"
                  aria-label={`${region} · ${method} RMSE`}
                  aria-valuemin={0}
                  aria-valuemax={BENCH_MAX_DB}
                  aria-valuenow={value}
                >
                  <span
                    className="m-bench__fill"
                    style={{ width: `${(value / BENCH_MAX_DB) * 100}%` }}
                  />
                </span>
                <span className="m-bench__v">{value.toFixed(3)} dB</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  </div>
);

export const EvidenceSection = ({ mode }: { mode: ChartMode }) => (
  <section className="m-section" data-section aria-labelledby="evidence-heading">
    <div className="m-section__head" data-reveal>
      <p className="m-kicker">04 · Where it works, where it fails</p>
      <h2 id="evidence-heading" className="m-h2">
        Held-out places, real numbers, failures included.
      </h2>
      <p className="m-lead">
        These sites were chosen by fixed rules before seeing results. Showing where the method
        breaks is how you know the rest isn&apos;t cherry-picked.
      </p>
    </div>
    <div className="m-cards" data-testid="method-evidence">
      {EVIDENCE.map((item) => (
        <EvidenceCard key={item.id} item={item} mode={mode} />
      ))}
    </div>
    <Benchmark />
  </section>
);
