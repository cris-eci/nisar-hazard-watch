import type { ExplorationResult } from "@/features/explore/exploreSchemas";
import type { NativeGrid } from "@/features/explore/scienceProducts";
import { absoluteApiPath } from "@/lib/api/apiClient";

export type Raster = {
  id: string;
  title: string;
  url: string;
  dates: string[];
  bounds: number[];
  crs?: string | null | undefined;
  grid?: NativeGrid | null | undefined;
  detail: string[];
};

const ACQUISITION = /^display_(\d{4}-\d{2}-\d{2})_(\w+)$/;
const COLOR_RAMPS: Record<string, string> = {
  gray: "linear-gradient(90deg,#000,#fff)",
  RdBu_r: "linear-gradient(90deg,#053061,#f7f7f7,#67001f)",
  viridis: "linear-gradient(90deg,#440154,#21918c,#fde725)",
  magma: "linear-gradient(90deg,#000004,#b5367a,#fcfdbf)",
  cividis: "linear-gradient(90deg,#00224e,#7c7b78,#fee838)",
  twilight: "linear-gradient(90deg,#e2d9e2,#6276ba,#301437,#b35859,#e2d9e2)",
};
const CATEGORIES = ["#cbbf9d", "#0072b2", "#56b4e9", "#e69f00", "#cc79a7"];

export const legendStyle = (palette: string): string | undefined => COLOR_RAMPS[palette];
export const categoryColor = (key: string): string | undefined => CATEGORIES[Number(key)];

export const rastersOf = (result: ExplorationResult) => {
  const products = result.products;
  const assets = new Map(products?.assets.map((asset) => [asset.name, asset.url]));
  const layers = result.layers.map((layer) => {
    const acquisition = ACQUISITION.exec(layer.id);
    return {
      ...layer,
      title: acquisition ? `${acquisition[2]} radar return` : layer.title,
      dates: layer.dates ?? (acquisition?.[1] ? [acquisition[1]] : []),
      url: absoluteApiPath(layer.url),
      detail: layer.valueRange
        ? [`${layer.valueRange[0]} to ${layer.valueRange[1]} ${layer.units}`]
        : [],
      original: acquisition !== null,
      polarization: acquisition?.[2],
    };
  });
  const visualizations = (products?.visualizations ?? []).flatMap((view) => {
    const url = assets.get(view.png);
    if (url === undefined) return [];
    const [height, width] = view.grid.shape;
    const epsg = /^EPSG:(\d+)$/.exec(view.grid.crs)?.[1];
    return [
      {
        ...view,
        url: absoluteApiPath(url),
        grid:
          epsg === undefined
            ? undefined
            : {
                epsg: Number(epsg),
                height,
                width,
                bounds_native: view.grid.bounds,
                pixel_spacing_m: view.grid.posting_m,
              },
        legend: null,
        detail: [
          `${view.supportedCells.toLocaleString("en-US")} of ${view.totalCells.toLocaleString("en-US")} native cells support this recipe.`,
          ...view.components.map(
            (component) =>
              `${component.band.toUpperCase()} · ${component.label} · ${component.displayDb.join(" to ")} dB`,
          ),
          view.interpretation,
        ],
      },
    ];
  });
  return { layers, visualizations };
};

export const aligned = (a: Raster, b: Raster): boolean => {
  const x = a.grid;
  const y = b.grid;
  return (
    x != null &&
    y != null &&
    a.crs === "EPSG:4326" &&
    a.crs === b.crs &&
    x.epsg === y.epsg &&
    x.width === y.width &&
    x.height === y.height &&
    x.bounds_native.every((value, index) => value === y.bounds_native[index]) &&
    x.pixel_spacing_m.every((value, index) => value === y.pixel_spacing_m[index]) &&
    a.bounds.every((value, index) => value === b.bounds[index])
  );
};

export const gridDescription = (grid: NativeGrid) => {
  const [dx, dy] = grid.pixel_spacing_m;
  return `${grid.width} × ${grid.height} cells · ${dx} × ${dy} m posting · ${((grid.width * dx) / 1000).toFixed(2)} × ${((grid.height * dy) / 1000).toFixed(2)} km · EPSG:${grid.epsg}`;
};
