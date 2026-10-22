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
  const signal = isDeformation
    ? "interferogram"
    : `${polarizationShort(hazard.polarization)} change`;

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
        {request.beforeDate} → {request.afterDate} · {signal} between two passes
      </p>

      {state?.status === "loading" && (
        <div role="status" className="mt-4 space-y-3">
          <p className="text-sm text-slate-300">
            {isDeformation
              ? "Unwrapping the interferogram between both passes…"
              : `Comparing ${polarizationShort(hazard.polarization)} backscatter between both passes…`}
          </p>
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

      {analysis?.kind === "change" && hazard.kind === "change" && (
        <ChangeResult hazard={hazard} analysis={analysis} onOverlayChange={onOverlayChange} />
      )}
      {analysis?.kind === "deformation" && (
        <DeformationResult analysis={analysis} onOverlayChange={onOverlayChange} />
      )}
    </section>
  );
};
