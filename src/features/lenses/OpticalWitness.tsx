import { STEP_6 } from "@/content/copyV8";
import { Prov } from "@/features/case-panel/Prov";
import { ContrastBars } from "@/features/charts/ContrastBars";
import { MatchedWhisker } from "@/features/charts/MatchedWhisker";
import type { WitnessView } from "@/features/lenses/opticalWitnessView";
import type { Provenance } from "@/lib/ProvenanceChip";

const SOURCE_OPTICAL =
  "Exploration API → result.lens.evaluation.water_comparison (OPERA DSWx groups against the radar rule)";

const CHIP: Record<Exclude<WitnessView["state"], "ready">, Provenance> = {
  pending: "pending",
  unavailable: "unavailable",
};

// PENDING and UNAVAILABLE are the chips' own text. READY · REAL is the COPY status as written, so
// it still says READY when REAL chips are hidden for a video.
export const OpticalWitness = ({ witness }: { witness: WitnessView }) => (
  <div className="x-lwitness" data-testid="lens-witness" data-state={witness.state}>
    <p className="x-kicker x-kicker--split">
      <span>{STEP_6.opticalTitle}</span>
      <span className="x-lwitness__status" data-testid="lens-witness-status">
        {witness.state === "ready" ? (
          <span title={SOURCE_OPTICAL}>{STEP_6.opticalReady}</span>
        ) : (
          <Prov kind={CHIP[witness.state]} source={SOURCE_OPTICAL} />
        )}
      </span>
    </p>
    {witness.state === "ready" ? (
      <>
        <p className="x-lwitness__lead" data-testid="lens-witness-lead">
          {witness.lead}
        </p>
        {witness.snapshots !== undefined && (
          <p className="x-lwitness__snapshots" data-testid="lens-witness-snapshots">
            {witness.snapshots}
          </p>
        )}
        {witness.bars.rows.length > 0 && <ContrastBars group={witness.bars} mode="plain" compact />}
        {witness.whisker !== undefined && <MatchedWhisker matched={witness.whisker} />}
        {witness.point !== undefined && (
          <p className="x-lwitness__point" data-testid="lens-witness-point">
            {witness.point}
          </p>
        )}
      </>
    ) : (
      witness.text !== undefined && (
        <p className="x-lwitness__text" data-testid="lens-witness-text">
          {witness.text}
        </p>
      )
    )}
  </div>
);
