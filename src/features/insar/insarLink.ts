import { clampCoherence, DEFAULT_COHERENCE, type InsarChoice } from "@/features/insar/insarApi";

// The backend's GUNW granule names; anything else in a shared link is ignored.
const PAIR_PATTERN = /^NISAR_L2_[A-Za-z0-9_]{1,170}$/;

// ?pair=<granule>[&coherence=<0.1-0.9>] picks the pair a shared ground-motion link measures.
export const insarFromParams = (params: URLSearchParams): InsarChoice | undefined => {
  const pair = params.get("pair");
  if (pair === null || !PAIR_PATTERN.test(pair)) return undefined;
  const coherence = params.get("coherence");
  return {
    pairId: pair,
    threshold: coherence === null ? DEFAULT_COHERENCE : clampCoherence(Number(coherence)),
  };
};
