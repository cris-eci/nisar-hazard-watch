export type ChartMode = "plain" | "technical";

// HH solid with circles, HV dashed with squares: the channels never differ by colour alone.
export const CHANNEL = {
  hh: { label: "HH", color: "#e8894a", fill: "rgba(232,137,74,0.13)", dash: "0" },
  hv: { label: "HV", color: "#6fb3e8", fill: "rgba(111,179,232,0.13)", dash: "6 4" },
} as const;

export type ChannelId = keyof typeof CHANNEL;
