import type { Frame } from "@/features/frames/frame.types";
import { CrossPolBadge } from "@/features/frames/FrameLabels";
import { PASS_LABEL } from "@/features/frames/passLabel";

const CURSOR_OFFSET_PX = 14;

type FrameTooltipProps = { frame: Frame; x: number; y: number };

export const FrameTooltip = ({ frame, x, y }: FrameTooltipProps) => (
  <div
    data-testid="frame-tooltip"
    className="pointer-events-none absolute rounded-md border border-white/10 bg-slate-950/85 px-3 py-2 text-sm text-slate-100 shadow-lg backdrop-blur"
    style={{ left: x + CURSOR_OFFSET_PX, top: y + CURSOR_OFFSET_PX }}
  >
    <div className="flex items-center gap-2">
      <span>
        Track {frame.track} · Frame {frame.frame}
      </span>
      <CrossPolBadge hasCrossPol={frame.hasCrossPol} />
    </div>
    <div className="text-xs text-slate-400">{PASS_LABEL[frame.pass]} pass · click to analyze</div>
  </div>
);
