import type { HazardId } from "@/features/analysis/analysis.types";
import type { EnabledHazards, HazardDefinition } from "@/features/analysis/hazards";
import { SegmentedControl } from "@/lib/SegmentedControl";

type HazardPickerProps = {
  hazards: EnabledHazards;
  value: HazardId;
  onChange: (hazard: HazardId) => void;
};

// The dot previews each hazard's map colours: its strongest class, or the motion scale.
const swatch = (hazard: HazardDefinition): string =>
  hazard.kind === "deformation"
    ? "linear-gradient(90deg, #2563eb, #dc2626)"
    : hazard.severityColors.high;

// Renders nothing with a single hazard: a picker with one option is just noise.
export const HazardPicker = ({ hazards, value, onChange }: HazardPickerProps) =>
  hazards.length > 1 ? (
    <SegmentedControl
      label="Hazard"
      options={hazards.map((hazard) => ({
        value: hazard.id,
        label: hazard.label,
        swatch: swatch(hazard),
      }))}
      value={value}
      onChange={onChange}
      testIdPrefix="hazard"
      variant="grid"
    />
  ) : null;
