import type { ReactNode } from "react";

import { Icon } from "@/features/case-panel/icons";
import { HazardIcon } from "@/features/cases/HazardIcon";
import { LENSES, type LensId } from "@/features/cases/cases";

type CasePanelProps = {
  meta: string;
  title: string;
  lens: LensId;
  collapsed: boolean;
  onLens: (lens: LensId) => void;
  onToggle: () => void;
  onClose: () => void;
  children: ReactNode;
};

// The left panel shell: kicker, title, the five questions, then whatever answers the question.
export const CasePanel = ({
  meta,
  title,
  lens,
  collapsed,
  onLens,
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
    <aside className="x-panel x-glass" aria-label={title} data-testid="case-panel">
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
      <div role="group" aria-label="Question" className="x-lenses">
        {LENSES.map((item) => (
          <button
            key={item.id}
            type="button"
            className="x-lens"
            aria-pressed={item.id === lens}
            onClick={() => onLens(item.id)}
            data-testid={`lens-${item.id}`}
          >
            <HazardIcon id={item.icon} size={14} />
            {item.chip}
          </button>
        ))}
      </div>
      {children}
    </aside>
  );
};
