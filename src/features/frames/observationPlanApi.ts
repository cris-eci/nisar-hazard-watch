import type { Acquisition } from "@/features/frames/frame.types";
import { hasCrossPol } from "@/features/frames/radarMode";

// NASA's public NISAR Observation Plan (ArcGIS feature service). No API key needed.
export const OBSERVATION_PLAN_QUERY_URL =
  "https://services7.arcgis.com/WSiUmUhlFx4CtMBB/arcgis/rest/services/nisar_merged_observation_plans/FeatureServer/0/query";

type PlanAttributes = {
  date_mode_popup: string;
  unique_radar_mode_list: string;
  unique_radar_mode_mnemonic_list: string;
};

// date_mode_popup is "2025-09-24 | 150\n2025-10-06 | 148,212\n...": one pass can use several
// modes. Mode codes and mnemonics are two ", "-separated lists in the same order, so code i is
// described by mnemonic i.
export const parseAcquisitions = ({
  date_mode_popup,
  unique_radar_mode_list,
  unique_radar_mode_mnemonic_list,
}: PlanAttributes): Acquisition[] => {
  const codes = unique_radar_mode_list.split(",").map((code) => code.trim());
  const mnemonics = unique_radar_mode_mnemonic_list.split(", ");
  const crossPolByCode = new Map(codes.map((code, i) => [code, hasCrossPol(mnemonics[i] ?? "")]));

  return date_mode_popup
    .split("\n")
    .map((line) => line.split(" | "))
    .filter((parts): parts is [string, string] => parts.length === 2)
    .map(([date, passCodes]) => ({
      date,
      hasCrossPol: passCodes.split(",").some((code) => crossPolByCode.get(code.trim()) === true),
    }));
};

export const fetchAcquisitions = async (
  track: number,
  frame: number,
  signal: AbortSignal,
): Promise<Acquisition[]> => {
  const params = new URLSearchParams({
    where: `track=${track} AND frame=${frame}`,
    outFields: "date_mode_popup,unique_radar_mode_list,unique_radar_mode_mnemonic_list",
    returnGeometry: "false",
    f: "json",
  });
  const response = await fetch(`${OBSERVATION_PLAN_QUERY_URL}?${params}`, { signal });
  if (!response.ok) throw new Error(`Observation Plan API returned HTTP ${response.status}`);

  const body = (await response.json()) as { features?: Array<{ attributes: PlanAttributes }> };
  const attributes = body.features?.[0]?.attributes;
  if (attributes === undefined) throw new Error(`Frame ${track}/${frame} is not in the plan`);
  return parseAcquisitions(attributes);
};
