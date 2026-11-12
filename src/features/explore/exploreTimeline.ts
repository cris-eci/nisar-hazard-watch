import type { PassKind, TimelineData, TimelinePass } from "@/features/cases/cases";
import type { ExplorationView } from "@/features/explore/exploreSchemas";
import type { Acquisition } from "@/features/frames/frame.types";

const DAY_MS = 86_400_000;
const MARGIN_DAYS = 14;
const AHEAD_DAYS = 45;

const addDays = (iso: string, days: number): string =>
  new Date(Date.parse(iso) + days * DAY_MS).toISOString().slice(0, 10);

const day = (iso: string): string => iso.slice(0, 10);

// The scenes the service read, plus the plan's future passes (a promise, never a measurement).
export const exploreTimeline = (
  view: ExplorationView,
  plan: Acquisition[] | undefined,
  today: string,
): TimelineData | undefined => {
  const result = view.result;
  if (result === null) return undefined;
  const observed = new Set(
    result.observations.filter((row) => row.status === "observed").map((row) => row.date),
  );
  const dates = result.scenes
    .map((scene) => day(scene.acquiredAt))
    .filter((date) => observed.has(date));
  if (dates.length === 0) return undefined;
  const target = result.lens?.target_date ?? dates.toSorted().at(-1);
  const baseline = new Set(result.lens?.baseline_dates ?? []);
  const kindOf = (date: string): PassKind =>
    date === target ? "target" : baseline.has(date) ? "base" : "meas";
  const measured: TimelinePass[] = dates.toSorted().map((date) => ({ date, kind: kindOf(date) }));
  const planned: TimelinePass[] = (plan ?? [])
    .filter((item) => item.date > today)
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)
    .map((item) => ({ date: item.date, kind: "plan" }));
  const first = measured[0]?.date ?? today;
  const last = [...measured, ...planned].at(-1)?.date ?? today;
  return {
    passes: [...measured, ...planned],
    start: addDays(first, -MARGIN_DAYS),
    end: addDays(last > today ? last : today, last > today ? MARGIN_DAYS : AHEAD_DAYS),
    today,
    optical: [],
    opticalNote: "",
  };
};
