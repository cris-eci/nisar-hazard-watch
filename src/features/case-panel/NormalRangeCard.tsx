import { Prov } from "@/features/case-panel/Prov";
import type { NormalRange } from "@/features/case-panel/subject";
import { SOURCE } from "@/features/case-panel/verdicts";
import { CHANNEL, type ChannelId } from "@/features/charts/chartTokens";

// Room around the larger of the two numbers, so the marker never sits on the edge of the axis.
const HEADROOM = 1.3;
const PERCENT = 100;

const signed = (value: number): string =>
  `${value < 0 ? "−" : value > 0 ? "+" : ""}${Math.abs(value).toFixed(1)} dB`;

type CardProps = {
  range: NormalRange;
  compact?: boolean;
  // The report page brings its own heading.
  heading?: boolean;
};

// The target pass against the spot's own normal range, per channel: the shaded band is the
// diagnostic half-width around the median of the earlier passes (zero in the middle).
export const NormalRangeCard = ({ range, compact = false, heading = true }: CardProps) => (
  <div className="x-panel__block c-range" data-testid="normal-range">
    {heading && (
      <p className="x-kicker x-kicker--split">
        <span>Target pass vs normal range</span>
        <Prov kind="real" source={SOURCE.liveRange} />
      </p>
    )}
    <ul className="c-range__rows">
      {range.channels.map(({ channel, delta, halfWidth }) => {
        const scale = Math.max(Math.abs(delta), halfWidth) * HEADROOM;
        const outside = Math.abs(delta) > halfWidth;
        const token = CHANNEL[channel.toLowerCase() as ChannelId];
        return (
          <li key={channel} className="c-range__row">
            <span className="c-range__label">{channel}</span>
            <span
              className="c-range__axis"
              role="img"
              aria-label={`${channel}: ${signed(delta)}, normal range ±${halfWidth.toFixed(1)} dB, ${outside ? "outside" : "inside"}`}
            >
              <i
                className="c-range__band"
                style={{
                  left: `${((scale - halfWidth) / (2 * scale)) * PERCENT}%`,
                  width: `${(halfWidth / scale) * PERCENT}%`,
                }}
              />
              <i className="c-range__zero" />
              <i
                className="c-range__mark"
                data-out={outside}
                data-channel={channel}
                style={{
                  left: `${((delta + scale) / (2 * scale)) * PERCENT}%`,
                  ...(token && { background: token.color }),
                }}
              />
            </span>
            <span className="c-range__value" data-out={outside}>
              {signed(delta)}
            </span>
          </li>
        );
      })}
    </ul>
    {!compact && (
      <p className="c-range__note">
        Shaded: the normal range, ±
        {range.channels.map((item) => item.halfWidth.toFixed(1)).join(" / ")} dB around the median
        of {range.baselinePasses} earlier passes.
      </p>
    )}
  </div>
);
