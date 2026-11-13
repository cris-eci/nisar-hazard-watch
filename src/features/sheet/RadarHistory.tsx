import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHANNEL } from "@/features/charts/chartTokens";
import type { ExplorationResult } from "@/features/explore/exploreSchemas";

const COLOURS = [CHANNEL.hh.color, CHANNEL.hv.color, "#bb9bce", "#75c9af"];
const DAY = 86_400_000;
const DISPLAY = [-30, 0] as const;

type Props = {
  observations: ExplorationResult["observations"];
  date: string;
  onDate: (date: string) => void;
};

const shortDate = (timestamp: number) => new Date(timestamp).toISOString().slice(5, 10);

export const RadarHistory = ({ observations, date, onDate }: Props) => {
  const rows = observations
    .map((row) => ({ date: row.date, time: Date.parse(row.date), power: row.point_db ?? {} }))
    .filter((row) => Number.isFinite(row.time))
    .sort((a, b) => a.time - b.time);
  const channels = [
    ...new Set(
      rows.flatMap((row) =>
        Object.keys(row.power).filter((key) => typeof row.power[key] === "number"),
      ),
    ),
  ];
  if (channels.length === 0) return null;
  const pair = [
    ["HH", "HV"],
    ["VV", "VH"],
    ["HHHH", "HVHV"],
    ["VVVV", "VHVH"],
  ].find(
    ([a, b]) =>
      a !== undefined &&
      b !== undefined &&
      rows.filter((row) => typeof row.power[a] === "number" && typeof row.power[b] === "number")
        .length > 1,
  );
  const [co = "", cross = ""] = pair ?? [];
  const trajectory = rows.flatMap((row) =>
    row.power[co] != null && row.power[cross] != null
      ? [{ date: row.date, time: row.time, co: row.power[co], cross: row.power[cross] }]
      : [],
  );
  const start = rows[0]?.time ?? 0;
  const span = Math.max(DAY, (rows.at(-1)?.time ?? start) - start);
  const selected = Date.parse(date);
  return (
    <section className="x-sheet__section" aria-label="Point return history">
      <h3 className="x-sheet__kicker">Radar return at the sampled point</h3>
      <div className="x-radar__charts">
        <figure className="x-inset">
          <figcaption>Acquisition timeline · gamma-zero dB</figcaption>
          <div className="x-radar__plot">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={rows}
                onClick={(state) => {
                  const row = rows.find((item) => item.time === Number(state.activeLabel));
                  if (row) onDate(row.date);
                }}
              >
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={shortDate}
                />
                <YAxis unit=" dB" width={62} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip
                  labelFormatter={(value) => new Date(Number(value)).toISOString().slice(0, 10)}
                />
                <Legend />
                {Number.isFinite(selected) && <ReferenceLine x={selected} stroke="var(--gold)" />}
                {channels.map((key, index) => (
                  <Line
                    key={key}
                    name={key}
                    dataKey={`power.${key}`}
                    type="linear"
                    stroke={COLOURS[index % COLOURS.length] ?? CHANNEL.hh.color}
                    strokeWidth={2}
                    strokeDasharray={index % 2 === 1 ? "6 4" : "0"}
                    isAnimationActive={false}
                    connectNulls={false}
                    unit=" dB"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>
        {pair && (
          <figure className="x-inset">
            <figcaption>
              Polarization trajectory · {co} and {cross}
            </figcaption>
            <div className="x-radar__plot">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid stroke="var(--line)" />
                  <XAxis
                    dataKey="co"
                    type="number"
                    name={co}
                    unit=" dB"
                    domain={["dataMin - 2", "dataMax + 2"]}
                  />
                  <YAxis
                    dataKey="cross"
                    type="number"
                    name={cross}
                    unit=" dB"
                    width={62}
                    domain={["dataMin - 2", "dataMax + 2"]}
                  />
                  <Tooltip />
                  <Scatter
                    data={trajectory}
                    line={{ stroke: "var(--line)" }}
                    isAnimationActive={false}
                    onClick={(entry) => {
                      const day: unknown = entry.payload?.date;
                      if (typeof day === "string") onDate(day);
                    }}
                  >
                    {trajectory.map((row) => (
                      <Cell
                        key={row.date}
                        fill={
                          row.date === date
                            ? "#fff"
                            : `hsl(${195 - (157 * (row.time - start)) / span} 70% 65%)`
                        }
                        stroke={row.date === date ? "var(--gold)" : "transparent"}
                        strokeWidth={3}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="x-muted x-small">
              Blue to gold follows elapsed time. White marks the selected date. Each dot uses a
              paired point return.
            </p>
          </figure>
        )}
      </div>
      <div className="x-radar__table" role="region" aria-label="Date-by-channel heatmap">
        <table>
          <caption>Date-by-channel heatmap · gamma-zero dB · fixed color range −30 to 0 dB</caption>
          <thead>
            <tr>
              <th scope="col">Channel</th>
              {rows.map((row) => (
                <th scope="col" key={row.date}>
                  <button
                    type="button"
                    aria-pressed={date === row.date}
                    onClick={() => onDate(row.date)}
                  >
                    {row.date}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {channels.map((key) => (
              <tr key={key}>
                <th scope="row">{key}</th>
                {rows.map((row) => {
                  const value = row.power[key];
                  const fraction =
                    value == null
                      ? 0
                      : Math.max(0, Math.min(1, (value - DISPLAY[0]) / (DISPLAY[1] - DISPLAY[0])));
                  return (
                    <td
                      key={row.date}
                      data-selected={row.date === date}
                      style={{
                        backgroundColor:
                          value == null ? undefined : `hsl(210 42% ${14 + 32 * fraction}%)`,
                      }}
                    >
                      {value?.toFixed(2) ?? "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="x-muted x-small">
        Each value represents the sampled radar cell. Acquisition support and the measured grid are
        listed with the imagery.
      </p>
    </section>
  );
};
