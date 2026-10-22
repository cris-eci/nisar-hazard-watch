// Must run before any Cesium viewer exists: it tells Cesium where its workers and assets live.
import "@/features/globe/cesiumBaseUrl";
import "cesium/Build/Cesium/Widgets/widgets.css";

import {
  type Cartesian2,
  Cartographic,
  Credit,
  CameraEventType,
  ImageryLayer,
  KeyboardEventModifier,
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

const MAX_ZOOM_OUT_METERS = 40_000_000; // twice the start height: far enough, never lost in space

export const createViewer = (container: HTMLElement): Viewer => {
  const viewer = new Viewer(container, {
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
  const controls = viewer.scene.screenSpaceCameraController;
  controls.maximumZoomDistance = MAX_ZOOM_OUT_METERS;
  // Touchpad pinch arrives as Ctrl + wheel, which Cesium ignores by default.
  controls.zoomEventTypes = [
    CameraEventType.RIGHT_DRAG,
    CameraEventType.WHEEL,
    CameraEventType.PINCH,
    { eventType: CameraEventType.WHEEL, modifier: KeyboardEventModifier.CTRL },
  ];
  return viewer;
};

export const pickLonLat = (viewer: Viewer, position: Cartesian2): LonLat | undefined => {
  const cartesian = viewer.camera.pickEllipsoid(position, viewer.scene.ellipsoid);
  if (cartesian === undefined) return undefined;
  const { longitude, latitude } = Cartographic.fromCartesian(cartesian);
  return [CesiumMath.toDegrees(longitude), CesiumMath.toDegrees(latitude)];
};
