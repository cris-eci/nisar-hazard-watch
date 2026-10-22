import type { HazardAnalysis } from "@/features/analysis/analysis.types";
import { Link } from "@/lib/Link";

type MethodDetailsProps = { lines: string[]; analysis: HazardAnalysis };

export const MethodDetails = ({ lines, analysis }: MethodDetailsProps) => (
  <details className="mt-4 text-xs text-slate-400">
    <summary className="cursor-pointer text-slate-300">Method and source scenes</summary>
    <ul className="mt-2 space-y-1">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
      <li className="break-all">Before: {analysis.before.granuleId}</li>
      {analysis.after.granuleId !== analysis.before.granuleId && (
        <li className="break-all">After: {analysis.after.granuleId}</li>
      )}
      <li>Generated {new Date(analysis.generatedAt).toLocaleString("en-US")}</li>
      <li>
        <Link to="/method" className="text-sky-300 underline">
          How this is computed and validated
        </Link>
      </li>
    </ul>
  </details>
);
