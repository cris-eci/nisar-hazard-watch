import { Prov } from "@/features/case-panel/Prov";
import { SOURCE, VERDICT } from "@/features/case-panel/verdicts";
import type { SubjectVerdict } from "@/features/case-panel/subject";

// Departure is a gold diamond, within a ringed circle, insufficient a dashed circle (SPECS §2.7).
export const VerdictGlyph = ({ verdict }: { verdict: SubjectVerdict }) => (
  <span className={`x-glyph x-glyph--${verdict}`} aria-hidden="true" />
);

type VerdictCardProps = { verdict: SubjectVerdict; line: string; demo: boolean };

export const VerdictCard = ({ verdict, line, demo }: VerdictCardProps) => (
  <div className="x-verdict" data-testid="verdict" data-verdict={verdict}>
    <VerdictGlyph verdict={verdict} />
    <div className="x-verdict__text">
      <p className="x-verdict__label">
        {VERDICT[verdict].label}
        <Prov
          kind={demo ? "demo" : "real"}
          source={demo ? SOURCE.liveVerdict : SOURCE.caseVerdict}
        />
      </p>
      <p className="x-verdict__line">{line}</p>
    </div>
  </div>
);
