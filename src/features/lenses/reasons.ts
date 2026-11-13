import { LIVE_REASON } from "@/features/live/liveQuestion";

// Why there is no verdict, in plain words per backend reason code; never the raw code.
const REASONS: Record<string, string> = {
  pixel_masked: "The clicked pixel has no usable value on at least one pass.",
  insufficient_history: "Fewer earlier passes than the normal range needs.",
};

export const lensReasons = (code: string | null | undefined): string[] => {
  const known = code == null ? undefined : REASONS[code];
  return known === undefined ? [LIVE_REASON] : [known, LIVE_REASON];
};
