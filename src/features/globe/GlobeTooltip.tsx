const CURSOR_OFFSET_PX = 16;

export type TooltipContent = { title: string; sub: string };

type GlobeTooltipProps = { content: TooltipContent; x: number; y: number };

export const GlobeTooltip = ({ content, x, y }: GlobeTooltipProps) => (
  <div
    data-testid="globe-tooltip"
    className="x-tooltip"
    style={{ transform: `translate(${x + CURSOR_OFFSET_PX}px, ${y + CURSOR_OFFSET_PX}px)` }}
  >
    <p>{content.title}</p>
    <p className="x-tooltip__sub">{content.sub}</p>
  </div>
);
