import { useLayoutEffect, useRef } from "react";

import { formatCount, STEP_6 } from "@/content/copyV8";
import { Prov } from "@/features/case-panel/Prov";
import type { LiveLayer } from "@/features/explore/exploreLayers";
import type { RuleBlock } from "@/features/lenses/flood";
import { countUp } from "@/lib/motion";

const SOURCE_RULE =
  "Exploration API → result.lens.evaluation.grid_signatures.dual_darkening (signature_cells of supported_cells)";

type Props = {
  block: RuleBlock;
  // The dual-darkening flags layer, when the backend serves one.
  layer: LiveLayer | undefined;
  onGlobe: boolean;
  onShowLayer: (id: string | undefined) => void;
  reduce: boolean;
};

// WHERE THE FLOOD RULE IS MET: N of M cells on a fixed 0–100 % bar. Never the brightening layer.
export const FloodRuleBlock = ({ block, layer, onGlobe, onShowLayer, reduce }: Props) => {
  const countRef = useRef<HTMLSpanElement>(null);
  const head = formatCount(block.count);
  const tail = block.text.slice(head.length);

  useLayoutEffect(
    () =>
      countUp(
        block.count,
        (text) => {
          if (countRef.current !== null) countRef.current.textContent = text;
        },
        { reduce },
      ),
    [block.count, reduce],
  );

  return (
    <div className="x-lrule" data-testid="lens-rule">
      {layer !== undefined && (
        <img
          className="x-lrule__thumb"
          src={layer.href}
          alt={layer.title}
          data-testid="lens-rule-thumb"
        />
      )}
      <div className="x-lrule__body">
        <p className="x-kicker x-kicker--split">
          <span>{STEP_6.ruleTitle}</span>
          <Prov kind="real" source={SOURCE_RULE} />
        </p>
        <p className="x-lrule__count" data-testid="lens-rule-count">
          <span ref={countRef} className="x-lrule__n" />
          <span className="x-lrule__of">{tail}</span>
        </p>
        <div className="x-lrule__bar" aria-hidden="true">
          <i style={{ width: `${block.percent}%` }} />
        </div>
        <p className="x-lrule__axis" aria-hidden="true">
          <span>0%</span>
          <span>{block.percent.toFixed(1)}%</span>
          <span>100%</span>
        </p>
        {layer !== undefined && (
          <button
            type="button"
            className="x-lrule__toggle"
            aria-pressed={onGlobe}
            onClick={() => onShowLayer(onGlobe ? undefined : layer.id)}
            data-testid="lens-rule-toggle"
          >
            {onGlobe ? STEP_6.ruleToggleOn : STEP_6.ruleToggleOff}
          </button>
        )}
      </div>
      {block.caption !== undefined && (
        <p className="x-lrule__caption" data-testid="lens-rule-caption">
          {block.caption}
        </p>
      )}
    </div>
  );
};
