import { Prov } from "@/features/case-panel/Prov";
import type { FireContextView } from "@/features/case-panel/subject";
import { SOURCE } from "@/features/case-panel/verdicts";

type CardProps = {
  context: FireContextView;
  // The report page brings its own heading.
  heading?: boolean;
};

// Independent thermal evidence from NASA FIRMS. It never feeds the verdict, and when it is missing
// the card says the answer is radar-only instead of staying silent.
export const FireContextCard = ({ context, heading = true }: CardProps) => (
  <div className="x-panel__block c-fire" data-testid="fire-context" data-status={context.status}>
    {heading && (
      <p className="x-kicker x-kicker--split">
        <span>Independent fire context</span>
        {context.status === "available" && <Prov kind="real" source={SOURCE.liveFire} />}
      </p>
    )}
    <p className="c-fire__headline">{context.headline}</p>
    {context.facts.length > 0 && (
      <dl className="c-fire__facts">
        {context.facts.map((fact) => (
          <div key={fact.k}>
            <dt>{fact.k}</dt>
            <dd>{fact.v}</dd>
          </div>
        ))}
      </dl>
    )}
    <p className="c-fire__note">{context.note}</p>
  </div>
);
