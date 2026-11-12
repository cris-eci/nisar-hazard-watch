import type { Acquisition, Frame } from "@/features/frames/frame.types";
import { fetchAcquisitions } from "@/features/frames/observationPlanApi";
import { useAsync, type AsyncState } from "@/lib/useAsync";

export type FramePlan = { plan: AsyncState<Acquisition[]> | undefined; retry: () => void };

// The frame's real schedule from NASA's Observation Plan, shown next to the exploration's answer.
export const useFramePlan = (frame: Frame | undefined, runKey: string): FramePlan => {
  const { state: plan, retry } = useAsync(
    (signal) =>
      frame === undefined
        ? Promise.resolve([])
        : fetchAcquisitions(frame.track, frame.frame, signal),
    frame === undefined ? undefined : `${frame.id}|${runKey}`,
  );
  return { plan, retry };
};
