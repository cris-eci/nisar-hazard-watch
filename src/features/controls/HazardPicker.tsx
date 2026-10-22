import type { HazardId } from "@/features/analysis/analysis.types";
import type { EnabledHazards } from "@/features/analysis/hazards";
import { SegmentedControl } from "@/lib/SegmentedControl";

type HazardPickerProps = {
  hazards: EnabledHazards;
  value: HazardId;
  onChange: (hazard: HazardId) => void;
};

// Renders nothing with a single hazard: a picker with one option is just noise.
export const HazardPicker = ({ hazards, value, onChange }: HazardPickerProps) =>
  hazards.length > 1 ? (
    <SegmentedControl
      label="Hazard"
      options={hazards.map(({ id, label }) => ({ value: id, label }))}
      value={value}
      onChange={onChange}
      testIdPrefix="hazard"
    />
  ) : null;
