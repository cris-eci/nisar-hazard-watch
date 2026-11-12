import { NETWORK_ERROR } from "@/lib/api/apiClient";

export type ExplorationProblem = {
  title: string;
  body: string;
  // Asking again can work (capacity, a slow archive); otherwise a different place or case is needed.
  retry: boolean;
};

type Reason = { reasonCode: string; detail: string };

const BUSY: ExplorationProblem = {
  title: "The radar queue is full",
  body: "Lots of people are asking right now. Try again in a minute.",
  retry: true,
};

// Copy per backend reasonCode; anything unlisted shows the server's own detail.
export const explorationProblem = ({ reasonCode, detail }: Reason): ExplorationProblem => {
  switch (reasonCode) {
    case "QUEUE_FULL":
      return BUSY;
    case "RATE_LIMITED":
      return {
        title: "You're asking quickly",
        body: "Wait a minute, then ask again.",
        retry: true,
      };
    case "UPSTREAM_CATALOG_ERROR":
      return {
        title: "We couldn't reach the radar archive",
        body: "The NASA archive didn't answer. Nothing is wrong with this place.",
        retry: true,
      };
    case "UPSTREAM_ML_ERROR":
    case "ANALYSIS_FAILED":
      return {
        title: "The analysis didn't finish",
        body: "The radar service couldn't produce a result for this spot. Try again, or pick a measured case.",
        retry: true,
      };
    case NETWORK_ERROR:
      return {
        title: "We couldn't reach the service",
        body: "Check the connection and try again. The globe still works.",
        retry: true,
      };
    case "NO_COVERAGE":
      return {
        title: "No NISAR passes cover this place",
        body: "The archive holds no L-band scene over this spot in the last five months.",
        retry: false,
      };
    case "INSUFFICIENT_HISTORY":
      return {
        title: "Not enough radar history here yet",
        body: "The band needs a latest pass and at least three earlier ones from the same series. Try a measured case or another spot.",
        retry: false,
      };
    case "TIMEOUT_PARTIAL":
      return {
        title: "This took longer than the time limit",
        body: "The passes were chosen but the measurement didn't finish in time. Try again; reading the scenes from the archive is sometimes slow.",
        retry: true,
      };
    case "CANCELLED":
      return {
        title: "Request cancelled",
        body: "Nothing was measured. Ask again when you like.",
        retry: true,
      };
    default:
      return { title: "We couldn't answer this question", body: detail, retry: false };
  }
};
