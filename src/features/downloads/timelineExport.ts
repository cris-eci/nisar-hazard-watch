import type { Case, PassKind } from "@/features/cases/cases";

/*
 * Timeline downloads (JSON and CSV). Pass dates and "% outside range" are DEMO until the backend
 * serves real acquisitions, so every row says so and the file names its source.
 */

export type PassRow = {
  case: string;
  lens: string;
  date: string;
  role: "baseline" | "target" | "measured" | "planned";
  cells_outside_range_pct: number | null;
  measured: boolean;
  demo: boolean;
};

const ROLE: Record<PassKind, PassRow["role"]> = {
  base: "baseline",
  target: "target",
  meas: "measured",
  plan: "planned",
};

export const TIMELINE_SOURCE =
  "NISAR Hazard Watch timeline. Pass dates (12-day spacing) and cells_outside_range_pct are DEMO until the NISAR-Modeling backend serves real acquisitions; planned passes are not data.";

export const CSV_COLUMNS = [
  "case",
  "lens",
  "date",
  "role",
  "cells_outside_range_pct",
  "measured",
  "demo",
] as const;

export const timelineRows = (item: Case): PassRow[] =>
  (item.timeline?.passes ?? []).map((pass) => ({
    case: item.id,
    lens: item.lens,
    date: pass.date,
    role: ROLE[pass.kind],
    cells_outside_range_pct: pass.outsidePct ?? null,
    measured: pass.kind !== "plan",
    demo: true,
  }));

export const timelineJson = (item: Case): string =>
  JSON.stringify(
    { source: TIMELINE_SOURCE, case: item.id, lens: item.lens, passes: timelineRows(item) },
    null,
    2,
  );

export const timelineCsv = (item: Case): string => {
  const lines = timelineRows(item).map((row) =>
    CSV_COLUMNS.map((column) => row[column] ?? "").join(","),
  );
  return [`# ${TIMELINE_SOURCE}`, CSV_COLUMNS.join(","), ...lines].join("\n") + "\n";
};

export const saveBlob = (blob: Blob, name: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // Give the browser a moment to start the download before the URL goes away.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
