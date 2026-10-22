type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  label: string;
  options: Array<Option<T>>;
  value: T;
  onChange: (value: T) => void;
  testIdPrefix: string;
};

export const SegmentedControl = <T extends string>({
  label,
  options,
  value,
  onChange,
  testIdPrefix,
}: SegmentedControlProps<T>) => (
  <div role="group" aria-label={label} className="flex rounded-lg bg-white/5 p-1">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        data-testid={`${testIdPrefix}-${option.value}`}
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
        className="flex-1 rounded-md px-3 py-1 text-sm text-slate-400 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-sky-400 aria-pressed:bg-white/10 aria-pressed:text-slate-100"
      >
        {option.label}
      </button>
    ))}
  </div>
);
