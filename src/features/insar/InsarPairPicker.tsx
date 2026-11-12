import { useState } from "react";

import {
  clampCoherence,
  COHERENCE_STEP,
  DEFAULT_COHERENCE,
  listInsarPairs,
  MAX_COHERENCE,
  MIN_COHERENCE,
  type InsarChoice,
  type InsarPair,
} from "@/features/insar/insarApi";
import { LiveProblem } from "@/features/live/LiveStatus";
import type { LonLat } from "@/features/frames/frame.types";
import { ApiError } from "@/lib/api/apiClient";
import { formatDay } from "@/features/timeline/timelineLayout";
import { useAsync } from "@/lib/useAsync";

type PickerProps = {
  point: LonLat;
  // A shared link can name the pair and threshold to preselect.
  initial?: Partial<InsarChoice> | undefined;
  onMeasure: (choice: InsarChoice) => void;
  onPickCase: () => void;
};

const direction = (pair: InsarPair): string =>
  pair.direction === "A" ? "ascending" : "descending";

const label = (pair: InsarPair): string =>
  `${formatDay(pair.referenceDate, false)} → ${formatDay(pair.secondaryDate)}`;

// Ground motion needs two passes: the user picks the pair, then the backend measures it.
export const InsarPairPicker = ({ point, initial, onMeasure, onPickCase }: PickerProps) => {
  const { state, retry } = useAsync((signal) => listInsarPairs(point, signal), point.join(","));
  const [chosen, setChosen] = useState<string | undefined>(initial?.pairId);
  const [threshold, setThreshold] = useState(
    clampCoherence(initial?.threshold ?? DEFAULT_COHERENCE),
  );

  if (state === undefined || state.status === "loading")
    return (
      <div className="x-job" role="status" data-testid="pairs-loading">
        <p className="x-kicker x-job__title">Looking for NISAR pairs over this spot…</p>
      </div>
    );
  if (state.status === "error")
    return (
      <LiveProblem
        reasonCode={state.error instanceof ApiError ? state.error.reasonCode : "NETWORK_ERROR"}
        detail={state.error.message}
        onRetry={retry}
        onPickCase={onPickCase}
      />
    );
  const { pairs, windowStart, windowEnd } = state.data;
  if (pairs.length === 0)
    return (
      <div className="x-problem" role="status" data-testid="pairs-empty">
        <p className="x-problem__title">No NISAR pair covers this spot yet</p>
        <p>
          No interferogram over this spot has both its passes between {formatDay(windowStart)} and{" "}
          {formatDay(windowEnd)}. Try another spot, or pick a measured case.
        </p>
        <div className="x-problem__actions">
          <button type="button" className="x-ghost" onClick={onPickCase}>
            Pick a measured case
          </button>
        </div>
      </div>
    );
  const selected =
    chosen !== undefined && pairs.some((pair) => pair.pairId === chosen)
      ? chosen
      : pairs[0]?.pairId;
  return (
    <div className="x-pairs" data-testid="pair-picker">
      <fieldset className="x-pairs__list">
        <legend className="x-kicker">Choose a pair of passes</legend>
        {pairs.map((pair) => (
          <div key={pair.pairId} className="x-pairs__option">
            <input
              id={`pair-${pair.pairId}`}
              type="radio"
              name="insar-pair"
              checked={pair.pairId === selected}
              onChange={() => setChosen(pair.pairId)}
              data-testid={`pair-option-${pair.pairId}`}
            />
            <label htmlFor={`pair-${pair.pairId}`}>
              <strong>{label(pair)}</strong>
              <small>
                {pair.temporalBaselineDays} days · track {pair.track} {direction(pair)} · frame{" "}
                {pair.frame}
              </small>
            </label>
          </div>
        ))}
      </fieldset>
      <label className="x-pairs__threshold">
        <span>
          Coherence threshold <output data-testid="coherence-value">{threshold.toFixed(2)}</output>
        </span>
        <input
          type="range"
          min={MIN_COHERENCE}
          max={MAX_COHERENCE}
          step={COHERENCE_STEP}
          value={threshold}
          onChange={(event) => setThreshold(clampCoherence(Number(event.target.value)))}
          data-testid="coherence-threshold"
        />
        <small>Cells below it show no phase. Lower keeps more cells, with noisier phase.</small>
      </label>
      <button
        type="button"
        className="x-primary"
        disabled={selected === undefined}
        onClick={() => selected !== undefined && onMeasure({ pairId: selected, threshold })}
        data-testid="pair-measure"
      >
        Measure this pair
      </button>
    </div>
  );
};
