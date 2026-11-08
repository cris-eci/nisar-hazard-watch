// Stroke icons for the explorer chrome (24 px grid, from the v7 prototype).
const PATHS = {
  globe:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01",
  fullscreen: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  close: "M6 6l12 12M18 6L6 18",
  collapse: "M15 6l-6 6 6 6",
  expand: "M9 6l6 6-6 6",
  arrow: "M5 12h14M13 6l6 6-6 6",
  tick: "M5 12.5l4.5 4.5L19 7.5",
  play: "M8 5.5v13l10.5-6.5z",
  pause: "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z",
  split: "M9 6l-6 6 6 6M15 6l6 6-6 6",
} as const;

export type IconName = keyof typeof PATHS;

type IconProps = { name: IconName; size?: number; filled?: boolean };

export const Icon = ({ name, size = 16, filled = false }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke={filled ? "none" : "currentColor"}
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={PATHS[name]} />
  </svg>
);
