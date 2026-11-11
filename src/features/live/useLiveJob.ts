import { useEffect, useState } from "react";

import type { Acquisition, Frame } from "@/features/frames/frame.types";
import { fetchAcquisitions } from "@/features/frames/observationPlanApi";
import { JOB_STEP_COUNT } from "@/features/live/liveQuestion";
import { useAsync, type AsyncState } from "@/lib/useAsync";

export type LiveJob = {
  plan: AsyncState<Acquisition[]> | undefined;
  // Steps finished so far; the first one waits for the real Observation Plan answer.
  done: number;
  ready: boolean;
  retry: () => void;
};

// The first step is real (the frame's passes); the other five are DEMO-timed until /v1/jobs exists.
export const useLiveJob = (frame: Frame | undefined, runKey: string, stepMs: number): LiveJob => {
  const { state: plan, retry } = useAsync(
    (signal) =>
      frame === undefined
        ? Promise.resolve([])
        : fetchAcquisitions(frame.track, frame.frame, signal),
    frame === undefined ? undefined : `${frame.id}|${runKey}`,
  );
  const hasPasses = plan?.status === "success" && plan.data.length > 0;
  const jobKey = hasPasses ? runKey : undefined;
  // Ticks belong to one job: a new question starts counting from zero without resetting state.
  const [ticks, setTicks] = useState({ key: "", count: 0 });

  useEffect(() => {
    if (jobKey === undefined) return;
    const timer = window.setInterval(
      () =>
        setTicks((previous) => ({
          key: jobKey,
          count: previous.key === jobKey ? previous.count + 1 : 1,
        })),
      stepMs,
    );
    return () => window.clearInterval(timer);
  }, [jobKey, stepMs]);

  const done =
    jobKey === undefined
      ? 0
      : Math.min(JOB_STEP_COUNT, 1 + (ticks.key === jobKey ? ticks.count : 0));
  return { plan, done, ready: done >= JOB_STEP_COUNT, retry };
};
