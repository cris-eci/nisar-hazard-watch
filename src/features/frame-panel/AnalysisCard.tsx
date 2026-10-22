import { useEffect, useState } from "react";

import type { HazardAnalysis } from "@/features/analysis/analysis.types";
import { fetchAnalysis } from "@/features/analysis/analysisApi";
import { pickComparisonPair } from "@/features/analysis/comparisonPair";
import { polarizationShort, type HazardDefinition } from "@/features/analysis/hazards";
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

const SEVERITY_LEVELS = [
  { key: "low", label: "Low" },
  { key: "moderate", label: "Moderate" },
  { key: "high", label: "High" },
] as const;

const formatHa = (ha: number): string => `${ha.toLocaleString("en-US")} ha`;

const layerUrl = ({ layers }: HazardAnalysis, layer: Layer): string =>
  ({ severity: layers.severityUrl, before: layers.beforeUrl, after: layers.afterUrl })[layer];

type AnalysisCardProps = {
  hazard: HazardDefinition;
  frame: Frame;
  acquisitions: Acquisition[];
  today: string;
  onOverlayChange: (overlay: GlobeOverlay | undefined) => void;
};

export const AnalysisCard = ({
  hazard,
  frame,
  acquisitions,
  today,
  onOverlayChange,
}: AnalysisCardProps) => {
  const pair = pickComparisonPair(acquisitions, today, hazard.requiresCrossPol);
  const [before, after] = pair ?? [];
  const request =
    before && after
      ? {
          hazard: hazard.id,
          track: frame.track,
          frame: frame.frame,
          beforeDate: before.date,
          afterDate: after.date,
        }
      : undefined;

  const { state, retry } = useAsync(
    (signal) =>
      request === undefined
        ? Promise.reject(new Error("No comparison pair"))
        : fetchAnalysis(frame, request, signal),
    request && `${hazard.id}:${frame.id}:${request.beforeDate}:${request.afterDate}`,
  );
  const [layer, setLayer] = useState<Layer>("severity");

  const analysis = state?.status === "success" ? state.data : undefined;
  useEffect(() => {
    if (analysis === undefined) return;
    onOverlayChange({ url: layerUrl(analysis, layer), bounds: analysis.layers.bounds });
    return () => onOverlayChange(undefined);
  }, [analysis, layer, onOverlayChange]);

  const pol = polarizationShort(hazard.polarization);

  if (request === undefined) {
    return (
      <section className="rounded-lg border border-white/10 p-4 text-sm text-slate-400">
        Not enough {hazard.requiresCrossPol ? "HH+HV " : ""}passes yet to compare before and after
        on this frame.
      </section>
    );
  }

  return (
    <section data-testid="analysis-card" className="rounded-lg border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-slate-300">{hazard.analysisTitle}</h3>
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
        {request.beforeDate} → {request.afterDate} · {pol} change between two passes
      </p>

      {state?.status === "loading" && (
        <div role="status" className="mt-4 space-y-3">
          <p className="text-sm text-slate-300">Comparing {pol} backscatter between both passes…</p>
          <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
          <div className="h-2 animate-pulse rounded-full bg-white/10" />
        </div>
      )}

      {state?.status === "error" && (
        <div role="alert" className="mt-3 text-sm">
          <p>
            The {hazard.analysisTitle.toLowerCase()} failed: {state.error.message}
          </p>
          <button type="button" onClick={retry} className="mt-2 underline">
            Try again
          </button>
        </div>
      )}

      {analysis !== undefined && (
        <AnalysisResult
          hazard={hazard}
          analysis={analysis}
          layer={layer}
          onLayerChange={setLayer}
        />
      )}
    </section>
  );
};

type AnalysisResultProps = {
  hazard: HazardDefinition;
  analysis: HazardAnalysis;
  layer: Layer;
  onLayerChange: (layer: Layer) => void;
};

const AnalysisResult = ({ hazard, analysis, layer, onLayerChange }: AnalysisResultProps) => {
  const { method, severityHa } = analysis;
  const pol = polarizationShort(method.polarization);

  return (
    <>
      <p data-testid="affected-area" className="mt-3 text-3xl">
        {formatHa(analysis.affectedAreaHa)}
      </p>
      <p className="text-sm text-slate-400">
        {hazard.affectedLabel} · mean {pol} change {analysis.meanChangeDb} dB
      </p>

      <div className="mt-3 flex h-2 overflow-hidden rounded-full" aria-hidden="true">
        {SEVERITY_LEVELS.map(({ key }) => (
          <div
            key={key}
            style={{ flexGrow: severityHa[key], backgroundColor: hazard.severityColors[key] }}
          />
        ))}
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
        {SEVERITY_LEVELS.map(({ key, label }) => (
          <div key={key}>
            <dt style={{ color: hazard.severityColors[key] }}>{label}</dt>
            <dd>{formatHa(severityHa[key])}</dd>
          </div>
        ))}
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
        {layer === "severity" ? (
          <p className="mt-2 flex gap-3 text-xs text-slate-400">
            {SEVERITY_LEVELS.map(({ key, label }) => (
              <span key={key} className="flex items-center gap-1">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: hazard.severityColors[key] }}
                />
                {label}
              </span>
            ))}
          </p>
        ) : (
          <div className="mt-2 text-xs text-slate-400">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-black to-white" />
            <div className="mt-1 flex justify-between">
              <span>−22 dB</span>
              <span>−4 dB</span>
            </div>
            <p className="mt-1">
              {pol} backscatter on {layer === "before" ? analysis.before.date : analysis.after.date}
              . {hazard.backscatterHint}
            </p>
          </div>
        )}
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
