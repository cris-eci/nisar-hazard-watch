import { useEffect } from "react";

import type { GlobeOverlay } from "@/features/analysis/overlay.types";
import { BurnAnalysisCard } from "@/features/frame-panel/BurnAnalysisCard";
import { PassList } from "@/features/frame-panel/PassList";
import type { Frame } from "@/features/frames/frame.types";
import { CrossPolBadge } from "@/features/frames/FrameLabels";
import { PASS_LABEL } from "@/features/frames/passLabel";
import { fetchAcquisitions } from "@/features/frames/observationPlanApi";
import { useAsync } from "@/lib/useAsync";

type FramePanelProps = {
  frame: Frame;
  today: string;
  onClose: () => void;
  onOverlayChange: (overlay: GlobeOverlay | undefined) => void;
};

export const FramePanel = ({ frame, today, onClose, onOverlayChange }: FramePanelProps) => {
  const { state, retry } = useAsync(
    (signal) => fetchAcquisitions(frame.track, frame.frame, signal),
    frame.id,
  );

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <aside
      data-testid="frame-panel"
      aria-labelledby="frame-panel-title"
      className="absolute top-4 right-4 bottom-4 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-5 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/85 p-5 text-slate-100 shadow-2xl backdrop-blur"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 id="frame-panel-title" data-testid="frame-panel-title" className="text-lg">
            Track {frame.track} · Frame {frame.frame}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
            {PASS_LABEL[frame.pass]} pass <CrossPolBadge hasCrossPol={frame.hasCrossPol} />
          </div>
        </div>
        <button
          type="button"
          data-testid="frame-panel-close"
          aria-label="Close frame details"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-slate-400 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          ✕
        </button>
      </header>

      {state?.status === "loading" && (
        <p className="text-sm text-slate-400" role="status">
          Loading the observation plan…
        </p>
      )}

      {state?.status === "error" && (
        <div role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm">
          <p>Could not load the observation plan for this frame.</p>
          <p className="mt-1 text-slate-400">{state.error.message}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-2 rounded-md border border-white/20 px-3 py-1 hover:border-white/40"
          >
            Try again
          </button>
        </div>
      )}

      {state?.status === "success" && (
        <>
          <BurnAnalysisCard
            frame={frame}
            acquisitions={state.data}
            today={today}
            onOverlayChange={onOverlayChange}
          />
          <PassList acquisitions={state.data} today={today} />
        </>
      )}
    </aside>
  );
};
