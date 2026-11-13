import { Prov } from "@/features/case-panel/Prov";
import { SOURCE } from "@/features/case-panel/verdicts";
import { LAYER_GROUPS, layerTitle, type LiveLayer } from "@/features/explore/exploreLayers";

// Approximations of the palettes the backend renders (matplotlib), so the legend matches the map.
const RAMPS: Record<string, string> = {
  gray: "linear-gradient(90deg,#000,#fff)",
  cividis: "linear-gradient(90deg,#00224e,#35456c,#666970,#948e77,#c8b866,#fee838)",
  twilight:
    "linear-gradient(90deg,#e2d9e2,#8bb0c9,#5f6bb5,#4a2d86,#2f1437,#82305f,#c4684d,#d9b09a,#e2d9e2)",
};
const CYCLIC_NOTE =
  "The colours repeat every 2π: this is wrapped phase, a pattern of fringes, not a distance.";

type LiveLayerDockProps = {
  layers: LiveLayer[];
  selectedId: string | undefined;
  opacity: number;
  onSelect: (id: string | undefined) => void;
  onOpacity: (opacity: number) => void;
};

const ROUNDING = 100;

const rangeText = ({ valueRange, units, kind }: LiveLayer): string | undefined => {
  if (valueRange === null) return undefined;
  // The wrapped phase spans one full turn; the backend's raw 3.1415926536 reads better as π.
  if (kind === "phase") return "−π to +π rad";
  const rounded = valueRange.map((value) => String(Math.round(value * ROUNDING) / ROUNDING));
  return `${rounded.join(" to ").replaceAll("-", "−")} ${units}`.trim();
};

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
          {RAMPS[selected.colormap] !== undefined && (
            <span className="x-dock__ramp" style={{ background: RAMPS[selected.colormap] ?? "" }} />
          )}
          {rangeText(selected) !== undefined && (
            <p className="x-dock__scale" data-testid="layer-scale">
              {rangeText(selected)}
            </p>
          )}
          {selected.kind === "phase" && (
            <p className="x-dock__scale" data-testid="phase-note">
              {CYCLIC_NOTE}
            </p>
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
