import type { AnalysisRequest } from "@/features/analysis/analysis.types";
import { fetchAnalysis } from "@/features/analysis/analysisApi";
import { pickComparisonPair } from "@/features/analysis/comparisonPair";
import { polarizationShort, type HazardDefinition } from "@/features/analysis/hazards";
import type { GlobeOverlay } from "@/features/analysis/overlay.types";
import type { FeaturedEvent } from "@/features/events/events";
import { ChangeResult } from "@/features/frame-panel/ChangeResult";
import { DeformationResult } from "@/features/frame-panel/DeformationResult";
import type { Acquisition, Frame } from "@/features/frames/frame.types";
import { useAsync } from "@/lib/useAsync";

type AnalysisCardProps = {
  hazard: HazardDefinition;
  frame: Frame;
  acquisitions: Acquisition[];
  today: string;
  event: FeaturedEvent | undefined;
  onOverlayChange: (overlay: GlobeOverlay | undefined) => void;
};

// An event fixes the pair (it must bracket the quake); otherwise use the latest usable passes.
const buildRequest = (
  hazard: HazardDefinition,
  frame: Frame,
  acquisitions: Acquisition[],
  today: string,
  event: FeaturedEvent | undefined,
): AnalysisRequest | undefined => {
  const base = { hazard: hazard.id, track: frame.track, frame: frame.frame };
  if (event?.pair !== undefined) {
    const [beforeDate, afterDate] = event.pair;
    return { ...base, beforeDate, afterDate, focus: event.focus };
  }
  const pair = pickComparisonPair(acquisitions, today, hazard.requiresCrossPol);
  if (pair === undefined) return undefined;
  const [before, after] = pair;
  return {
    ...base,
    beforeDate: before.date,
    afterDate: after.date,
    ...(event && { focus: event.focus }),
  };
};

export const AnalysisCard = ({
  hazard,
  frame,
  acquisitions,
  today,
  event,
  onOverlayChange,
}: AnalysisCardProps) => {
  const request = buildRequest(hazard, frame, acquisitions, today, event);
  const { state, retry } = useAsync(
    (signal) =>
      request === undefined
        ? Promise.reject(new Error("No comparison pair"))
        : fetchAnalysis(frame, request, signal),
    request && `${hazard.id}:${frame.id}:${request.beforeDate}:${request.afterDate}`,
  );
  const analysis = state?.status === "success" ? state.data : undefined;
  const isDeformation = hazard.kind === "deformation";
  const pol = polarizationShort(hazard.polarization);

  if (request === undefined) {
    return (
      <>
        <h3 className="x-panel__section-title">{hazard.analysisTitle}</h3>
        <p className="x-panel__note">
          Not enough {hazard.requiresCrossPol ? "HH+HV " : ""}passes yet to compare before and after
          on this frame.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="x-panel__section-head">
        <h3 className="x-panel__section-title">{hazard.analysisTitle}</h3>
        {analysis?.isDemo === true && (
          <span
            title="Generated in the browser until the NISAR pipeline API is connected"
            className="x-chip-demo"
          >
            Demo data
          </span>
        )}
      </div>
      <p className="x-mono x-panel__pair">
        {request.beforeDate} → {request.afterDate} ·{" "}
        {isDeformation ? "interferogram" : `${pol} change`}
      </p>

      {state?.status === "loading" && (
        <div role="status" className="x-loading">
          <p>
            {isDeformation
              ? "Unwrapping the interferogram between both passes…"
              : `Comparing ${pol} backscatter between both passes…`}
          </p>
          <div className="x-shimmer" style={{ height: 44, width: 180 }} />
          <div className="x-shimmer" style={{ height: 8, borderRadius: 4 }} />
        </div>
      )}

      {state?.status === "error" && (
        <div role="alert" className="x-panel__error">
          <p>
            The {hazard.analysisTitle.toLowerCase()} failed: {state.error.message}
          </p>
          <button type="button" onClick={retry} className="x-panel__retry">
            Try again
          </button>
        </div>
      )}

      {analysis?.kind === "change" && hazard.kind === "change" && (
        <ChangeResult hazard={hazard} analysis={analysis} onOverlayChange={onOverlayChange} />
      )}
      {analysis?.kind === "deformation" && (
        <DeformationResult analysis={analysis} onOverlayChange={onOverlayChange} />
      )}
    </>
  );
};
