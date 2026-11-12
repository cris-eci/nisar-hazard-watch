import type { ExplorationView } from "@/features/explore/exploreSchemas";

export const EXPLORATION_SOURCE =
  "NISAR Hazard Watch exploration computed by the backend on NISAR L-band scenes. Diagnostic evidence, not a validated classifier; no cause, probability, hectares or displacement is reported.";

export const CSV_COLUMNS = ["date", "role", "status", "granule_id"] as const;

const escape = (value: string): string =>
  /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

export const explorationJson = (view: ExplorationView): string =>
  JSON.stringify({ source: EXPLORATION_SOURCE, exploration: view }, null, 2);

// One row per scene the service tried to read: its date, role in the comparison and outcome.
export const explorationCsv = (view: ExplorationView): string => {
  const target = view.result?.lens?.target_date;
  const baseline = new Set(view.result?.lens?.baseline_dates ?? []);
  const rows = (view.result?.observations ?? []).map((row) => {
    const role = row.date === target ? "target" : baseline.has(row.date) ? "baseline" : "other";
    return [row.date, role, row.status, row.granule_id ?? ""].map(escape).join(",");
  });
  return (
    [
      `# ${EXPLORATION_SOURCE}`,
      `# exploration ${view.id} · lens ${view.lens}`,
      CSV_COLUMNS.join(","),
      ...rows,
    ].join("\n") + "\n"
  );
};
