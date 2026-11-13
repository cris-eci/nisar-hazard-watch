import { AGRICULTURE_CARD, LENS_COPY, STEP_6 } from "@/content/copyV8";
import { Prov } from "@/features/case-panel/Prov";
import type { LiveLayer } from "@/features/explore/exploreLayers";
import type { NeighboursBlock } from "@/features/lenses/agriculture";

const SOURCE_NEIGHBOURS =
  "Exploration API → result.lens.evaluation.neighborhood, matches and target_contrasts (matched focal minus matched control cells)";

type Props = {
  block: NeighboursBlock;
  // The matched control cells, when the backend serves them as a layer.
  layer: LiveLayer | undefined;
  onGlobe: boolean;
  onShowLayer: (id: string | undefined) => void;
};

// WHAT THIS LENS COMPARES: the patch against its matched neighbours, one whisker per channel on a
// fixed −3…+3 dB axis with the "no difference" band shaded. dB only, never area.
export const AgricultureNeighbours = ({ block, layer, onGlobe, onShowLayer }: Props) => (
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
        <span>{AGRICULTURE_CARD.comparesTitle}</span>
        <Prov kind="real" source={SOURCE_NEIGHBOURS} />
      </p>
      <p className="x-lrule__rule">{LENS_COPY.agriculture.rule}</p>
      {block.counts !== undefined && (
        <p className="x-lrule__label" data-testid="lens-neighbours-counts">
          {block.counts}
        </p>
      )}
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
    {block.tooSmall !== undefined && (
      <ul className="x-lcard__reasons x-lagri__reasons" data-testid="lens-neighbours-reasons">
        <li>{block.tooSmall}</li>
        <li>{AGRICULTURE_CARD.radarOnly}</li>
      </ul>
    )}
    {block.rows.length > 0 && (
      <div className="x-lagri" data-testid="lens-neighbours">
        {block.rows.map((row) => (
          <div
            key={row.channel}
            className="x-lagri__row"
            data-testid="lens-contrast"
            data-channel={row.channel}
          >
            <span className="x-lagri__k">{row.label}</span>
            <div className="x-lagri__axis" aria-hidden="true">
              {block.band !== undefined && (
                <span
                  className="x-lagri__band"
                  style={{ left: `${block.band[0]}%`, width: `${block.band[1] - block.band[0]}%` }}
                />
              )}
              <span className="x-lagri__zero" />
              {row.low !== undefined && row.high !== undefined && (
                <span
                  className="x-lagri__whisker"
                  style={{ left: `${row.low}%`, width: `${row.high - row.low}%` }}
                />
              )}
              <span className="x-lagri__mean" style={{ left: `${row.mean}%` }} />
            </div>
            <span className="x-lagri__v">{row.value}</span>
            <span className="x-lagri__s">
              {row.interval}
              {row.state !== undefined && ` · ${row.state}`}
            </span>
          </div>
        ))}
        <div className="x-lagri__row" aria-hidden="true">
          <p className="x-lrule__axis x-lagri__ticks">
            <span>−3 dB</span>
            <span>0</span>
            <span>+3 dB</span>
          </p>
        </div>
      </div>
    )}
    <p className="x-lrule__caption" data-testid="lens-rule-caption">
      {block.caption !== undefined && `${block.caption}. `}
      {AGRICULTURE_CARD.note}
    </p>
  </div>
);
