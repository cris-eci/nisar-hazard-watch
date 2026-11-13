import { Icon } from "@/features/case-panel/icons";
import { Prov } from "@/features/case-panel/Prov";
import type { Subject } from "@/features/case-panel/subject";
import { VerdictGlyph } from "@/features/case-panel/Verdict";
import { bandSentence, SOURCE, VERDICT, VERDICT_ORDER } from "@/features/case-panel/verdicts";
import { NormalRangeCard } from "@/features/case-panel/NormalRangeCard";
import { findLens, OPTICAL } from "@/features/cases/cases";
import { BandChart } from "@/features/charts/BandChart";
import type { ChartMode } from "@/features/charts/chartTokens";
import { ContrastBars } from "@/features/charts/ContrastBars";
import { MatchedWhisker } from "@/features/charts/MatchedWhisker";
import { jobSteps } from "@/features/live/liveQuestion";
import { NovaGlyph } from "@/features/nova/NovaGlyph";
import { CompareSplit } from "@/features/sheet/CompareSplit";
import { formatDay } from "@/features/timeline/timelineLayout";

const CHANGE_RAMP = "linear-gradient(90deg,#2f6db5,#f2f0eb,#c2473a)";
const VIRIDIS = "linear-gradient(90deg,#440154,#3b528b,#21918c,#5ec962,#fde725)";

const OPTICAL_LEGEND = [
  { color: OPTICAL.newWater, label: "New open water" },
  { color: OPTICAL.stableWater, label: "Stable open water" },
  { color: OPTICAL.dry, label: "Stable non-water" },
  { color: OPTICAL.loss, label: "Open-water loss" },
  { color: OPTICAL.mixed, label: "Mixed or partial" },
  { color: OPTICAL.unsupported, label: "Unsupported" },
];

type SheetProps = {
  subject: Subject;
  mode: ChartMode;
  onMode: (mode: ChartMode) => void;
  onClose: () => void;
  onAskNova?: () => void;
};

// "More information": the five beats in full, with how it was computed, quality and sources.
export const MoreInfoSheet = ({ subject, mode, onMode, onClose, onAskNova }: SheetProps) => {
  const lens = findLens(subject.lens);
  const tech = mode === "technical";
  const [lon, lat] = subject.focus;
  const verdictProv = subject.demo ? SOURCE.liveVerdict : SOURCE.caseVerdict;
  return (
    <div className="x-sheet" role="dialog" aria-label="More information" data-testid="sheet">
      <header className="x-sheet__head">
        <div className="x-sheet__heading">
          <p className="x-kicker">
            {subject.name} · {lens?.chip} · {lat.toFixed(3)}, {lon.toFixed(3)}
          </p>
          <h2 className="x-sheet__title">
            What the radar measured{" "}
            {subject.kind === "case" ? `at ${subject.name}` : "at your point"}
          </h2>
        </div>
        <div role="group" aria-label="Reading level" className="x-switch">
          {(["plain", "technical"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => onMode(value)}
              data-testid={`read-${value}`}
            >
              {value === "plain" ? "Plain" : "Technical"}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="x-round x-round--big"
          onClick={onClose}
          aria-label="Close (Esc)"
          data-testid="sheet-close"
        >
          <Icon name="close" size={16} />
        </button>
      </header>

      <div className="x-sheet__body">
        <div className="x-sheet__main">
          <section className="x-sheet__section">
            <p className="x-sheet__kicker">01 · The question</p>
            <div className="x-cards">
              <Fact
                k="Where"
                v={subject.name}
                s={
                  subject.chipKm === undefined
                    ? subject.place
                    : `${subject.place} · ${subject.chipKm} km area`
                }
              />
              <Fact
                k="When"
                v={subject.target === undefined ? subject.when : formatDay(subject.target)}
                s="target pass against earlier passes"
              />
              <Fact k="Question" v={lens?.chip ?? ""} s={lens?.compares ?? ""} />
            </div>
          </section>

          <section className="x-sheet__section">
            <p className="x-sheet__kicker">02 · The measurement</p>
            {subject.figure !== undefined && (
              <figure className="x-figure">
                <img
                  src={subject.figure}
                  alt={`Backend report figure for ${subject.name}`}
                  loading="lazy"
                />
                <figcaption>
                  Real figure · NISAR-Modeling report <Prov kind="real" source={SOURCE.figure} />
                </figcaption>
              </figure>
            )}
            {subject.normalRange !== undefined && (
              <div className="x-inset">
                <NormalRangeCard range={subject.normalRange} />
                {subject.stat !== undefined && (
                  <p className="x-panel__stat" data-testid="sheet-stat">
                    <strong>{subject.stat}</strong> {subject.statLine}
                  </p>
                )}
              </div>
            )}
            {subject.passes !== undefined && (
              <div className="x-inset">
                <BandChart
                  passes={subject.passes}
                  mode={mode}
                  height={240}
                  sentence={bandSentence(subject.passes)}
                />
              </div>
            )}
            {subject.crops !== undefined && (
              <>
                <div className="x-tiles">
                  <Tile
                    src={subject.crops.base}
                    title="Before · HH"
                    ramp={VIRIDIS}
                    scale={["−30 dB", "0 dB"]}
                    text="Median of the baseline passes."
                  />
                  <Tile
                    src={subject.crops.signature}
                    title="Signature"
                    text="Cells meeting the declared darkening rule, both channels."
                  />
                  <Tile
                    src={subject.crops.change}
                    title="Change · HH"
                    ramp={CHANGE_RAMP}
                    scale={["−8", "+8 dB"]}
                    text="Blue darker, red brighter, grey no data."
                  />
                </div>
                <div className="x-compare x-inset">
                  <CompareSplit
                    left={{ src: subject.crops.change, label: "Radar change" }}
                    right={{ src: subject.crops.optical, label: "Optical classes" }}
                  />
                  <div className="x-compare__text">
                    <p className="x-compare__title">
                      Drag to compare the radar with the optical map
                    </p>
                    <p>
                      Left of the handle: the radar change in HH. Right: OPERA's optical classes for
                      the same square. Where the optical map shows new water, look for blue (darker)
                      radar change, and for blue change where there was no new water.
                    </p>
                    <ul className="x-swatches">
                      {OPTICAL_LEGEND.map((item) => (
                        <li key={item.label}>
                          <i style={{ background: item.color }} />
                          {item.label}
                        </li>
                      ))}
                    </ul>
                    <Prov kind="real" source={SOURCE.crop} />
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="x-sheet__section">
            <p className="x-sheet__kicker x-kicker--split">
              <span>03 · The verdict, in plain words</span>
              <Prov kind={subject.demo ? "demo" : "real"} source={verdictProv} />
            </p>
            <div className="x-verdicts">
              {VERDICT_ORDER.map((verdict) => {
                const on = verdict === subject.verdict;
                return (
                  <div
                    key={verdict}
                    className="x-verdicts__card"
                    data-on={on}
                    data-testid={`sheet-verdict-${verdict}`}
                  >
                    <VerdictGlyph verdict={verdict} />
                    <p className="x-verdicts__label">{VERDICT[verdict].label}</p>
                    <p className="x-verdicts__sub">
                      {on ? subject.verdictLine : VERDICT[verdict].sub}
                    </p>
                    {tech && on && <p className="x-mono-sm">{VERDICT[verdict].state}</p>}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="x-sheet__section">
            <p className="x-sheet__kicker">04 · The second witness</p>
            {subject.witness === undefined ? (
              <p className="x-muted">
                {subject.kind === "live"
                  ? "No second witness: optical evidence was not requested for this question."
                  : "No second witness yet: the optical stage runs after the radar."}
              </p>
            ) : (
              <p className="x-witness">
                <span>{subject.witness.label}</span>
                <span>{subject.witness.note}</span>
              </p>
            )}
            {subject.groups.length > 0 && (
              <div className="x-inset x-inset--stack">
                <div className="x-inset__chip">
                  <Prov kind="real" source={SOURCE.groups} />
                </div>
                {subject.groups.map((group) => (
                  <div key={group.title} className="x-group">
                    <p className="x-group__title">
                      {group.title} <span>{group.sub}</span>
                    </p>
                    <ContrastBars group={group} mode={mode} />
                  </div>
                ))}
                <p className="x-muted x-small">
                  Shares of cells in each group. Neighbouring cells are not independent, so these
                  describe the scene, not accuracy.
                </p>
                {subject.matched !== undefined && (
                  <div className="x-group x-group--rule">
                    <MatchedWhisker matched={subject.matched} />
                    <Prov kind="real" source={SOURCE.matched} />
                  </div>
                )}
              </div>
            )}
            {subject.groups.length === 0 && subject.reason !== undefined && (
              <p className="x-reason">{subject.reason}</p>
            )}
          </section>

          <section className="x-sheet__section">
            <p className="x-sheet__kicker">05 · What this can't tell you</p>
            <div className="x-limits">
              <div className="x-limits__col">
                <p className="x-limits__head">{subject.plainLimit}</p>
                {tech && (
                  <p className="x-muted" data-testid="tech-limit">
                    {subject.techLimit}
                  </p>
                )}
                {subject.alternatives.length > 0 && (
                  <>
                    <p className="x-muted x-small">Other things that change radar like this:</p>
                    <ul className="x-tags">
                      {subject.alternatives.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <div className="x-limits__col">
                <p className="x-kicker">Left empty on purpose</p>
                <ul className="x-tags x-tags--empty">
                  {subject.empties.map((item) => (
                    <li key={item}>{item} · —</li>
                  ))}
                </ul>
                <p className="x-muted x-small">
                  The radar measures how the echo changed. It doesn't name a cause, guess a
                  probability or forecast.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="x-sheet__side">
          {subject.compute !== undefined && subject.compute.length > 0 && (
            <div className="x-card">
              <p className="x-kicker x-kicker--split">
                <span>How this was computed</span>
                <Prov kind="real" source={SOURCE.liveQuality} />
              </p>
              <ol className="x-steps x-steps--done" data-testid="sheet-compute">
                {subject.compute.map((step) => (
                  <li key={step.label} className="x-step" data-state="done">
                    <span className="x-step__dot">
                      <Icon name="tick" size={10} />
                    </span>
                    <span className="x-step__text">
                      {step.label}
                      <span className="x-step__sub">{step.sub}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {subject.lens !== "insar" && subject.compute === undefined && (
            <div className="x-card">
              <p className="x-kicker x-kicker--split">
                <span>How this was computed</span>
                <Prov kind="real" source={SOURCE.steps} />
              </p>
              <ol className="x-steps x-steps--done">
                {jobSteps(subject.lens).map((step, index) => {
                  // Only the measured flood cases had an optical stage; elsewhere it didn't run.
                  const skipped = index === 5 && subject.crops === undefined;
                  return (
                    <li
                      key={step.label}
                      className="x-step"
                      data-state={skipped ? "skipped" : "done"}
                    >
                      <span className="x-step__dot">
                        <Icon name="tick" size={10} />
                      </span>
                      <span className="x-step__text">
                        {skipped ? step.label.replace("Looking for", "No") : step.label}
                        <span className="x-step__sub">
                          {skipped ? "not used for this result" : step.sub}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
          <div className="x-card">
            <p className="x-kicker x-kicker--split">
              <span>Evidence and quality</span>
              <Prov
                kind={subject.demo ? "demo" : "real"}
                source={subject.demo ? SOURCE.liveQuality : SOURCE.caseQuality}
              />
            </p>
            <dl className="x-evidence">
              {subject.quality.map((item) => (
                <div key={item.k}>
                  <dt>{item.k}</dt>
                  <dd>{item.v}</dd>
                  <dd className="x-evidence__why">{item.why}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="x-card">
            <p className="x-kicker">Sources</p>
            <ul className="x-sources">
              {subject.sources.map((source) => (
                <li key={source.href}>
                  <a href={source.href} target="_blank" rel="noopener">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {onAskNova !== undefined && (
            <button type="button" className="x-ask-nova" onClick={onAskNova} data-testid="ask-nova">
              <NovaGlyph size={32} />
              Ask Nova about this result
            </button>
          )}
        </aside>
      </div>
    </div>
  );
};

const Fact = ({ k, v, s }: { k: string; v: string; s: string }) => (
  <div className="x-fact">
    <span className="x-fact__k">{k}</span>
    <span className="x-fact__v">{v}</span>
    <span className="x-fact__s">{s}</span>
  </div>
);

type TileProps = {
  src: string;
  title: string;
  text: string;
  ramp?: string;
  scale?: [string, string];
};

const Tile = ({ src, title, text, ramp, scale }: TileProps) => (
  <figure className="x-tile">
    <img src={src} alt={title} loading="lazy" />
    <figcaption>
      <span className="x-tile__title">
        {title}
        <Prov kind="real" source={SOURCE.crop} />
      </span>
      {ramp !== undefined && <span className="x-tile__ramp" style={{ background: ramp }} />}
      {scale !== undefined && (
        <span className="x-tile__scale">
          <span>{scale[0]}</span>
          <span>{scale[1]}</span>
        </span>
      )}
      <span className="x-tile__text">{text}</span>
    </figcaption>
  </figure>
);
