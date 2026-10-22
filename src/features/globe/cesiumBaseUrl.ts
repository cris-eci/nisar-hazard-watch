// Cesium loads its workers and assets at runtime from this path (copied there by vite.config.ts).
// Imported first in main.tsx so it is set before any viewer is created.
declare global {
  // Global augmentation only works with an interface.
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface Window {
    CESIUM_BASE_URL: string;
  }
}

window.CESIUM_BASE_URL = "/cesium/";

export {};
