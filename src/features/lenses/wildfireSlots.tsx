import { FireContextCard } from "@/features/case-panel/FireContextCard";
import type { LensSlotsOf } from "@/features/lenses/lensSlots";

// Wildfire's second witness is NASA FIRMS (decision 6); its headline and rule block come with #27.
export const wildfireSlots: LensSlotsOf = ({ subject }) => ({
  witness: subject.fireContext && <FireContextCard context={subject.fireContext} />,
});
