import { useEffect, useState } from "react";

import type { ChangeAnalysis } from "@/features/analysis/analysis.types";
import { polarizationShort, type ChangeHazard } from "@/features/analysis/hazards";
import type { GlobeOverlay } from "@/features/analysis/overlay.types";
import { MethodDetails } from "@/features/frame-panel/MethodDetails";
import { SegmentedControl } from "@/lib/SegmentedControl";

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

type ChangeResultProps = {
  hazard: ChangeHazard;
  analysis: ChangeAnalysis;
  onOverlayChange: (overlay: GlobeOverlay | undefined) => void;
};

export const ChangeResult = ({ hazard, analysis, onOverlayChange }: ChangeResultProps) => {
  const [layer, setLayer] = useState<Layer>("severity");
  const { method, severityHa, layers } = analysis;
  const pol = polarizationShort(method.polarization);

  useEffect(() => {
    const url = { severity: layers.severityUrl, before: layers.beforeUrl, after: layers.afterUrl }[
      layer
    ];
    onOverlayChange({ url, bounds: layers.bounds });
    return () => onOverlayChange(undefined);
  }, [layers, layer, onOverlayChange]);

  return (
    <>
      <p data-testid="affected-area" className="mt-3 text-3xl tabular-nums">
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
      <dl className="mt-2 grid grid-cols-3 gap-2 text-xs tabular-nums">
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
          onChange={setLayer}
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
              {`${pol} backscatter on ${layer === "before" ? analysis.before.date : analysis.after.date}. ${hazard.backscatterHint}`}
            </p>
          </div>
        )}
      </div>

      <MethodDetails
        lines={[
          `${method.polarization} log-ratio ≤ ${method.changeThresholdDb} dB · multilook ${method.multilook} · ~${method.pixelSizeM} m pixels`,
        ]}
        analysis={analysis}
      />
    </>
  );
};
