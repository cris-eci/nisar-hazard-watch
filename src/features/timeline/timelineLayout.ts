import type { PassKind, TimelineData } from "@/features/cases/cases";
import { nextPlannedPass } from "@/features/frames/nextPlannedPass";

/*
 * Pure layout maths for the Pass Timeline: where each pass, month tick and bracket sits (as % of
 * the axis), how tall each "% outside range" bar is, and what the readout says.
 */

export const BAR_MAX_PX = 20;
// Small shares stay readable against a floor of 10%, so 0.4% doesn't fill the bar.
const BAR_SCALE_FLOOR = 10;

export const axisPct = (date: string, start: string, end: string): number => {
  const a = Date.parse(start);
  const z = Date.parse(end);
  if (z <= a) return 0;
  return Math.max(0, Math.min(100, ((Date.parse(date) - a) / (z - a)) * 100));
};

// Baseline passes get a 1 px stub: they define the range, so nothing is "outside" there.
export const barHeight = (
  kind: PassKind,
  outsidePct: number | undefined,
  maxPct: number,
): number => {
  if (outsidePct !== undefined) return Math.max(2, (outsidePct / maxPct) * BAR_MAX_PX);
  return kind === "base" ? 1 : 0;
};

export type LaidPass = {
  index: number;
  date: string;
  kind: PassKind;
  outsidePct?: number;
  left: number;
  bar: number;
  // Planned passes are a promise, not data: never selectable.
  clickable: boolean;
  // The earliest planned pass after today, the one people actually wait for.
  next: boolean;
};

export type TimelineLayout = {
  passes: LaidPass[];
  months: Array<{ left: number; label: string }>;
  today: number;
  onset?: { left: number; label: string };
  optical: Array<{ left: number; label: string }>;
  baseline?: { left: number; width: number; count: number; first: string; last: string };
  targetIndex: number;
  measured: number[];
  next?: { left: number; date: string };
};

const monthLabel = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }).toUpperCase();

// First of every month strictly after the start, up to the end.
export const monthTicks = (start: string, end: string): string[] => {
  const ticks: string[] = [];
  const cursor = new Date(start);
  cursor.setUTCDate(1);
  cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  const last = Date.parse(end);
  while (cursor.getTime() <= last) {
    ticks.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return ticks;
};

export const layoutTimeline = (data: TimelineData): TimelineLayout => {
  const pct = (date: string) => axisPct(date, data.start, data.end);
  const maxPct = Math.max(BAR_SCALE_FLOOR, ...data.passes.map((item) => item.outsidePct ?? 0));
  const next = nextPlannedPass(
    data.passes.filter((item) => item.kind === "plan"),
    data.today,
  );
  const passes: LaidPass[] = data.passes.map((item, index) => ({
    index,
    date: item.date,
    kind: item.kind,
    ...(item.outsidePct !== undefined && { outsidePct: item.outsidePct }),
    left: pct(item.date),
    bar: barHeight(item.kind, item.outsidePct, maxPct),
    clickable: item.kind !== "plan",
    next: item === next,
  }));
  const base = passes.filter((item) => item.kind === "base");
  const first = base[0];
  const last = base.at(-1);
  const nextPass = passes.find((item) => item.next);
  return {
    passes,
    months: monthTicks(data.start, data.end).map((iso) => ({
      left: pct(iso),
      label: monthLabel(iso),
    })),
    today: pct(data.today),
    ...(data.onset !== undefined && {
      onset: { left: pct(data.onset.date), label: data.onset.label },
    }),
    optical: data.optical.map((item) => ({ left: pct(item.date), label: item.label })),
    ...(first !== undefined &&
      last !== undefined && {
        baseline: {
          left: first.left,
          width: last.left - first.left,
          count: base.length,
          first: first.date,
          last: last.date,
        },
      }),
    targetIndex: passes.findIndex((item) => item.kind === "target"),
    measured: passes.filter((item) => item.clickable).map((item) => item.index),
    ...(nextPass !== undefined && { next: { left: nextPass.left, date: nextPass.date } }),
  };
};

export const formatDay = (iso: string, withYear = true): string =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear && { year: "numeric" }),
    timeZone: "UTC",
  });

const ROLE: Record<PassKind, string> = {
  base: "baseline pass",
  target: "target pass",
  meas: "measured pass",
  plan: "planned pass",
};

export const passAria = (item: LaidPass): string => {
  const what =
    item.kind === "plan"
      ? `${item.next ? "Next planned" : "Planned"} pass from the Observation Plan, not acquired yet`
      : item.kind === "target"
        ? "Target pass"
        : item.kind === "base"
          ? "Baseline pass, defines the normal range"
          : "Measured pass";
  const share =
    item.outsidePct === undefined
      ? ""
      : ` · ${item.outsidePct.toFixed(1)}% of cells outside the normal range`;
  return `${formatDay(item.date)} · ${what}${share}`;
};

export const passCount = (count: number): string => `${count} pass${count === 1 ? "" : "es"}`;

export type Readout = { line: string; sub: string };

// Comparing: the baseline bracket against the target. Otherwise: the one pass in focus.
export const readoutOf = (
  data: TimelineData,
  layout: TimelineLayout,
  comparing: boolean,
  current: number,
): Readout => {
  const target = layout.passes[layout.targetIndex];
  if (comparing && target !== undefined && layout.baseline !== undefined) {
    const { count, first, last } = layout.baseline;
    const span =
      first === last
        ? formatDay(first, false)
        : `${formatDay(first, false)} – ${formatDay(last, false)}`;
    return {
      line: `Baseline (${passCount(count)}, ${span}) ↔ Target ${formatDay(target.date)}`,
      sub: data.opticalNote,
    };
  }
  const item = layout.passes[current];
  if (item === undefined) return { line: "", sub: "" };
  const sub =
    item.outsidePct !== undefined
      ? `${item.outsidePct.toFixed(1)}% of supported cells outside the normal range`
      : item.kind === "base"
        ? "Baseline passes define the normal range"
        : "";
  return { line: `${formatDay(item.date)} · ${ROLE[item.kind]}`, sub };
};
