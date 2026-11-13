import type { ReactNode } from "react";

import { Icon } from "@/features/case-panel/icons";
import { LENSES, type LensId } from "@/features/cases/cases";

type CasePanelProps = {
  meta: string;
  title: string;
  lens: LensId;
  collapsed: boolean;
  // The lens buttons (LensPicker): the grid, or tabs above a lens result.
  picker: ReactNode;
  // A lens result: the panel widens to 400 px (SPECS-v8 §1).
  result?: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: ReactNode;
};

// The left panel shell: kicker, title, the lens picker, then whatever answers the question.
export const CasePanel = ({
  meta,
  title,
  lens,
  collapsed,
  picker,
  result = false,
  onToggle,
  onClose,
  children,
}: CasePanelProps) => {
  if (collapsed) {
    const chip = LENSES.find((item) => item.id === lens)?.chip ?? "";
    return (
      <button
        type="button"
        className="x-edge"
        onClick={onToggle}
        aria-label="Open the panel"
        data-testid="panel-edge"
      >
        <Icon name="expand" size={14} />
        <span className="x-edge__label">
          {title} · {chip}
        </span>
      </button>
    );
  }
  return (
    <aside
      className={result ? "x-panel x-panel--result x-glass" : "x-panel x-glass"}
      aria-label={title}
      data-testid="case-panel"
    >
      <div className="x-panel__head">
        <div className="x-panel__heading">
          <p className="x-kicker" data-testid="panel-meta">
            {meta}
          </p>
          <h2 className="x-panel__title" data-testid="panel-title">
            {title}
          </h2>
        </div>
        <button
          type="button"
          className="x-round"
          onClick={onToggle}
          aria-label="Collapse to the edge"
          title="Collapse"
          data-testid="panel-collapse"
        >
          <Icon name="collapse" size={14} />
        </button>
        <button
          type="button"
          className="x-round"
          onClick={onClose}
          aria-label="Close"
          title="Close (Esc)"
          data-testid="panel-close"
        >
          <Icon name="close" size={13} />
        </button>
      </div>
      {picker}
      {children}
    </aside>
  );
};
