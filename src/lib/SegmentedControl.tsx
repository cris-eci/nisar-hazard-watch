type Option<T extends string> = { value: T; label: string; swatch?: string };

type SegmentedControlProps<T extends string> = {
  label: string;
  options: Array<Option<T>>;
  value: T;
  onChange: (value: T) => void;
  testIdPrefix: string;
  variant?: "pills" | "small" | "grid" | "bar";
};

// Pills on a faint track, the picked one in ink. `grid` wraps many options in two columns.
export const SegmentedControl = <T extends string>({
  label,
  options,
  value,
  onChange,
  testIdPrefix,
  variant = "pills",
}: SegmentedControlProps<T>) => (
  <div
    role="group"
    aria-label={label}
    className={variant === "pills" ? "x-segments" : `x-segments x-segments--${variant}`}
  >
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        data-testid={`${testIdPrefix}-${option.value}`}
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
        className="x-segment"
      >
        {option.swatch !== undefined && (
          <span
            className="x-segment__swatch"
            style={{ background: option.swatch }}
            aria-hidden="true"
          />
        )}
        {option.label}
      </button>
    ))}
  </div>
);
