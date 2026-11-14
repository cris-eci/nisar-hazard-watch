import { TOP_BAR } from "@/content/copyV8";
import type { Direction } from "@/features/explore/exploreApi";

type DirectionSwitchProps = { direction: Direction; onChange: (direction: Direction) => void };

const OPTIONS = [
  { id: "ascending", label: TOP_BAR.ascending, short: TOP_BAR.ascendingMobile },
  { id: "descending", label: TOP_BAR.descending, short: TOP_BAR.descendingMobile },
] as const;

// Which orbit direction's passes a live question reads. The short labels show on phones.
export const DirectionSwitch = ({ direction, onChange }: DirectionSwitchProps) => (
  <div
    role="group"
    aria-label="Orbit direction"
    className="x-source x-direction"
    data-testid="direction-switch"
  >
    {OPTIONS.map(({ id, label, short }) => (
      <button
        key={id}
        type="button"
        aria-pressed={direction === id}
        aria-label={label}
        onClick={() => onChange(id)}
        data-testid={`direction-${id}`}
      >
        <span className="x-direction__long">{label}</span>
        <span className="x-direction__short" aria-hidden="true">
          {short}
        </span>
      </button>
    ))}
  </div>
);
