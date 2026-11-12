import { Prov } from "@/features/case-panel/Prov";
import { SOURCE } from "@/features/case-panel/verdicts";
import { LAYER_GROUPS, layerTitle, type LiveLayer } from "@/features/explore/exploreLayers";

const GRAY_RAMP = "linear-gradient(90deg,#000,#fff)";

type LiveLayerDockProps = {
  layers: LiveLayer[];
  selectedId: string | undefined;
  opacity: number;
  onSelect: (id: string | undefined) => void;
  onOpacity: (opacity: number) => void;
};

const rangeText = ({ valueRange, units }: LiveLayer): string | undefined =>
  valueRange === null
    ? undefined
    : `${valueRange.map((value) => String(value).replace("-", "−")).join(" to ")} ${units}`.trim();

// The layers this exploration produced, one on the globe at a time.
export const LiveLayerDock = ({
  layers,
  selectedId,
  opacity,
  onSelect,
  onOpacity,
}: LiveLayerDockProps) => {
  const selected = layers.find((layer) => layer.id === selectedId);
  return (
    <section
      className="x-dock x-glass"
      aria-label="Radar on the globe"
      data-testid="live-layer-dock"
    >
      <p className="x-kicker x-kicker--split">
        <span>Radar on the globe</span>
        <Prov kind="real" source={SOURCE.liveQuality} />
      </p>
      <div className="x-layers">
        {LAYER_GROUPS.map(({ kind, label }) => {
          const group = layers.filter((layer) => layer.kind === kind);
          return group.length === 0 ? null : (
            <div key={kind} role="group" aria-label={label} className="x-layers__group">
              <p className="x-layers__label">{label}</p>
              {group.map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  className="x-layers__option"
                  aria-pressed={layer.id === selectedId}
                  onClick={() => onSelect(layer.id === selectedId ? undefined : layer.id)}
                  data-testid={`layer-option-${layer.id}`}
                >
                  {layerTitle(layer)}
                </button>
              ))}
            </div>
          );
        })}
      </div>
      {selected !== undefined && (
        <div className="x-dock__legend">
          {selected.colormap === "gray" && (
            <span className="x-dock__ramp" style={{ background: GRAY_RAMP }} />
          )}
          {rangeText(selected) !== undefined && (
            <p className="x-dock__scale">{rangeText(selected)}</p>
          )}
          {selected.legend !== null && (
            <ul className="x-layers__legend" data-testid="layer-legend">
              {Object.entries(selected.legend).map(([value, meaning]) => (
                <li key={value}>
                  <span>{value}</span> {meaning}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
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
    </section>
  );
};
