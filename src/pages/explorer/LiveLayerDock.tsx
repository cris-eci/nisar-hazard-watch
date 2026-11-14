import { STEP_4 } from "@/content/copyV8";
import { Prov } from "@/features/case-panel/Prov";
import { SOURCE } from "@/features/case-panel/verdicts";
import type { TimelinePass } from "@/features/cases/cases";
import { dockRows, otherLayers, type DockPick, type DockRow } from "@/features/explore/exploreDock";
import { LAYER_GROUPS, layerTitle, type LiveLayer } from "@/features/explore/exploreLayers";
import { ruleLayerOf } from "@/features/lenses/flood";
import { formatDay } from "@/features/timeline/timelineLayout";
import { ProvenanceChip } from "@/lib/ProvenanceChip";
import { RawThumbs } from "@/pages/explorer/RawThumbs";

// Approximations of the palettes the backend renders (matplotlib), so the legend matches the map.
const RAMPS: Record<string, string> = {
  gray: "linear-gradient(90deg,#000,#fff)",
  cividis: "linear-gradient(90deg,#00224e,#35456c,#666970,#948e77,#c8b866,#fee838)",
  twilight:
    "linear-gradient(90deg,#e2d9e2,#8bb0c9,#5f6bb5,#4a2d86,#2f1437,#82305f,#c4684d,#d9b09a,#e2d9e2)",
  RdBu_r: "linear-gradient(90deg,#2166ac,#92c5de,#f7f7f7,#f4a582,#b2182b)",
};
const CYCLIC_NOTE =
  "The colours repeat every 2π: this is wrapped phase, a pattern of fringes, not a distance.";

type LiveLayerDockProps = {
  layers: LiveLayer[];
  pick: DockPick;
  // The selected pass; undefined when the answer has no measured pass.
  date: string | undefined;
  passes: TimelinePass[];
  // The layer on the globe now (undefined for a pass with no image).
  shownId: string | undefined;
  opacity: number;
  onPick: (pick: DockPick) => void;
  // Decision 2: the Coherence row opens the ground-motion pair picker when there is no pair yet.
  onPair: () => void;
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

// The COPY-v8 §4 sentence for the v8 rows; other layers keep their own range and legend.
const v8Legend = (
  pick: DockPick,
  date: string | undefined,
  selected: LiveLayer | undefined,
  rule: LiveLayer | undefined,
): string | undefined => {
  if (pick?.kind === "pass" && date !== undefined)
    return pick.pol === "HH" ? STEP_4.legendHH(formatDay(date)) : STEP_4.legendHV(formatDay(date));
  if (selected === undefined) return undefined;
  if (selected.kind === "change" || /^display_change_/.test(selected.id))
    return STEP_4.legendChange;
  if (selected.id === rule?.id) return STEP_4.legendRule;
  if (selected.kind === "coherence") return STEP_4.legendCoherence;
  return undefined;
};

const rowPick = (row: DockRow): DockPick =>
  row.action?.kind === "pass" || row.action?.kind === "layer" ? row.action : undefined;

// SPECS-v8 §4: the raw passes and the v8 rows on top, every other layer the job made under them.
export const LiveLayerDock = ({
  layers,
  pick,
  date,
  passes,
  shownId,
  opacity,
  onPick,
  onPair,
  onOpacity,
}: LiveLayerDockProps) => {
  const selected = layers.find((layer) => layer.id === shownId);
  const rows = dockRows(layers, date, pick);
  const others = otherLayers(layers);
  const rule = ruleLayerOf(layers);
  const legend = v8Legend(pick, date, selected, rule);
  const isChange = selected !== undefined && legend === STEP_4.legendChange;
  const clickRow = (row: DockRow) => {
    if (row.action?.kind === "pair") {
      onPair();
      return;
    }
    // A second click on the row that is on takes the layer off the globe.
    onPick(row.on ? undefined : rowPick(row));
  };
  return (
    <section
      className="x-dock x-dock--live x-glass"
      aria-label="Radar on the globe"
      data-testid="live-layer-dock"
    >
      {date !== undefined && passes.length > 0 && (
        <RawThumbs layers={layers} passes={passes} date={date} pick={pick} onPick={onPick} />
      )}
      <p className="x-kicker x-kicker--split">
        <span>{STEP_4.dockTitle}</span>
        <Prov kind="real" source={SOURCE.liveQuality} />
      </p>
      <div className="x-rows" role="group" aria-label={STEP_4.dockTitle}>
        {rows.map((row) => (
          <button
            key={row.key}
            type="button"
            className="x-rows__row"
            aria-pressed={row.on}
            disabled={!row.enabled}
            title={row.why}
            onClick={() => clickRow(row)}
            data-testid={`dock-row-${row.key}`}
          >
            <span>{row.label}</span>
            {row.chip === "noPair" && <span className="x-rows__tag">{STEP_4.dockNoPair}</span>}
            {row.chip === "todo" && <ProvenanceChip kind="todo" />}
            {row.why !== undefined && <span className="x-rows__why">{row.why}</span>}
          </button>
        ))}
      </div>
      {others.length > 0 && (
        <div className="x-layers">
          {LAYER_GROUPS.map(({ kind, label }) => {
            const group = others.filter((layer) => layer.kind === kind);
            return group.length === 0 ? null : (
              <div key={kind} role="group" aria-label={label} className="x-layers__group">
                <p className="x-layers__label">{label}</p>
                {group.map((layer) => (
                  <button
                    key={layer.id}
                    type="button"
                    className="x-layers__option"
                    aria-pressed={layer.id === shownId}
                    onClick={() =>
                      onPick(layer.id === shownId ? undefined : { kind: "layer", id: layer.id })
                    }
                    data-testid={`layer-option-${layer.id}`}
                  >
                    {layerTitle(layer)}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
      {selected !== undefined && (
        <div className="x-dock__legend">
          {RAMPS[selected.colormap] !== undefined && (
            <span className="x-dock__ramp" style={{ background: RAMPS[selected.colormap] ?? "" }} />
          )}
          {isChange ? (
            <p className="x-dock__scale" data-testid="layer-scale">
              <span>{STEP_4.legendChangeLow}</span>
              <span>{STEP_4.legendChangeMid}</span>
              <span>{STEP_4.legendChangeHigh}</span>
            </p>
          ) : (
            rangeText(selected) !== undefined && (
              <p className="x-dock__scale" data-testid="layer-scale">
                {rangeText(selected)}
              </p>
            )
          )}
          {legend !== undefined && (
            <p className="x-dock__text" data-testid="layer-legend-text">
              {legend}
            </p>
          )}
          {selected.kind === "phase" && (
            <p className="x-dock__scale" data-testid="phase-note">
              {CYCLIC_NOTE}
            </p>
          )}
          {selected.id === rule?.id ? (
            <ul className="x-layers__legend" data-testid="layer-legend">
              <li>{STEP_4.legendRuleMeets}</li>
              <li>{STEP_4.legendRuleNot}</li>
            </ul>
          ) : (
            selected.legend !== null && (
              <ul className="x-layers__legend" data-testid="layer-legend">
                {Object.entries(selected.legend).map(([value, meaning]) => (
                  <li key={value}>
                    <span>{value}</span> {meaning}
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      )}
      <p className="x-dock__grey">
        <i />
        {STEP_4.dockGrey}
      </p>
      <label className="x-dock__opacity">
        {STEP_4.dockOpacity}
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
