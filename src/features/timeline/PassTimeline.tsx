import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/features/case-panel/icons";
import { Prov } from "@/features/case-panel/Prov";
import { SOURCE } from "@/features/case-panel/verdicts";
import type { TimelineData } from "@/features/cases/cases";
import {
  layoutTimeline,
  passAria,
  formatDay,
  passCount,
  readoutOf,
  type LaidPass,
} from "@/features/timeline/timelineLayout";
import { ProvenanceChip } from "@/lib/ProvenanceChip";

const PLAY_MS = 900;
// Pixels from the top of the track: bars grow up from just above the radar axis.
const BAR_BASE_PX = 34;

// `demo` is true for a measured case (its pass dates are illustrative) and false for a live result.
type PassTimelineProps = { data: TimelineData; demo?: boolean };

const passClass = (item: LaidPass, comparing: boolean, selected: boolean): string => {
  const kind =
    item.kind === "plan"
      ? "plan"
      : comparing && item.kind === "target"
        ? "target"
        : comparing && item.kind === "base"
          ? "base"
          : "meas";
  return `x-tl__dot x-tl__dot--${kind}${item.next ? " x-tl__dot--next" : ""}${selected ? " x-tl__dot--on" : ""}`;
};

// SPECS §2.4: measured, compared (baseline bracket + target) and planned passes, with the optical lane.
export const PassTimeline = ({ data, demo = true }: PassTimelineProps) => {
  const layout = useMemo(() => layoutTimeline(data), [data]);
  const hasTarget = layout.targetIndex >= 0;
  const [comparing, setComparing] = useState(hasTarget);
  const [current, setCurrent] = useState(
    hasTarget ? layout.targetIndex : (layout.measured.at(-1) ?? 0),
  );
  const [playing, setPlaying] = useState(false);
  const isComparing = comparing && hasTarget;

  useEffect(() => {
    if (!playing || layout.measured.length === 0) return;
    let step = 0;
    const timer = window.setInterval(() => {
      step = (step + 1) % layout.measured.length;
      setCurrent(layout.measured[step] ?? 0);
    }, PLAY_MS);
    return () => window.clearInterval(timer);
  }, [playing, layout]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    setComparing(false);
    setCurrent(layout.measured[0] ?? 0);
    setPlaying(true);
  };

  const pick = (item: LaidPass) => {
    if (!item.clickable) return;
    setPlaying(false);
    setComparing(false);
    setCurrent(item.index);
  };

  const readout = readoutOf(data, layout, isComparing, current);
  const target = layout.passes[layout.targetIndex];
  const hasOptical = data.optical.length > 0;

  return (
    <section className="x-timeline x-glass" aria-label="Pass timeline" data-testid="timeline">
      <div className="x-tl__head">
        <button
          type="button"
          className="x-tl__play"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play through measured passes"}
          data-testid="timeline-play"
        >
          <Icon name={playing ? "pause" : "play"} size={13} filled />
        </button>
        <div className="x-tl__readout" aria-live="polite">
          <span className="x-tl__line" data-testid="timeline-readout">
            {readout.line}
          </span>
          <span className="x-tl__sub">{readout.sub}</span>
        </div>
        {demo ? (
          <ProvenanceChip kind="demoDates" source={SOURCE.timeline} />
        ) : (
          <Prov kind="real" source={SOURCE.liveTimeline} />
        )}
        {hasTarget && (
          <button
            type="button"
            className="x-tl__compare"
            aria-pressed={isComparing}
            onClick={() => {
              setPlaying(false);
              setComparing(!isComparing);
            }}
            data-testid="timeline-compare"
          >
            Baseline ↔ Target
          </button>
        )}
      </div>

      <div className="x-tl__track">
        <span className="x-tl__lane x-tl__lane--bars">
          Outside
          <br />
          range
        </span>
        <span className="x-tl__lane x-tl__lane--radar">Radar</span>
        <span className="x-tl__lane x-tl__lane--optical" data-off={!hasOptical}>
          Optical
        </span>
        <div className="x-tl__axis" style={{ width: `${layout.today}%` }} />
        <div className="x-tl__axis x-tl__axis--planned" style={{ left: `${layout.today}%` }} />
        <div className="x-tl__optical-axis" data-off={!hasOptical} />
        {layout.onset !== undefined && (
          <>
            <div className="x-tl__onset" style={{ left: `${layout.onset.left}%` }} />
            <span className="x-tl__onset-label" style={{ left: `${layout.onset.left}%` }}>
              {layout.onset.label}
            </span>
          </>
        )}
        <div className="x-tl__today" style={{ left: `${layout.today}%` }} />
        <span className="x-tl__today-label" style={{ left: `${layout.today}%` }}>
          Today
        </span>
        {layout.baseline !== undefined && isComparing && (
          <>
            <div
              className="x-tl__bracket"
              style={{ left: `${layout.baseline.left}%`, width: `${layout.baseline.width}%` }}
            />
            <span className="x-tl__bracket-label" style={{ left: `${layout.baseline.left}%` }}>
              Baseline · {passCount(layout.baseline.count)}
            </span>
          </>
        )}
        {layout.next !== undefined && (
          <span
            className="x-tl__planned-label"
            style={{ left: `${layout.next.left}%` }}
            data-testid="timeline-next"
          >
            Next
          </span>
        )}
        {layout.passes.map((item) => {
          const selected = !isComparing && item.index === current;
          const lit = selected || (isComparing && item.kind === "target");
          return (
            <span key={item.date}>
              {item.bar > 0 && (
                <span
                  className="x-tl__bar"
                  data-kind={item.kind}
                  data-lit={lit}
                  style={{
                    left: `${item.left}%`,
                    top: `${BAR_BASE_PX - item.bar}px`,
                    height: `${item.bar}px`,
                  }}
                />
              )}
              <button
                type="button"
                className="x-tl__pass"
                style={{ left: `${item.left}%` }}
                aria-label={passAria(item)}
                title={passAria(item)}
                disabled={!item.clickable}
                aria-current={selected ? "true" : undefined}
                onClick={() => pick(item)}
                data-testid={`timeline-pass-${item.index}`}
                data-kind={item.kind}
                data-next={item.next || undefined}
              >
                <span className={passClass(item, isComparing, selected)} />
              </button>
            </span>
          );
        })}
        {target !== undefined && (
          <span className="x-tl__target-label" style={{ left: `${target.left}%` }}>
            Target
          </span>
        )}
        {layout.optical.map((item) => (
          <span
            key={item.label}
            className="x-tl__optical"
            style={{ left: `${item.left}%` }}
            title={item.label}
          />
        ))}
        {layout.months.map((month) => (
          <span key={month.left} className="x-tl__month" style={{ left: `${month.left}%` }}>
            {month.label}
          </span>
        ))}
      </div>

      <div className="x-tl__legend">
        <span>
          <i className="x-tl__key x-tl__key--meas" />
          Measured
        </span>
        <span>
          <i className="x-tl__key x-tl__key--target" />
          Compared
        </span>
        <span data-testid="timeline-planned-legend">
          <i className="x-tl__key x-tl__key--plan" />
          Planned · a promise, not data
          {layout.next !== undefined && ` · next ${formatDay(layout.next.date, false)}`}
        </span>
        <span data-off={!hasOptical}>
          <i className="x-tl__key x-tl__key--optical" />
          OPERA optical
        </span>
        <span className="x-tl__source">NISAR Observation Plan · 12-day repeat</span>
      </div>
    </section>
  );
};
