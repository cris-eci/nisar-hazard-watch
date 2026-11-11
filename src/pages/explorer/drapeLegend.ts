// The two report layers the globe can drape, and how their colours read.
export type DrapeKind = "change" | "baseline";

export type DrapeLegend = {
  ramp: string;
  // The same ramp as colour stops, for the PNG download's legend.
  stops: string[];
  scale: [string, string, string];
  text: string;
};

export const LEGEND: Record<DrapeKind, DrapeLegend> = {
  change: {
    ramp: "linear-gradient(90deg,#2f6db5,#f2f0eb,#c2473a)",
    stops: ["#2f6db5", "#f2f0eb", "#c2473a"],
    scale: ["−8 dB darker", "0", "+8 dB brighter"],
    text: "Signed change in HH, the first assessment minus the median of earlier passes.",
  },
  baseline: {
    ramp: "linear-gradient(90deg,#440154,#3b528b,#21918c,#5ec962,#fde725)",
    stops: ["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"],
    scale: ["−30 dB", "", "0 dB"],
    text: "Baseline median HH, from the backend report. Dark purple is calm water or smooth ground.",
  },
};
