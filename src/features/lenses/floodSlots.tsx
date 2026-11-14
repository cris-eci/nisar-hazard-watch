import { ACTIVE_STATUSES } from "@/features/explore/exploreSchemas";
import { floodDrivers } from "@/features/lenses/drivers";
import { floodHeadline, ruleBlockOf, ruleLayerOf } from "@/features/lenses/flood";
import { FloodRuleBlock } from "@/features/lenses/FloodRuleBlock";
import type { LensSlotsOf } from "@/features/lenses/lensSlots";
import { OpticalWitness } from "@/features/lenses/OpticalWitness";
import { witnessOf } from "@/features/lenses/opticalWitnessView";
import { PossibleDrivers } from "@/features/lenses/PossibleDrivers";

const ACTIVE: readonly string[] = ACTIVE_STATUSES;

// Flood: headline and rule block, OPERA second witness, and the possible drivers (#22).
export const floodSlots: LensSlotsOf = ({
  view,
  evaluation,
  layers,
  shownLayerId,
  onShowLayer,
  reduce,
}) => {
  const layer = ruleLayerOf(layers);
  const block = ruleBlockOf(evaluation, layer !== undefined);
  const witness = witnessOf(evaluation, ACTIVE.includes(view.status));
  const drivers = floodDrivers(evaluation);
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
    witness: witness && <OpticalWitness witness={witness} />,
    drivers: drivers && <PossibleDrivers view={drivers} />,
  };
};
