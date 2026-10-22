import type { HazardAnalysis } from "@/features/analysis/analysis.types";
import { Link } from "@/lib/Link";

type MethodDetailsProps = { lines: string[]; analysis: HazardAnalysis };

export const MethodDetails = ({ lines, analysis }: MethodDetailsProps) => (
  <details className="x-details">
    <summary>Method and source scenes</summary>
    <ul className="x-details__lines">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
      <li>Before: {analysis.before.granuleId}</li>
      {analysis.after.granuleId !== analysis.before.granuleId && (
        <li>After: {analysis.after.granuleId}</li>
      )}
      <li>Generated {new Date(analysis.generatedAt).toLocaleString("en-US")}</li>
      <li>
        <Link to="/method" className="x-details__link">
          How this is computed and validated →
        </Link>
      </li>
    </ul>
  </details>
);
