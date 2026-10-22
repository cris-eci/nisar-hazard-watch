import { useEffect, useState } from "react";

import type { DeformationAnalysis } from "@/features/analysis/analysis.types";
import type { GlobeOverlay } from "@/features/analysis/overlay.types";
import { MapLegend } from "@/features/frame-panel/MapLegend";
import { MethodDetails } from "@/features/frame-panel/MethodDetails";
import { SegmentedControl } from "@/lib/SegmentedControl";

type Layer = "displacement" | "fringes";

const LAYER_OPTIONS: Array<{ value: Layer; label: string }> = [
  { value: "displacement", label: "Displacement" },
  { value: "fringes", label: "Fringes" },
];

type DeformationResultProps = {
  analysis: DeformationAnalysis;
  onOverlayChange: (overlay: GlobeOverlay | undefined) => void;
};

export const DeformationResult = ({ analysis, onOverlayChange }: DeformationResultProps) => {
  const [layer, setLayer] = useState<Layer>("displacement");
  const { layers, method } = analysis;
  const cycleCm = (method.wavelengthCm / 2).toFixed(1);

  useEffect(() => {
    const url = layer === "displacement" ? layers.displacementUrl : layers.fringesUrl;
    onOverlayChange({ url, bounds: layers.bounds });
    return () => onOverlayChange(undefined);
  }, [layers, layer, onOverlayChange]);

  return (
    <>
      <p data-testid="max-displacement" className="x-result__big">
        {analysis.maxTowardCm} cm
      </p>
      <p className="x-result__sub">
        peak motion toward the satellite · {analysis.maxAwayCm} cm away
      </p>
      <p className="x-result__area">
        {analysis.deformedAreaKm2.toLocaleString("en-US")} km² moved more than{" "}
        {analysis.deformedThresholdCm} cm
      </p>

      <div className="x-layer">
        <p className="x-mono">Layer on the globe</p>
        <SegmentedControl
          label="Map layer"
          options={LAYER_OPTIONS}
          value={layer}
          onChange={setLayer}
          testIdPrefix="analysis-layer"
        />
        {layer === "displacement" ? (
          <MapLegend
            bar="linear-gradient(90deg, #2563eb, #fff, #dc2626)"
            scale={[`−${layers.colorScaleCm} cm away`, "0", `+${layers.colorScaleCm} cm toward`]}
            text="Line-of-sight motion of the ground. Red lobes rose or moved toward the satellite, blue ones sank or moved away."
          />
        ) : (
          <MapLegend
            bar="linear-gradient(90deg, red, yellow, lime, cyan, blue, magenta, red)"
            scale={["0", `${cycleCm} cm`]}
            text={`Each full colour cycle is ${cycleCm} cm of motion: count the rings to read how far the ground moved.`}
          />
        )}
      </div>

      <MethodDetails
        lines={[
          `NISAR ${method.product} interferogram · L-band λ ${method.wavelengthCm} cm · ` +
            `ionosphere ${method.ionosphereCorrected ? "corrected" : "not corrected"} · ~${method.pixelSizeM} m pixels`,
        ]}
        analysis={analysis}
      />
    </>
  );
};
