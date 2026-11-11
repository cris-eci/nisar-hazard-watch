import { VERDICT } from "@/features/case-panel/verdicts";
import { findLens, type Case } from "@/features/cases/cases";
import { gridMetres } from "@/features/live/liveQuestion";

/*
 * The report's summary block. It is NOT AI-written yet: a fixed template filled with the case's own
 * fields, so every number in it also appears in a DATA block below and can be checked there.
 */

export const SUMMARY_LABEL = "Summary · written from the data above (template)";

export const areaOf = (item: Case): string =>
  item.chipKm === undefined
    ? "No processed area yet"
    : `${item.chipKm} km · ${gridMetres(item.chipKm)} m grid`;

export const reportSummary = (item: Case): string => {
  const question = findLens(item.lens)?.chip ?? item.lens;
  const verdict = VERDICT[item.verdict].label;
  const area = item.chipKm === undefined ? "the area" : `the ${item.chipKm} km area`;
  const stat =
    item.pending === true ? "" : ` Across ${area}, ${item.stat} ${item.statLine}`.trimEnd();
  const reason = item.reason === undefined ? "" : ` ${item.reason}`;
  return `${item.name} (${item.place}) was asked “${question}” Verdict: ${verdict}. ${item.verdictLine}${stat}${reason} ${item.plainLimit}`;
};
