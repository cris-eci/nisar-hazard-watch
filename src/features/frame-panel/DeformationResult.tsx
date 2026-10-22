import { useEffect, useState } from "react";

import type { DeformationAnalysis } from "@/features/analysis/analysis.types";
import type { GlobeOverlay } from "@/features/analysis/overlay.types";
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

  useEffect(() => {
    const url = layer === "displacement" ? layers.displacementUrl : layers.fringesUrl;
    onOverlayChange({ url, bounds: layers.bounds });
    return () => onOverlayChange(undefined);
  }, [layers, layer, onOverlayChange]);

  return (
    <>
      <p data-testid="max-displacement" className="mt-3 text-3xl tabular-nums">
        {analysis.maxTowardCm} cm
      </p>
      <p className="text-sm text-slate-400">
        peak motion toward the satellite · {analysis.maxAwayCm} cm away
      </p>
      <p className="mt-2 text-sm text-slate-300">
        {analysis.deformedAreaKm2.toLocaleString("en-US")} km² moved more than{" "}
        {analysis.deformedThresholdCm} cm
      </p>

      <div className="mt-4">
        <p className="mb-1.5 text-xs text-slate-500">Map layer on the globe</p>
        <SegmentedControl
          label="Map layer"
          options={LAYER_OPTIONS}
          value={layer}
          onChange={setLayer}
          testIdPrefix="analysis-layer"
        />
        {layer === "displacement" ? (
          <div className="mt-2 text-xs text-slate-400">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 via-white to-red-600" />
            <div className="mt-1 flex justify-between">
              <span>−{layers.colorScaleCm} cm away</span>
              <span>0</span>
              <span>+{layers.colorScaleCm} cm toward</span>
            </div>
            <p className="mt-1">
              Line-of-sight motion of the ground. Red lobes rose or moved toward the satellite, blue
              ones sank or moved away.
            </p>
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-400">
            <div className="h-1.5 rounded-full bg-[linear-gradient(90deg,red,yellow,lime,cyan,blue,magenta,red)]" />
            <p className="mt-1">
              Each full colour cycle is {(method.wavelengthCm / 2).toFixed(1)} cm of motion: count
              the rings to read how far the ground moved.
            </p>
          </div>
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
