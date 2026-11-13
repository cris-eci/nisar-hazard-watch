import type { ExplorationView } from "@/features/explore/exploreSchemas";

// Never show the bar full before the answer is in: the estimate is a median, not a promise.
const BAR_CEILING = 0.95;

export type Countdown = {
  etaSeconds: number | null;
  elapsedSeconds: number;
  remainingSeconds: number | null;
  // Past the estimate the bar stops promising and the copy says it is taking longer.
  overdue: boolean;
  fraction: number;
};

// Counts from the last poll so the timer moves between polls: elapsed = what the server said + the
// time since it said it; remaining = estimate − elapsed.
export const countdown = (view: ExplorationView, receivedAt: number, now: number): Countdown => {
  const elapsedSeconds = view.elapsedSeconds + Math.max(0, (now - receivedAt) / 1000);
  const eta = view.etaSeconds;
  if (eta === null || eta <= 0)
    return {
      etaSeconds: null,
      elapsedSeconds,
      remainingSeconds: null,
      overdue: false,
      fraction: 0,
    };
  return {
    etaSeconds: eta,
    elapsedSeconds,
    remainingSeconds: Math.max(0, eta - elapsedSeconds),
    overdue: elapsedSeconds > eta,
    fraction: Math.min(BAR_CEILING, elapsedSeconds / eta),
  };
};

export const formatSeconds = (seconds: number): string => {
  const whole = Math.max(0, Math.round(seconds));
  return whole < 60
    ? `${whole} s`
    : `${Math.floor(whole / 60)} min ${String(whole % 60).padStart(2, "0")} s`;
};

// The compact lens row's clock: "1:15", "0:05", "10:00".
export const formatClock = (seconds: number): string => {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};
