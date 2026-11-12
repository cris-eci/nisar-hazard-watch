import { Icon, type IconName } from "@/features/case-panel/icons";
import type { DrawTool } from "@/features/geo/geo.types";

type ToolSpec = { id: DrawTool; label: string; icon: IconName };

const TOOLS: ToolSpec[] = [
  { id: "point", label: "Point: a 10 × 10 km square around a click", icon: "pin" },
  { id: "rectangle", label: "Rectangle: press, drag, release", icon: "rectangle" },
  { id: "polygon", label: "Polygon: click the corners, double-click to close", icon: "polygon" },
];

type AreaToolsProps = {
  tool: DrawTool | undefined;
  // Why the tools can't be used right now (the guided tour); undefined when they can.
  disabledWhy: string | undefined;
  onTool: (tool: DrawTool | undefined) => void;
};

// Pressing the tool that is on turns it off, so the same click that started it ends it.
export const AreaTools = ({ tool, disabledWhy, onTool }: AreaToolsProps) => (
  <div role="group" aria-label="Choose an area" className="x-tools" data-testid="area-tools">
    {TOOLS.map(({ id, label, icon }) => (
      <button
        key={id}
        type="button"
        className="x-tools__button"
        aria-pressed={tool === id}
        aria-label={label}
        title={disabledWhy ?? label}
        disabled={disabledWhy !== undefined}
        onClick={() => onTool(tool === id ? undefined : id)}
        data-testid={`tool-${id}`}
      >
        <Icon name={icon} size={18} />
      </button>
    ))}
  </div>
);
