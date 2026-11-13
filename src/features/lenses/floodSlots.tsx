import { floodHeadline, ruleBlockOf, ruleLayerOf } from "@/features/lenses/flood";
import { FloodRuleBlock } from "@/features/lenses/FloodRuleBlock";
import type { LensSlotsOf } from "@/features/lenses/lensSlots";

// Flood: headline and rule block from the evaluation. Second witness (OPERA) comes with #22.
export const floodSlots: LensSlotsOf = ({
  evaluation,
  layers,
  shownLayerId,
  onShowLayer,
  reduce,
}) => {
  const layer = ruleLayerOf(layers);
  const block = ruleBlockOf(evaluation, layer !== undefined);
  return {
    headline: floodHeadline(evaluation),
    extra: block && (
      <FloodRuleBlock
        block={block}
        layer={layer}
        onGlobe={layer !== undefined && shownLayerId === layer.id}
        onShowLayer={onShowLayer}
        reduce={reduce}
      />
    ),
  };
};
