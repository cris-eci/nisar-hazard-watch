import type { IconId } from "@/features/cases/cases";

// 24 px stroke icons from the v7 handoff (icons/*.svg). They never use the hazard data colours.
const PATHS: Record<IconId, string> = {
  earthquake: "M2 12h4l2-5 3 10 3-12 2 7h6",
  flood:
    "M12 3c2.5 3 4 5 4 7a4 4 0 0 1-8 0c0-2 1.5-4 4-7zM3 19c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1",
  wildfire:
    "M12 3c.5 3 4 4.8 4 9.2a4 4 0 0 1-8 .2c0-1.8.9-3 2-3.9.2 1.7 1 2.6 2 2.9-.6-2.8-.4-5.8 0-8.4z",
  deforestation: "M12 3l5 7h-3l4 6H6l4-6H7zM12 16v5M8 21h8",
  landslide:
    "M3 20h18M3 20l6-10 3.5 4.5M12.5 14.5l2-2 6.5 7.5M15 8.5l1.6-.8M17.5 11.5l1.8-.2M13.5 5.5l.6-1.6",
  agriculture:
    "M3 20h18M7 20v-8M12 20V8M17 20v-8M7 12c-2 0-3-1.5-3-3.5 2 0 3 1.5 3 3.5zM12 8c-2 0-3-1.5-3-3.5 2 0 3 1.5 3 3.5zM17 12c2 0 3-1.5 3-3.5-2 0-3 1.5-3 3.5z",
};

export const ICON_PATHS = PATHS;

type HazardIconProps = { id: IconId; size?: number };

export const HazardIcon = ({ id, size = 16 }: HazardIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={PATHS[id]} />
  </svg>
);
