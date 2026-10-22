import type { Frame } from "@/features/frames/frame.types";
import { PASS_LABEL } from "@/features/frames/passLabel";

const CURSOR_OFFSET_PX = 16;

type FrameTooltipProps = { frame: Frame; x: number; y: number };

export const FrameTooltip = ({ frame, x, y }: FrameTooltipProps) => (
  <div
    data-testid="frame-tooltip"
    className="x-tooltip"
    style={{ transform: `translate(${x + CURSOR_OFFSET_PX}px, ${y + CURSOR_OFFSET_PX}px)` }}
  >
    <p>
      Track {frame.track} · Frame {frame.frame} · {frame.hasCrossPol ? "HH+HV" : "HH only"}
    </p>
    <p className="x-tooltip__sub">{PASS_LABEL[frame.pass]} pass · click to analyze</p>
  </div>
);
