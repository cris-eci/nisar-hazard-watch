import { crossPolHistoryOf } from "@/features/explore/exploreSchemas";
import { FirmsWitness } from "@/features/lenses/FirmsWitness";
import type { LensSlotsOf } from "@/features/lenses/lensSlots";
import {
  declineLayerOf,
  declineRowsOf,
  pixelLineOf,
  wildfireHeadline,
} from "@/features/lenses/wildfire";
import { WildfireRuleBlock } from "@/features/lenses/WildfireRuleBlock";

// Wildfire: headline and rule block from lens.radar/point.cross_pol_history; FIRMS as the witness.
// No drivers until their thresholds exist (decision 7).
export const wildfireSlots: LensSlotsOf = ({
  view,
  subject,
  layers,
  shownLayerId,
  onShowLayer,
}) => {
  const history = view.result === null ? undefined : crossPolHistoryOf(view.result);
  const rows = declineRowsOf(history);
  const pixelLine = pixelLineOf(history);
  const layer = declineLayerOf(layers);
  return {
    headline: wildfireHeadline(history),
    // The shell renders any non-null slot, so "nothing" must be undefined, never false.
    extra:
      rows.length > 0 || pixelLine !== undefined ? (
        <WildfireRuleBlock
          rows={rows}
          pixelLine={pixelLine}
          layer={layer}
          onGlobe={layer !== undefined && shownLayerId === layer.id}
          onShowLayer={onShowLayer}
        />
      ) : undefined,
    witness:
      subject.fireContext === undefined ? undefined : (
        <FirmsWitness context={subject.fireContext} />
      ),
  };
};
