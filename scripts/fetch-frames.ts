// Snapshots every NISAR frame from the Observation Plan API into public/data/frames.json.
// The app hit-tests frames locally, so hovering is instant and the demo survives an API outage.
// Run with: pnpm frames:fetch

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { OBSERVATION_PLAN_QUERY_URL } from "@/features/frames/observationPlanApi";
import { hasCrossPol } from "@/features/frames/radarMode";
import type { FramesFile, LonLat, RawFrame } from "@/features/frames/frame.types";

const OUTPUT = "public/data/frames.json";
const PAGE_SIZE = 2000; // service maxRecordCount

type GeoJsonFeature = {
  geometry:
    | { type: "Polygon"; coordinates: LonLat[][] }
    | { type: "MultiPolygon"; coordinates: LonLat[][][] }
    | null;
  properties: {
    track: number;
    frame: number;
    passdirection: "Ascending" | "Descending";
    unique_radar_mode_mnemonic_list: string | null;
  };
};

const fetchPage = async (offset: number): Promise<GeoJsonFeature[]> => {
  const params = new URLSearchParams({
    where: "1=1",
    outFields: "track,frame,passdirection,unique_radar_mode_mnemonic_list",
    outSR: "4326",
    geometryPrecision: "3", // ~100 m, plenty for a 240 km frame outline
    orderByFields: "fid",
    resultOffset: String(offset),
    resultRecordCount: String(PAGE_SIZE),
    f: "geojson",
  });
  const response = await fetch(`${OBSERVATION_PLAN_QUERY_URL}?${params}`);
  if (!response.ok) throw new Error(`Observation Plan API returned HTTP ${response.status}`);
  const body = (await response.json()) as { features: GeoJsonFeature[] };
  return body.features;
};

// Keeps outer rings only: NISAR frames have no holes.
const outerRings = (geometry: GeoJsonFeature["geometry"]): LonLat[][] => {
  if (geometry === null) return [];
  if (geometry.type === "Polygon") return geometry.coordinates.slice(0, 1);
  return geometry.coordinates.flatMap((polygon) => polygon.slice(0, 1));
};

const toRawFrame = (feature: GeoJsonFeature): RawFrame | null => {
  const rings = outerRings(feature.geometry);
  if (rings.length === 0) return null;
  const { track, frame, passdirection, unique_radar_mode_mnemonic_list } = feature.properties;
  return {
    t: track,
    f: frame,
    p: passdirection === "Ascending" ? "A" : "D",
    x: hasCrossPol(unique_radar_mode_mnemonic_list ?? "") ? 1 : 0,
    r: rings,
  };
};

const main = async (): Promise<void> => {
  const frames: RawFrame[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await fetchPage(offset);
    frames.push(...page.map(toRawFrame).filter((frame) => frame !== null));
    process.stdout.write(`\rFetched ${frames.length} frames`);
    if (page.length < PAGE_SIZE) break;
  }

  const file: FramesFile = { fetchedAt: new Date().toISOString(), frames };
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(file));
  process.stdout.write(`\nWrote ${OUTPUT}\n`);
};

await main();
