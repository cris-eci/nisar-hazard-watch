// The footer's Earth background is a 4096×2048 equirectangular map; the place sits under the marker.
const MAP_WIDTH = 4096;
const MAP_HEIGHT = 2048;

export const mapOffset = (lon: number, lat: number): { x: number; y: number } => ({
  x: Math.round(((lon + 180) / 360) * MAP_WIDTH),
  y: Math.round(((90 - lat) / 180) * MAP_HEIGHT),
});
