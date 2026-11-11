import { keepDatesWhole } from "@/features/case-panel/keepDatesWhole";
import type { QualityItem } from "@/features/cases/cases";

// Three cells; the explanation lives in the title so the strip stays short.
export const QualityStrip = ({ items }: { items: QualityItem[] }) => (
  <ul className="x-quality" data-testid="quality-strip">
    {items.slice(0, 3).map((item) => (
      <li key={item.k} className="x-quality__cell" title={item.why}>
        <span className="x-quality__k">{item.k}</span>
        <span className="x-quality__v">{keepDatesWhole(item.v)}</span>
      </li>
    ))}
  </ul>
);
