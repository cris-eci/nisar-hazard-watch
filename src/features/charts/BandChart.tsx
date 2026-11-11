import "@/features/charts/charts.css";

import {
  Area,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  bandsFor,
  isOutside,
  MIN_BASELINE_PASSES,
  type Band,
  type BandPass,
} from "@/features/cases/demoBand";
import { ProvenanceChip } from "@/lib/ProvenanceChip";
import { CHANNEL, type ChannelId, type ChartMode } from "@/features/charts/chartTokens";

const Y_DOMAIN: [number, number] = [-29, -4];
const DAY_MS = 86_400_000;
const PAD_DAYS = 5;

type Row = {
  t: number;
  date: string;
  role: BandPass["role"];
  hh: number | null;
  hv: number | null;
  hhTarget: number | null;
  hvTarget: number | null;
  hhBand: [number, number] | null;
  hvBand: [number, number] | null;
};

const bandRange = (band: Band | undefined): [number, number] | null =>
  band === undefined ? null : [band.low, band.high];

const formatDay = (t: number, withYear = false): string =>
  new Date(t).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear && { year: "numeric" }),
    timeZone: "UTC",
  });

const formatDb = (value: number): string => `${value > 0 ? "+" : ""}${value.toFixed(1)} dB`;

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: Row;
  value?: number | null;
};

// Channels differ by line and by marker: HH circles, HV squares, so colour is never the only cue.
const makeDot =
  (channel: ChannelId, band: Band | undefined, isTarget: boolean) =>
  ({ cx, cy, payload, value }: DotProps) => {
    if (cx === undefined || cy === undefined || payload === undefined || value == null)
      return <g />;
    const { color } = CHANNEL[channel];
    const r = isTarget ? 5.5 : 3.25;
    const outside = isOutside(value, band);
    const fill = isTarget ? color : "#08101f";
    const halo = outside ? (
      <circle cx={cx} cy={cy} r={r + 3.5} fill="none" stroke="#ebe9e4" strokeWidth={1.5} />
    ) : null;
    return (
      <g key={`${channel}-${payload.t}`}>
        {halo}
        {channel === "hh" ? (
          <circle cx={cx} cy={cy} r={r} fill={fill} stroke={color} strokeWidth={1.5} />
        ) : (
          <rect
            x={cx - r}
            y={cy - r}
            width={r * 2}
            height={r * 2}
            fill={fill}
            stroke={color}
            strokeWidth={1.5}
          />
        )}
      </g>
    );
  };

type TipProps = {
  active?: boolean;
  payload?: Array<{ payload?: Row }>;
  bands: { hh: Band | undefined; hv: Band | undefined };
  mode: ChartMode;
};

const PHASE: Record<BandPass["role"], string> = {
  baseline: "Baseline pass · defines the range",
  excluded: "Onset pass · not used, the line breaks",
  target: "Target pass · compared",
};

const GlassTooltip = ({ active, payload, bands, mode }: TipProps) => {
  const row = payload?.[0]?.payload;
  if (active !== true || row === undefined) return null;
  return (
    <div className="c-tip">
      <p className="c-tip__date">{formatDay(row.t, true)}</p>
      <p className="c-tip__phase">{PHASE[row.role]}</p>
      {(["hh", "hv"] as const).map((channel) => {
        const value = row[channel] ?? row[`${channel}Target`];
        const band = bands[channel];
        return (
          <div key={channel} className="c-tip__row">
            <svg width="16" height="6" aria-hidden="true">
              <line
                x1="0"
                y1="3"
                x2="16"
                y2="3"
                stroke={CHANNEL[channel].color}
                strokeWidth="2"
                strokeDasharray={CHANNEL[channel].dash}
              />
            </svg>
            <span>{CHANNEL[channel].label}</span>
            <span className="c-tip__value">{value == null ? "no data" : formatDb(value)}</span>
            {mode === "technical" && value != null && band !== undefined && (
              <span className="c-tip__sub">
                {formatDb(value - band.median)} vs median · band ±
                {(band.high - band.median).toFixed(0)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

type BandChartProps = {
  passes: BandPass[];
  mode: ChartMode;
  height?: number;
  // Panel size drops the sentence and the axes.
  compact?: boolean;
  sentence?: string;
  emptyWhy?: string;
  demo?: boolean;
};

const DEFAULT_EMPTY =
  "No usable pixels on 3 of 5 dates. We tried one alternative series; it had the same gap.";

export const BandChart = ({
  passes,
  mode,
  height = 220,
  compact = false,
  sentence,
  emptyWhy = DEFAULT_EMPTY,
  demo = true,
}: BandChartProps) => {
  const bands = bandsFor(passes);
  const empty = bands.hh === undefined || bands.hv === undefined;
  const tech = mode === "technical" && !compact;
  const rows: Row[] = passes.map((item) => {
    const target = item.role === "target";
    return {
      t: Date.parse(item.date),
      date: item.date,
      role: item.role,
      // The target is a lone dot: the onset pass is excluded, so the line never joins it.
      hh: target ? null : item.hh,
      hv: target ? null : item.hv,
      hhTarget: target ? item.hh : null,
      hvTarget: target ? item.hv : null,
      hhBand: bandRange(bands.hh),
      hvBand: bandRange(bands.hv),
    };
  });
  const first = rows[0]?.t ?? 0;
  const last = rows.at(-1)?.t ?? 0;
  const domain: [number, number] = [first - PAD_DAYS * DAY_MS, last + PAD_DAYS * DAY_MS];
  const baseline = rows.filter((row) => row.role === "baseline");
  const target = rows.find((row) => row.role === "target");
  const baselineCount = passes.filter(
    (item) => item.role === "baseline" && (item.hh !== null || item.hv !== null),
  ).length;

  return (
    <figure className={compact ? "c-band c-band--compact" : "c-band"} data-testid="band-chart">
      <div className="c-band__plot" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 18, right: 12, bottom: 4, left: tech ? 0 : 4 }}>
            {tech &&
              [-25, -20, -15, -10, -5].map((v) => (
                <ReferenceLine key={v} y={v} stroke="rgba(235,233,228,0.07)" />
              ))}
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={domain}
              ticks={tech ? rows.map((row) => row.t) : []}
              tickFormatter={(t: number) => formatDay(t)}
              tick={{ fill: "#8d8a83", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={{ stroke: "rgba(235,233,228,0.12)" }}
              tickLine={false}
              height={tech ? 22 : 4}
            />
            <YAxis
              domain={Y_DOMAIN}
              hide={!tech}
              ticks={[-25, -20, -15, -10, -5]}
              tickFormatter={(v: number) => `${v}`}
              tick={{ fill: "#8d8a83", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              width={34}
              unit=""
            />
            {baseline.length > 0 && (
              <ReferenceArea
                x1={(baseline[0]?.t ?? first) - 3 * DAY_MS}
                x2={(baseline.at(-1)?.t ?? first) + 3 * DAY_MS}
                fill="rgba(235,233,228,0.035)"
                stroke="none"
                {...(tech && {
                  label: {
                    value: `Baseline · ${baselineCount} passes`.toUpperCase(),
                    position: "insideTopLeft",
                    fill: "#8d8a83",
                    fontSize: 9.5,
                    fontFamily: "JetBrains Mono",
                  },
                })}
              />
            )}
            {!empty &&
              (["hh", "hv"] as const).map((channel) => (
                <Area
                  key={`${channel}-band`}
                  dataKey={`${channel}Band`}
                  type="linear"
                  fill={CHANNEL[channel].fill}
                  stroke={CHANNEL[channel].color}
                  strokeOpacity={0.45}
                  strokeDasharray="2 3"
                  strokeWidth={1}
                  isAnimationActive={false}
                  activeDot={false}
                />
              ))}
            {target !== undefined && !empty && (
              <ReferenceLine
                x={target.t}
                stroke="#c9b48b"
                strokeWidth={1.25}
                label={{
                  value: "TARGET",
                  position: "top",
                  fill: "#c9b48b",
                  fontSize: 9.5,
                  fontFamily: "JetBrains Mono",
                }}
              />
            )}
            {(["hh", "hv"] as const).map((channel) => (
              <Line
                key={channel}
                dataKey={channel}
                type="linear"
                stroke={CHANNEL[channel].color}
                strokeWidth={2}
                strokeDasharray={CHANNEL[channel].dash}
                connectNulls={false}
                isAnimationActive={false}
                dot={makeDot(channel, bands[channel], false)}
                activeDot={false}
              />
            ))}
            {(["hh", "hv"] as const).map((channel) => (
              <Line
                key={`${channel}-target`}
                dataKey={`${channel}Target`}
                stroke="none"
                isAnimationActive={false}
                dot={makeDot(channel, bands[channel], true)}
                activeDot={false}
              />
            ))}
            {!empty && (
              <Tooltip
                content={<GlassTooltip bands={bands} mode={mode} />}
                cursor={{ stroke: "rgba(235,233,228,0.35)", strokeWidth: 1 }}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        {empty && (
          <div className="c-band__empty" data-testid="band-empty">
            <p className="c-band__empty-title">Not enough radar yet</p>
            <p>{emptyWhy}</p>
          </div>
        )}
      </div>

      <figcaption className="c-band__foot">
        <span className="c-legend">
          <LegendLine channel="hh" />
          <LegendLine channel="hv" />
          {!empty && (
            <span className="c-legend__item">
              <span className="c-legend__band" aria-hidden="true" />
              Normal range
            </span>
          )}
          {tech && !empty && (
            <span className="c-legend__item">
              <span className="c-legend__ring" aria-hidden="true" />
              Outside range
            </span>
          )}
        </span>
        {demo && (
          <ProvenanceChip
            kind="demo"
            source="Per-pass values at the point are demo until the backend serves them."
          />
        )}
      </figcaption>

      {!compact && sentence !== undefined && <p className="c-band__sentence">{sentence}</p>}

      {tech && (
        <dl className="c-band__tech">
          {empty ? (
            <>
              <TechRow
                k="Baseline"
                v={`${baselineCount} of ≥${MIN_BASELINE_PASSES} passes needed`}
              />
              <TechRow k="State" v="insufficient_data" />
            </>
          ) : (
            <>
              <TechRow k="Band" v="median ± max(3, 3·max(1.4826·MAD, 1)) dB" />
              <TechRow
                k="Target Δ"
                v={(["hh", "hv"] as const)
                  .map((channel) => {
                    const value = target?.[`${channel}Target`];
                    const band = bands[channel];
                    return value == null || band === undefined
                      ? `${CHANNEL[channel].label} —`
                      : `${CHANNEL[channel].label} ${formatDb(value - band.median)}`;
                  })
                  .join(" · ")}
              />
              <TechRow
                k="State"
                v={
                  (["hh", "hv"] as const).some((channel) =>
                    isOutside(target?.[`${channel}Target`] ?? null, bands[channel]),
                  )
                    ? "observed_departure"
                    : "within_observed_baseline"
                }
              />
            </>
          )}
        </dl>
      )}
    </figure>
  );
};

const LegendLine = ({ channel }: { channel: ChannelId }) => (
  <span className="c-legend__item">
    <svg width="22" height="10" aria-hidden="true">
      <line
        x1="0"
        y1="5"
        x2="22"
        y2="5"
        stroke={CHANNEL[channel].color}
        strokeWidth="2"
        strokeDasharray={channel === "hv" ? "4 3" : undefined}
      />
      {channel === "hh" ? (
        <circle cx="11" cy="5" r="3" fill="#08101f" stroke={CHANNEL.hh.color} strokeWidth="1.5" />
      ) : (
        <rect
          x="8"
          y="2"
          width="6"
          height="6"
          fill="#08101f"
          stroke={CHANNEL.hv.color}
          strokeWidth="1.5"
        />
      )}
    </svg>
    {CHANNEL[channel].label}
  </span>
);

const TechRow = ({ k, v }: { k: string; v: string }) => (
  <div>
    <dt>{k}</dt>
    <dd>{v}</dd>
  </div>
);
