import { STEP_6, WILDFIRE_CARD } from "@/content/copyV8";
import { FireContextCard } from "@/features/case-panel/FireContextCard";
import { Prov } from "@/features/case-panel/Prov";
import type { FireContextView } from "@/features/case-panel/subject";
import { SOURCE } from "@/features/case-panel/verdicts";

type Props = { context: FireContextView };

// Decision 6: NASA FIRMS is wildfire's second witness, in OPERA's place. It never feeds the verdict.
export const FirmsWitness = ({ context }: Props) => {
  const ready = context.status === "available";
  return (
    <div className="x-lwit" data-testid="lens-witness" data-status={context.status}>
      <p className="x-kicker x-kicker--split">
        <span>{WILDFIRE_CARD.witnessTitle}</span>
        <span className="x-lwit__status" data-ready={ready} data-testid="lens-witness-status">
          {ready ? STEP_6.opticalReady : STEP_6.opticalUnavailable}
        </span>
        {ready && <Prov kind="real" source={SOURCE.liveFire} />}
      </p>
      <FireContextCard context={context} heading={false} />
    </div>
  );
};
