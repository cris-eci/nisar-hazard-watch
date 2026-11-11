import type { LonLat } from "@/features/frames/frame.types";

// The box is taller below the point, so the case point lands about 30% from the top, above the
// card's text. Same provider as the explorer's base map.
export const esriImageryUrl = ([lon, lat]: LonLat): string => {
  const bbox = [lon - 0.32, lat - 0.56, lon + 0.32, lat + 0.24].map((v) => v.toFixed(3)).join(",");
  return (
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export" +
    `?bbox=${bbox}&bboxSR=4326&imageSR=3857&size=680,850&format=jpg&f=image`
  );
};
