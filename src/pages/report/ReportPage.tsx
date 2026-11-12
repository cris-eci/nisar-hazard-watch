import "@/features/charts/charts.css";
import "@/pages/report/report.css";

import { useEffect, useState } from "react";

import { SOURCE, VERDICT } from "@/features/case-panel/verdicts";
import { CASES, findCase, findLens, type Case } from "@/features/cases/cases";
import { caseBandPasses } from "@/features/cases/demoBand";
import { BandChart } from "@/features/charts/BandChart";
import { ContrastBars } from "@/features/charts/ContrastBars";
import { formatDay } from "@/features/timeline/timelineLayout";
import { Link } from "@/lib/Link";
import { ProvenanceChip } from "@/lib/ProvenanceChip";
import { VERSION } from "@/pages/explorer/StartCard";
import { areaOf, reportSummary, SUMMARY_LABEL } from "@/pages/report/reportSummary";

const REPORT_CHART_PX = 220;

// /report?case=<id>: one printable A4 page per measured case (Report v7). DATA blocks come straight
// from the case; the summary above them is a template, labelled as such.
export const ReportPage = () => {
  const id = new URLSearchParams(window.location.search).get("case");
  const item = findCase(id);

  useEffect(() => {
    document.title =
      item === undefined
        ? "NISAR Hazard Watch · Report"
        : `${item.name} · NISAR Hazard Watch report`;
  }, [item]);

  return (
    <main className="r-page" data-testid="report">
      <div className="r-actions">
        <Link
          to={item === undefined ? "/explore" : `/explore?case=${item.id}`}
          className="r-button"
        >
          Back to the explorer
        </Link>
        {item !== undefined && (
          <button
            type="button"
            className="r-button r-button--dark"
            onClick={() => window.print()}
            data-testid="report-print"
          >
            Save as PDF
          </button>
        )}
      </div>
      {item === undefined ? <NoCase id={id} /> : <Report item={item} />}
    </main>
  );
};

const NoCase = ({ id }: { id: string | null }) => (
  <article className="r-sheet" data-testid="report-empty">
    <p className="r-kicker">NISAR Hazard Watch · Radar evidence report</p>
    <h1 className="r-title">
      {id === null ? "Pick a case to report on" : `No measured case called “${id}”`}
    </h1>
    <p>Reports cover the measured cases. Choose one:</p>
    <ul className="r-cases">
      {CASES.filter((entry) => entry.pending !== true).map((entry) => (
        <li key={entry.id}>
          <a href={`/report?case=${entry.id}`}>
            {entry.name}, {entry.place}
          </a>
        </li>
      ))}
    </ul>
  </article>
);

const Report = ({ item }: { item: Case }) => {
  const lens = findLens(item.lens);
  const group = item.groups?.[0];
  const bandPasses = caseBandPasses(item);
  const [lon, lat] = item.focus;
  const [generated] = useState(() => new Date().toISOString().slice(0, 10));
  return (
    <article className="r-sheet">
      <header className="r-head">
        <div className="r-head__main">
          <p className="r-kicker">NISAR Hazard Watch · Radar evidence report</p>
          <h1 className="r-title" data-testid="report-title">
            {item.name}, {item.place}
          </h1>
          <p className="r-sub">
            {lens?.chip} · {lens?.compares}
          </p>
        </div>
        <p className="r-meta">
          Case {item.id}
          <br />
          {lat.toFixed(3)}, {lon.toFixed(3)}
          <br />
          Generated {generated}
        </p>
      </header>

      <section className="r-summary" data-testid="report-summary">
        <p className="r-summary__head">
          <span>{SUMMARY_LABEL}</span>
          <span>Not AI-written · check every number against the data blocks</span>
        </p>
        <p className="r-summary__text">{reportSummary(item)}</p>
      </section>

      <section className="r-block">
        <p className="r-kicker">Data 1 · The question and the verdict</p>
        <dl className="r-facts">
          <Fact k="Question" v={lens?.chip ?? ""} />
          <Fact k="Target pass" v={item.target === undefined ? "—" : formatDay(item.target)} />
          <Fact k="Verdict" v={VERDICT[item.verdict].label} />
          <Fact k="Area" v={areaOf(item)} />
        </dl>
        <p className="r-line">
          {item.verdictLine}{" "}
          <ProvenanceChip
            kind={item.pending === true ? "todo" : "real"}
            source={SOURCE.caseVerdict}
          />
        </p>
      </section>

      <section className="r-block r-keep">
        <p className="r-kicker">Data 2 · The measurement at the point</p>
        {bandPasses === undefined ? (
          <p className="r-empty">
            No point time series for this lens yet. Nothing is drawn rather than a made-up line.
          </p>
        ) : (
          <div className="r-dark">
            <BandChart passes={bandPasses} mode="technical" height={REPORT_CHART_PX} />
          </div>
        )}
      </section>

      {group !== undefined && (
        <section className="r-block r-keep">
          <p className="r-kicker r-kicker--split">
            <span>Data 3 · Inside versus nearby, whole area</span>
            <ProvenanceChip kind="real" source={SOURCE.groups} />
          </p>
          <div className="r-dark">
            <ContrastBars group={group} mode="technical" />
          </div>
          <p className="r-line" data-testid="report-stat">
            <strong>{item.stat}</strong> {item.statLine}
          </p>
        </section>
      )}

      <section className="r-cols r-keep">
        <div className="r-block">
          <p className="r-kicker r-kicker--split">
            <span>Data 4 · Evidence and quality</span>
            <ProvenanceChip
              kind={item.pending === true ? "todo" : "real"}
              source={SOURCE.caseQuality}
            />
          </p>
          <dl className="r-quality">
            {item.quality.map((entry) => (
              <div key={entry.k}>
                <dt>{entry.k}</dt>
                <dd>{entry.v}</dd>
                <dd className="r-quality__why">{entry.why}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="r-block">
          <p className="r-kicker">Data 5 · What this can't tell you</p>
          <p>{item.plainLimit}</p>
          <p className="r-small">{item.techLimit}</p>
          {item.empties.length > 0 && (
            <p className="r-mono">Left empty: {item.empties.join(" · ")}</p>
          )}
        </div>
      </section>

      <section className="r-block r-keep">
        <p className="r-kicker">Sources</p>
        <ul className="r-sources">
          {item.sources.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noopener">
                {source.label}
              </a>{" "}
              · <span className="r-url">{source.href}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="r-foot">
        <span>Nova Frontier · NASA Space Apps 2026 · Chía</span>
        <span>{VERSION} · illustrative point series marked demo</span>
      </footer>
    </article>
  );
};

const Fact = ({ k, v }: { k: string; v: string }) => (
  <div>
    <dt>{k}</dt>
    <dd>{v}</dd>
  </div>
);
