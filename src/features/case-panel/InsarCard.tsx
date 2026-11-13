import { Prov } from "@/features/case-panel/Prov";
import type { InsarView } from "@/features/case-panel/subject";
import { SOURCE } from "@/features/case-panel/verdicts";

type CardProps = {
  insar: InsarView;
  // The report page brings its own heading.
  heading?: boolean;
};

// What the pair measured. Displacement is always stated as not reported, never left out.
export const InsarCard = ({ insar, heading = true }: CardProps) => (
  <div className="x-panel__block c-insar" data-testid="insar-card">
    {heading && (
      <p className="x-kicker x-kicker--split">
        <span>What the pair measured</span>
        <Prov kind="real" source={SOURCE.liveInsar} />
      </p>
    )}
    <dl className="c-insar__facts">
      {insar.facts.map((fact) => (
        <div key={fact.k}>
          <dt>{fact.k}</dt>
          <dd>{fact.v}</dd>
        </div>
      ))}
    </dl>
    <p className="c-insar__displacement" data-testid="insar-displacement">
      <strong>Displacement</strong> {insar.displacement}
    </p>
  </div>
);
