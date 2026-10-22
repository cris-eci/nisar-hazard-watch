import { useEffect, useState } from "react";

import type { ChangeAnalysis } from "@/features/analysis/analysis.types";
import { polarizationShort, type ChangeHazard } from "@/features/analysis/hazards";
import type { GlobeOverlay } from "@/features/analysis/overlay.types";
import { MapLegend } from "@/features/frame-panel/MapLegend";
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
  const colors = hazard.severityColors;

  useEffect(() => {
    const url = { severity: layers.severityUrl, before: layers.beforeUrl, after: layers.afterUrl }[
      layer
    ];
    onOverlayChange({ url, bounds: layers.bounds });
    return () => onOverlayChange(undefined);
  }, [layers, layer, onOverlayChange]);

  return (
    <>
      <p data-testid="affected-area" className="x-result__big">
        {formatHa(analysis.affectedAreaHa)}
      </p>
      <p className="x-result__sub">
        {hazard.affectedLabel} · mean {pol} change {analysis.meanChangeDb} dB
      </p>

      <div className="x-severity__bar" aria-hidden="true">
        {SEVERITY_LEVELS.map(({ key }) => (
          <div key={key} style={{ flexGrow: severityHa[key], backgroundColor: colors[key] }} />
        ))}
      </div>
      <dl className="x-severity__levels">
        {SEVERITY_LEVELS.map(({ key, label }) => (
          <div key={key}>
            <dt>
              <span className="x-swatch" style={{ backgroundColor: colors[key] }} />
              {label}
            </dt>
            <dd>{formatHa(severityHa[key])}</dd>
          </div>
        ))}
      </dl>

      <div className="x-layer">
        <p className="x-mono">Layer on the globe</p>
        <SegmentedControl
          label="Map layer"
          options={LAYER_OPTIONS}
          value={layer}
          onChange={setLayer}
          testIdPrefix="analysis-layer"
        />
        {layer === "severity" ? (
          <MapLegend
            bar={`linear-gradient(90deg, ${colors.low} 0 33%, ${colors.moderate} 33% 66%, ${colors.high} 66%)`}
            scale={[`≤ ${method.changeThresholdDb} dB`, "−4", "≤ −6 dB"]}
            text="Severity from the drop in backscatter between both passes."
          />
        ) : (
          <MapLegend
            bar="linear-gradient(90deg, #000, #fff)"
            scale={["−22 dB", "−4 dB"]}
            text={`${pol} backscatter on ${layer === "before" ? analysis.before.date : analysis.after.date}. ${hazard.backscatterHint}`}
          />
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
