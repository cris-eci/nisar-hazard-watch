import "@/features/charts/charts.css";

import type { ChartMode } from "@/features/charts/chartTokens";
import { formatPercent, percent, type ContrastGroup } from "@/features/cases/cases";

type ContrastBarsProps = {
  group: ContrastGroup;
  mode: ChartMode;
  // Panel size: thinner bars and no "k / n" counts in Plain mode.
  compact?: boolean;
};

// Shares of a group always sit on a fixed 0–100% axis: auto-scaling made a 17.8% detection rate
// fill the bar and read as a success next to 87.5%. Plain HTML: three rows don't need a chart lib.
export const ContrastBars = ({ group, mode, compact = false }: ContrastBarsProps) => {
  const showCounts = !compact || mode === "technical";
  return (
    <figure className={compact ? "c-bars c-bars--compact" : "c-bars"} data-testid="contrast-bars">
      <ul className="c-bars__rows">
        {group.rows.map((row) => {
          const value = percent(row.k, row.n);
          return (
            <li key={row.label} className="c-bars__row">
              <span className="c-bars__label">
                <span className="c-bars__swatch" style={{ background: row.color }} aria-hidden />
                {row.label}
              </span>
              <span
                className="c-bars__track"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Number(value.toFixed(1))}
                aria-label={row.label}
              >
                <span
                  className="c-bars__fill"
                  style={{ width: `${value}%`, background: row.color }}
                />
              </span>
              <span className="c-bars__value">{formatPercent(value)}</span>
              {showCounts && (
                <span className="c-bars__count">
                  {row.k.toLocaleString("en-US")} / {row.n.toLocaleString("en-US")}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </figure>
  );
};
