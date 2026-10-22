import { useEffect, useState } from "react";

import type { BurnAnalysis } from "@/features/analysis/analysis.types";
import { fetchBurnAnalysis } from "@/features/analysis/analysisApi";
import { pickComparisonPair } from "@/features/analysis/comparisonPair";
import type { GlobeOverlay } from "@/features/analysis/overlay.types";
import type { Acquisition, Frame } from "@/features/frames/frame.types";
import { SegmentedControl } from "@/lib/SegmentedControl";
import { useAsync } from "@/lib/useAsync";

type Layer = "severity" | "before" | "after";

const LAYER_OPTIONS: Array<{ value: Layer; label: string }> = [
  { value: "severity", label: "Severity" },
  { value: "before", label: "Before" },
  { value: "after", label: "After" },
];

const formatHa = (ha: number): string => `${ha.toLocaleString("en-US")} ha`;

const layerUrl = ({ layers }: BurnAnalysis, layer: Layer): string =>
  ({ severity: layers.severityUrl, before: layers.beforeHvUrl, after: layers.afterHvUrl })[layer];

type BurnAnalysisCardProps = {
  frame: Frame;
  acquisitions: Acquisition[];
  today: string;
  onOverlayChange: (overlay: GlobeOverlay | undefined) => void;
};

export const BurnAnalysisCard = ({
  frame,
  acquisitions,
  today,
  onOverlayChange,
}: BurnAnalysisCardProps) => {
  const pair = pickComparisonPair(acquisitions, today);
  const [before, after] = pair ?? [];
  const request =
    before && after
      ? { track: frame.track, frame: frame.frame, beforeDate: before.date, afterDate: after.date }
      : undefined;

  const { state, retry } = useAsync(
    (signal) =>
      request === undefined
        ? Promise.reject(new Error("No comparison pair"))
        : fetchBurnAnalysis(frame, request, signal),
    request && `${frame.id}:${request.beforeDate}:${request.afterDate}`,
  );
  const [layer, setLayer] = useState<Layer>("severity");

  const analysis = state?.status === "success" ? state.data : undefined;
  useEffect(() => {
    if (analysis === undefined) return;
    onOverlayChange({ url: layerUrl(analysis, layer), bounds: analysis.layers.bounds });
    return () => onOverlayChange(undefined);
  }, [analysis, layer, onOverlayChange]);

  if (request === undefined) {
    return (
      <section className="rounded-lg border border-white/10 p-4 text-sm text-slate-400">
        Not enough HH+HV passes yet to compare before and after on this frame.
      </section>
    );
  }

  return (
    <section data-testid="burn-analysis" className="rounded-lg border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-slate-300">Burn analysis</h3>
        {analysis?.isDemo === true && (
          <span
            title="Generated in the browser until the NISAR pipeline API is connected"
            className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-300"
          >
            Demo data
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {request.beforeDate} → {request.afterDate} · HV change between two HH+HV passes
      </p>

      {state?.status === "loading" && <AnalysisLoading />}

      {state?.status === "error" && (
        <div role="alert" className="mt-3 text-sm">
          <p>The burn analysis failed: {state.error.message}</p>
          <button type="button" onClick={retry} className="mt-2 underline">
            Try again
          </button>
        </div>
      )}

      {analysis !== undefined && (
        <AnalysisResult analysis={analysis} layer={layer} onLayerChange={setLayer} />
      )}
    </section>
  );
};

const AnalysisLoading = () => (
  <div role="status" className="mt-4 space-y-3">
    <p className="text-sm text-slate-300">Comparing HV backscatter between both passes…</p>
    <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
    <div className="h-2 animate-pulse rounded-full bg-white/10" />
  </div>
);

type AnalysisResultProps = {
  analysis: BurnAnalysis;
  layer: Layer;
  onLayerChange: (layer: Layer) => void;
};

const AnalysisResult = ({ analysis, layer, onLayerChange }: AnalysisResultProps) => {
  const { low, moderate, high } = analysis.severityHa;
  const { method } = analysis;

  return (
    <>
      <p data-testid="burned-area" className="mt-3 text-3xl">
        {formatHa(analysis.burnedAreaHa)}
      </p>
      <p className="text-sm text-slate-400">burned · mean HV change {analysis.meanHvChangeDb} dB</p>

      <div className="mt-3 flex h-2 overflow-hidden rounded-full" aria-hidden="true">
        <div className="bg-yellow-400" style={{ flexGrow: low }} />
        <div className="bg-orange-500" style={{ flexGrow: moderate }} />
        <div className="bg-red-600" style={{ flexGrow: high }} />
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <SeverityStat label="Low" ha={low} className="text-yellow-300" />
        <SeverityStat label="Moderate" ha={moderate} className="text-orange-400" />
        <SeverityStat label="High" ha={high} className="text-red-400" />
      </dl>

      <div className="mt-4">
        <p className="mb-1.5 text-xs text-slate-500">Map layer on the globe</p>
        <SegmentedControl
          label="Map layer"
          options={LAYER_OPTIONS}
          value={layer}
          onChange={onLayerChange}
          testIdPrefix="analysis-layer"
        />
        <LayerLegend analysis={analysis} layer={layer} />
      </div>

      <details className="mt-4 text-xs text-slate-400">
        <summary className="cursor-pointer text-slate-300">Method and source scenes</summary>
        <ul className="mt-2 space-y-1">
          <li>
            {method.polarization} log-ratio ≤ {method.changeThresholdDb} dB · multilook{" "}
            {method.multilook} · ~{method.pixelSizeM} m pixels
          </li>
          <li className="break-all">Before: {analysis.before.granuleId}</li>
          <li className="break-all">After: {analysis.after.granuleId}</li>
          <li>Generated {new Date(analysis.generatedAt).toLocaleString("en-US")}</li>
        </ul>
      </details>
    </>
  );
};

type SeverityStatProps = { label: string; ha: number; className: string };

const SeverityStat = ({ label, ha, className }: SeverityStatProps) => (
  <div>
    <dt className={className}>{label}</dt>
    <dd>{formatHa(ha)}</dd>
  </div>
);

const LayerLegend = ({ analysis, layer }: { analysis: BurnAnalysis; layer: Layer }) =>
  layer === "severity" ? (
    <p className="mt-2 flex gap-3 text-xs text-slate-400">
      <LegendSwatch className="bg-yellow-400" label="Low" />
      <LegendSwatch className="bg-orange-500" label="Moderate" />
      <LegendSwatch className="bg-red-600" label="High" />
    </p>
  ) : (
    <div className="mt-2 text-xs text-slate-400">
      <div className="h-1.5 rounded-full bg-gradient-to-r from-black to-white" />
      <div className="mt-1 flex justify-between">
        <span>−22 dB</span>
        <span>−4 dB</span>
      </div>
      <p className="mt-1">
        HV backscatter on {layer === "before" ? analysis.before.date : analysis.after.date}. Dark is
        smooth or burned ground, bright is dense canopy.
      </p>
    </div>
  );

const LegendSwatch = ({ className, label }: { className: string; label: string }) => (
  <span className="flex items-center gap-1">
    <span className={`h-2.5 w-2.5 rounded-sm ${className}`} />
    {label}
  </span>
);
