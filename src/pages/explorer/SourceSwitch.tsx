const S_BAND_NOTE = "S-band: coming soon · precomputed areas only";

// The source is part of the request from the start. Only L-band is read on demand today; S-band
// arrives as a precomputed layer for a short list of areas, so its button is off.
export const SourceSwitch = () => (
  <div role="group" aria-label="Radar band" className="x-source" data-testid="source-switch">
    <button
      type="button"
      aria-pressed="true"
      title="L-band (NASA), read on demand"
      data-testid="source-L"
    >
      L
    </button>
    <button
      type="button"
      disabled
      title={S_BAND_NOTE}
      aria-label={S_BAND_NOTE}
      data-testid="source-S"
    >
      S
    </button>
  </div>
);
