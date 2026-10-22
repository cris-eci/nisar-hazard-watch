import "@/features/globe/cesiumBaseUrl";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "@/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/App";

const root = document.getElementById("root");
if (root === null) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
