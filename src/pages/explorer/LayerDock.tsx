import { Prov } from "@/features/case-panel/Prov";
import { SOURCE } from "@/features/case-panel/verdicts";
import { LEGEND, type DrapeKind } from "@/pages/explorer/drapeLegend";

const API_SOON = "Served by the backend API soon";

type LayerDockProps = {
  kind: DrapeKind;
  opacity: number;
  onKind: (kind: DrapeKind) => void;
  onOpacity: (opacity: number) => void;
};

// Only the report's real crops go on the globe; HV and HH−HV wait for the API instead of a fake.
export const LayerDock = ({ kind, opacity, onKind, onOpacity }: LayerDockProps) => {
  const legend = LEGEND[kind];
  return (
    <section className="x-dock x-glass" aria-label="Radar on the globe" data-testid="layer-dock">
      <p className="x-kicker">Radar on the globe</p>
      <div role="group" aria-label="Layer" className="x-switch x-switch--full">
        {(["change", "baseline"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={kind === value}
            onClick={() => onKind(value)}
            data-testid={`layer-${value}`}
          >
            {value === "change" ? "Change" : "Baseline"}
          </button>
        ))}
      </div>
      <div role="group" aria-label="Channel" className="x-chans">
        <button type="button" aria-pressed="true" data-testid="channel-HH">
          HH
        </button>
        <button type="button" disabled title={API_SOON} data-testid="channel-HV">
          HV
        </button>
        {kind === "baseline" && (
          <button type="button" disabled title={API_SOON} data-testid="channel-ratio">
            HH−HV
          </button>
        )}
      </div>
      <p className="x-dock__hint">HV and HH−HV: served by the backend API soon.</p>
      <div className="x-dock__legend">
        <span className="x-dock__ramp" style={{ background: legend.ramp }} />
        <span className="x-dock__scale">
          {legend.scale.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </span>
        <p className="x-dock__grey">
          <i aria-hidden="true" />
          Grey: no measurement. White: no change.
        </p>
      </div>
      <label className="x-dock__opacity">
        Opacity
        <input
          type="range"
          min={0}
          max={100}
          value={opacity}
          onChange={(event) => onOpacity(Number(event.target.value))}
          data-testid="layer-opacity"
        />
        <span>{opacity}%</span>
      </label>
      <p className="x-dock__text">{legend.text}</p>
      <p className="x-dock__prov">
        <Prov kind="real" source={SOURCE.crop} />
        Backend report figure
      </p>
    </section>
  );
};
