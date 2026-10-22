import type { PassDirection } from "@/features/frames/frame.types";
import { PASS_LABEL } from "@/features/frames/passLabel";
import { SegmentedControl } from "@/lib/SegmentedControl";

const OPTIONS = (["A", "D"] as const).map((value) => ({ value, label: PASS_LABEL[value] }));

type PassToggleProps = { value: PassDirection; onChange: (pass: PassDirection) => void };

// Ascending and descending frames overlap everywhere, so the user picks one geometry at a time.
export const PassToggle = ({ value, onChange }: PassToggleProps) => (
  <SegmentedControl
    label="Satellite pass direction"
    options={OPTIONS}
    value={value}
    onChange={onChange}
    testIdPrefix="pass-toggle"
  />
);
