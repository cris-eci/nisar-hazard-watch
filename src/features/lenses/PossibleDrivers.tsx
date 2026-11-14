import { DRIVERS } from "@/content/copyV8";
import type { DriversView } from "@/features/lenses/drivers";
import { ProvenanceChip } from "@/lib/ProvenanceChip";

const SOURCE_DRIVERS =
  "Interpretation built from result.lens.evaluation.water_comparison groups and confounders; not a result";

// POSSIBLE DRIVERS (SPECS-v8 §6.5). The HYPOTHESIS chip is permanent, so it ignores "show REAL".
export const PossibleDrivers = ({ view }: { view: DriversView }) => (
  <div className="x-ldrivers" data-testid="lens-drivers">
    <p className="x-kicker x-kicker--split">
      <span>{DRIVERS.kicker}</span>
      <ProvenanceChip kind="hypothesis" source={SOURCE_DRIVERS} />
    </p>
    <p className="x-ldrivers__intro">{DRIVERS.intro}</p>
    <ul className="x-ldrivers__list">
      {view.drivers.map((driver) => (
        <li
          key={driver.id}
          className="x-ldriver"
          data-testid={`lens-driver-${driver.id}`}
          data-fit={driver.fit}
        >
          <p className="x-ldriver__head">
            <span className="x-ldriver__title">{driver.title}</span>
            <span className={`x-ldriver__fit x-ldriver__fit--${driver.fit}`}>
              {DRIVERS.fit[driver.fit]}
            </span>
          </p>
          <p className="x-ldriver__line">
            <span className="x-ldriver__k">{DRIVERS.forLabel}</span>
            {driver.for}
          </p>
          <p className="x-ldriver__line">
            <span className="x-ldriver__k">{DRIVERS.againstLabel}</span>
            {driver.against}
          </p>
        </li>
      ))}
    </ul>
    <p className="x-ldrivers__footer" data-testid="lens-drivers-footer">
      {view.footer}
    </p>
  </div>
);
