import { FireContextCard } from "@/features/case-panel/FireContextCard";
import { Icon } from "@/features/case-panel/icons";
import { InsarCard } from "@/features/case-panel/InsarCard";
import { Prov } from "@/features/case-panel/Prov";
import { QualityStrip } from "@/features/case-panel/QualityStrip";
import type { Subject } from "@/features/case-panel/subject";
import { NormalRangeCard } from "@/features/case-panel/NormalRangeCard";
import { VerdictCard } from "@/features/case-panel/Verdict";
import { SOURCE } from "@/features/case-panel/verdicts";
import type { Case } from "@/features/cases/cases";
import { BandChart } from "@/features/charts/BandChart";
import type { ChartMode } from "@/features/charts/chartTokens";
import { ContrastBars } from "@/features/charts/ContrastBars";

const PANEL_CHART_PX = 108;

type SummaryProps = { subject: Subject; mode: ChartMode; onMore: () => void };

// The five facts of a result: verdict, chart, whole-area bars, headline stat and quality.
export const ResultSummary = ({ subject, mode, onMore }: SummaryProps) => {
  const group = subject.groups[0];
  const qualitySource = subject.demo ? SOURCE.liveQuality : SOURCE.caseQuality;
  return (
    <>
      <VerdictCard verdict={subject.verdict} line={subject.verdictLine} demo={subject.demo} />
      {subject.passes !== undefined && (
        <BandChart passes={subject.passes} mode={mode} height={PANEL_CHART_PX} compact />
      )}
      {subject.normalRange !== undefined && <NormalRangeCard range={subject.normalRange} compact />}
      {subject.insar !== undefined && <InsarCard insar={subject.insar} />}
      {group !== undefined && (
        <div className="x-panel__block">
          <p className="x-kicker x-kicker--split">
            <span>{group.title} · whole area</span>
            <Prov
              kind={subject.demo ? "demo" : "real"}
              source={subject.kind === "live" ? SOURCE.liveQuality : SOURCE.groups}
            />
          </p>
          <ContrastBars group={group} mode={mode} compact />
        </div>
      )}
      {subject.stat !== undefined && (
        <p className="x-panel__stat" data-testid="panel-stat">
          <strong>{subject.stat}</strong> {subject.statLine}
        </p>
      )}
      {subject.reason !== undefined && <p className="x-reason">{subject.reason}</p>}
      {subject.fireContext !== undefined && <FireContextCard context={subject.fireContext} />}
      <QualityStrip items={subject.quality} />
      <p className="x-panel__prov">
        Quality strip <Prov kind={subject.demo ? "demo" : "real"} source={qualitySource} />
        {subject.passes !== undefined && (
          <>
            {" · Chart "}
            <Prov
              kind="demo"
              source="Point time series is illustrative. Real source: observations at the clicked pixel"
            />
          </>
        )}
      </p>
      {subject.figure !== undefined && subject.crops === undefined && (
        <a className="x-link" href={subject.figure} target="_blank" rel="noopener">
          Open the report figure
        </a>
      )}
      <button type="button" className="x-primary" onClick={onMore} data-testid="more-info">
        More information
        <Icon name="arrow" size={14} />
      </button>
    </>
  );
};

// Chocó: the event is real, the measurement isn't there yet, so nothing pretends to be a result.
export const PendingSummary = ({ item }: { item: Case }) => (
  <>
    <div className="x-pending" data-testid="pending">
      <p className="x-pending__title">{item.verdictLine}</p>
      {item.reason !== undefined && <p className="x-pending__why">{item.reason}</p>}
    </div>
    <p className="x-panel__stat">
      <strong>{item.stat}</strong> · {item.statLine}
    </p>
    <ul className="x-facts">
      {item.quality.map((fact) => (
        <li key={fact.k}>
          <span>{fact.k}</span>
          <span className="x-facts__v">
            {fact.v}
            <Prov kind="todo" source={`${fact.why} ${SOURCE.todo}`} />
          </span>
        </li>
      ))}
    </ul>
    <ul className="x-sources">
      {item.sources.map((source) => (
        <li key={source.href}>
          <a href={source.href} target="_blank" rel="noopener">
            {source.label}
          </a>
        </li>
      ))}
    </ul>
  </>
);
