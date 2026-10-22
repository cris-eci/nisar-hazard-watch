import type { PassDirection } from "@/features/frames/frame.types";
import { PASS_LABEL } from "@/features/frames/passLabel";

const PASSES: PassDirection[] = ["A", "D"];

type PassToggleProps = { value: PassDirection; onChange: (pass: PassDirection) => void };

// Ascending and descending frames overlap everywhere, so the user picks one geometry at a time.
export const PassToggle = ({ value, onChange }: PassToggleProps) => (
  <div
    role="group"
    aria-label="Satellite pass direction"
    className="flex rounded-lg bg-white/5 p-1"
  >
    {PASSES.map((pass) => (
      <button
        key={pass}
        type="button"
        data-testid={`pass-toggle-${pass}`}
        aria-pressed={value === pass}
        onClick={() => onChange(pass)}
        className="flex-1 rounded-md px-3 py-1 text-sm text-slate-400 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-sky-400 aria-pressed:bg-white/10 aria-pressed:text-slate-100"
      >
        {PASS_LABEL[pass]}
      </button>
    ))}
  </div>
);
