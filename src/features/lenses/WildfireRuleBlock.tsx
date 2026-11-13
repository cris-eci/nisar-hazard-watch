import { LENS_COPY, STEP_6, WILDFIRE_CARD } from "@/content/copyV8";
import { Prov } from "@/features/case-panel/Prov";
import type { LiveLayer } from "@/features/explore/exploreLayers";
import type { DeclineRow } from "@/features/lenses/wildfire";

const SOURCE_RULE =
  "Exploration API → result.lens.radar.cross_pol_history (decline_cells of common_cells per assessed pass) and result.lens.point.cross_pol_history";

type Props = {
  rows: DeclineRow[];
  pixelLine: string | undefined;
  // The per-cell count of passes below the band, when the backend serves it.
  layer: LiveLayer | undefined;
  onGlobe: boolean;
  onShowLayer: (id: string | undefined) => void;
};

// WHAT THIS LENS COMPARES: the rule, then per assessed pass the cells whose HV fell below their band.
export const WildfireRuleBlock = ({ rows, pixelLine, layer, onGlobe, onShowLayer }: Props) => (
  <div className="x-lrule" data-testid="lens-rule">
    {layer !== undefined && (
      <img
        className="x-lrule__thumb"
        src={layer.href}
        alt={layer.title}
        data-testid="lens-rule-thumb"
      />
    )}
    <div className="x-lrule__body">
      <p className="x-kicker x-kicker--split">
        <span>{WILDFIRE_CARD.comparesTitle}</span>
        <Prov kind="real" source={SOURCE_RULE} />
      </p>
      <p className="x-lrule__rule">{LENS_COPY.wildfire.rule}</p>
      {rows.map((row) => (
        <div
          key={row.date}
          className="x-lrule__row"
          data-testid="lens-rule-row"
          data-date={row.date}
        >
          <p className="x-lrule__count" data-testid="lens-rule-count">
            <span className="x-lrule__n x-lrule__n--small">{row.text}</span>
          </p>
          <p className="x-lrule__label">{row.label}</p>
          <div className="x-lrule__bar" aria-hidden="true">
            <i style={{ width: `${row.percent}%` }} />
          </div>
          <p className="x-lrule__axis" aria-hidden="true">
            <span>0%</span>
            <span>{row.percent.toFixed(1)}%</span>
            <span>100%</span>
          </p>
        </div>
      ))}
      {layer !== undefined && (
        <button
          type="button"
          className="x-lrule__toggle"
          aria-pressed={onGlobe}
          onClick={() => onShowLayer(onGlobe ? undefined : layer.id)}
          data-testid="lens-rule-toggle"
        >
          {onGlobe ? STEP_6.ruleToggleOn : STEP_6.ruleToggleOff}
        </button>
      )}
    </div>
    <p className="x-lrule__caption" data-testid="lens-rule-caption">
      {pixelLine !== undefined && `${pixelLine} `}
      {rows.length > 0 && `${WILDFIRE_CARD.cellsNote} `}
      {WILDFIRE_CARD.note}
    </p>
  </div>
);
