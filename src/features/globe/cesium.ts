import {
  type Cartesian2,
  Cartographic,
  Credit,
  ImageryLayer,
  Math as CesiumMath,
  UrlTemplateImageryProvider,
  Viewer,
} from "cesium";

import type { LonLat } from "@/features/frames/frame.types";

// Esri World Imagery needs no API key, so the app runs without a Cesium ion token.
const createBaseLayer = (): ImageryLayer =>
  new ImageryLayer(
    new UrlTemplateImageryProvider({
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      maximumLevel: 18,
      credit: new Credit("Imagery © Esri, Maxar, Earthstar Geographics"),
    }),
  );

export const createViewer = (container: HTMLElement): Viewer =>
  new Viewer(container, {
    baseLayer: createBaseLayer(),
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
  });

export const pickLonLat = (viewer: Viewer, position: Cartesian2): LonLat | undefined => {
  const cartesian = viewer.camera.pickEllipsoid(position, viewer.scene.ellipsoid);
  if (cartesian === undefined) return undefined;
  const { longitude, latitude } = Cartographic.fromCartesian(cartesian);
  return [CesiumMath.toDegrees(longitude), CesiumMath.toDegrees(latitude)];
};
