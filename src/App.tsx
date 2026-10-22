import { useCallback, useMemo, useState } from "react";

import { PassToggle } from "@/features/controls/PassToggle";
import { FramePanel } from "@/features/frame-panel/FramePanel";
import type { Frame, PassDirection } from "@/features/frames/frame.types";
import { loadFrames } from "@/features/frames/frames";
import { GlobeView } from "@/features/globe/GlobeView";
import { useAsync, type AsyncState } from "@/lib/useAsync";

const FRAME_PARAM = "frame";
const NO_FRAMES: Frame[] = [];
const today = new Date().toISOString().slice(0, 10);

const readFrameParam = (): string | null =>
  new URLSearchParams(window.location.search).get(FRAME_PARAM);

// The selected frame lives in the URL (?frame=track-frame) so a view can be shared.
const writeFrameParam = (frame: Frame | undefined): void => {
  const url = new URL(window.location.href);
  if (frame === undefined) url.searchParams.delete(FRAME_PARAM);
  else url.searchParams.set(FRAME_PARAM, frame.id);
  window.history.replaceState(null, "", url);
};

export const App = () => {
  const { state: framesState, retry } = useAsync(loadFrames, "frames");
  // Undefined until the user picks one, so a shared link opens on the linked frame's pass.
  const [chosenPass, setChosenPass] = useState<PassDirection>();
  const [selectedId, setSelectedId] = useState(readFrameParam);

  const frames = framesState?.status === "success" ? framesState.data : NO_FRAMES;
  const selectedFrame = useMemo(
    () => frames.find((frame) => frame.id === selectedId),
    [frames, selectedId],
  );
  const pass = chosenPass ?? selectedFrame?.pass ?? "A";

  const select = useCallback((frame: Frame | undefined) => {
    setSelectedId(frame?.id ?? null);
    writeFrameParam(frame);
  }, []);
  const closePanel = useCallback(() => select(undefined), [select]);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-slate-950">
      <GlobeView
        frames={frames}
        pass={pass}
        selectedFrame={selectedFrame}
        onSelect={select}
        onShowWholeGlobe={closePanel}
      />

      <div className="absolute top-4 left-4 w-80 rounded-xl border border-white/10 bg-slate-950/85 p-4 text-slate-100 shadow-2xl backdrop-blur">
        <h1 className="text-lg">NISAR Fire Watch</h1>
        <p className="mt-1 text-sm text-slate-400">
          Hover the globe to find a NISAR radar frame. Click one to see its passes and burn
          analysis.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Scroll or pinch to zoom · drag to rotate · Esc closes the panel and zooms out
        </p>
        <div className="mt-3">
          <PassToggle value={pass} onChange={setChosenPass} />
        </div>
        <FramesStatus state={framesState} count={frames.length} onRetry={retry} />
      </div>

      {selectedFrame !== undefined && (
        <FramePanel
          key={selectedFrame.id}
          frame={selectedFrame}
          today={today}
          onClose={closePanel}
        />
      )}
    </main>
  );
};

type FramesStatusProps = {
  state: AsyncState<Frame[]> | undefined;
  count: number;
  onRetry: () => void;
};

const FramesStatus = ({ state, count, onRetry }: FramesStatusProps) => {
  if (state?.status === "error") {
    return (
      <div role="alert" data-testid="frames-status" className="mt-3 text-sm text-red-300">
        Could not load NISAR frames.{" "}
        <button type="button" onClick={onRetry} className="underline">
          Try again
        </button>
      </div>
    );
  }
  return (
    <p role="status" data-testid="frames-status" className="mt-3 text-xs text-slate-500">
      {state?.status === "success"
        ? `${count.toLocaleString("en-US")} frames from the NISAR Observation Plan`
        : "Loading NISAR frames…"}
    </p>
  );
};
