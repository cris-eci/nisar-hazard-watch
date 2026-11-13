import {
  agricultureHeadline,
  neighboursBlockOf,
  neighboursLayerOf,
} from "@/features/lenses/agriculture";
import { AgricultureNeighbours } from "@/features/lenses/AgricultureNeighbours";
import type { LensSlotsOf } from "@/features/lenses/lensSlots";

// Agriculture: headline and the patch against its neighbours. No optical witness (§6.4) and no
// drivers until their thresholds exist (decision 7).
export const agricultureSlots: LensSlotsOf = ({
  evaluation,
  layers,
  shownLayerId,
  onShowLayer,
}) => {
  const block = neighboursBlockOf(evaluation);
  const layer = neighboursLayerOf(layers);
  return {
    headline: agricultureHeadline(evaluation),
    // The shell renders any non-null slot, so "nothing" must be undefined, never false.
    extra:
      block === undefined ? undefined : (
        <AgricultureNeighbours
          block={block}
          layer={layer}
          onGlobe={layer !== undefined && shownLayerId === layer.id}
          onShowLayer={onShowLayer}
        />
      ),
  };
};
