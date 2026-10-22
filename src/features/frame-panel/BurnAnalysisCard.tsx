import { mockBurnAnalysis, pickComparisonPair } from "@/features/analysis/burnAnalysis";
import type { Acquisition } from "@/features/frames/frame.types";

type BurnAnalysisCardProps = { frameId: string; acquisitions: Acquisition[]; today: string };

const formatHa = (ha: number): string => `${ha.toLocaleString("en-US")} ha`;

export const BurnAnalysisCard = ({ frameId, acquisitions, today }: BurnAnalysisCardProps) => {
  const pair = pickComparisonPair(acquisitions, today);

  if (pair === undefined) {
    return (
      <section className="rounded-lg border border-white/10 p-4 text-sm text-slate-400">
        Not enough HH+HV passes yet to compare before and after on this frame.
      </section>
    );
  }

  const analysis = mockBurnAnalysis(frameId, pair);
  const { low, moderate, high } = analysis.severityHa;

  return (
    <section data-testid="burn-analysis" className="rounded-lg border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-slate-300">Burn analysis</h3>
        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-300">
          Mock data
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {analysis.beforeDate} → {analysis.afterDate} (HH+HV passes)
      </p>

      <p className="mt-3 text-3xl">{formatHa(analysis.burnedAreaHa)}</p>
      <p className="text-sm text-slate-400">burned · mean HV change {analysis.meanHvDropDb} dB</p>

      <div className="mt-3 flex h-2 overflow-hidden rounded-full" aria-hidden="true">
        <div className="bg-yellow-400" style={{ flexGrow: low }} />
        <div className="bg-orange-500" style={{ flexGrow: moderate }} />
        <div className="bg-red-600" style={{ flexGrow: high }} />
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-yellow-300">Low</dt>
          <dd>{formatHa(low)}</dd>
        </div>
        <div>
          <dt className="text-orange-400">Moderate</dt>
          <dd>{formatHa(moderate)}</dd>
        </div>
        <div>
          <dt className="text-red-400">High</dt>
          <dd>{formatHa(high)}</dd>
        </div>
      </dl>
    </section>
  );
};
