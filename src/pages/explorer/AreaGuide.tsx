import type { DrawRejection } from "@/features/geo/drawMachine";
import type { Area, DrawTool } from "@/features/geo/geo.types";
import {
  formatKm2,
  MAX_AREA_KM2,
  MAX_VERTICES,
  MIN_VERTICES,
  SIZE_GUIDE,
} from "@/features/geo/limits";
import type { DraftView } from "@/features/globe/drawTools";

export type AreaIssue =
  | { kind: "tooLarge"; area: Area; km2: number }
  | { kind: "noFrame" }
  | { kind: "rejected"; reason: DrawRejection };

const HOW: Record<DrawTool, string> = {
  point: "Click the globe: the radar reads a 10 × 10 km square around it.",
  rectangle: "Press, drag and release to draw a rectangle.",
  polygon: "Click each corner. Double-click, Enter or Finish closes it.",
};

const LEVEL_TEXT = {
  ideal: "Within the ideal size.",
  large:
    "Larger than ideal: the radar reads a window of about 10 km, and what lies outside it is flagged as not measured.",
  tooLarge: "Over the limit: when you finish you can use the centred 10 × 10 km square instead.",
};

const REJECTED: Record<DrawRejection, string> = {
  "too-small": "That drag was too short. Press, drag a little further and release.",
  "too-few-corners": `A polygon needs at least ${MIN_VERTICES} corners.`,
  "too-many-corners": `A polygon can have up to ${MAX_VERTICES} corners.`,
};

type AreaGuideProps = {
  tool: DrawTool | undefined;
  draft: (DraftView & { km2: number }) | undefined;
  issue: AreaIssue | undefined;
  // How many corners the polygon in progress has, to offer Finish only when it can close.
  corners: number;
  onFinish: () => void;
  onCancel: () => void;
  onUseSquare: () => void;
  onDismiss: () => void;
};

// What to do next, and the size limits, next to the tools. Announced politely: it changes while drawing.
export const AreaGuide = ({
  tool,
  draft,
  issue,
  corners,
  onFinish,
  onCancel,
  onUseSquare,
  onDismiss,
}: AreaGuideProps) => {
  if (issue?.kind === "tooLarge")
    return (
      <section
        className="x-guide x-glass"
        role="alert"
        data-level="tooLarge"
        data-testid="area-guide"
      >
        <p className="x-guide__title">
          {formatKm2(issue.km2)} is over the {MAX_AREA_KM2} km² limit
        </p>
        <p className="x-guide__text">
          The radar reads at most 20 × 20 km, and 10 × 10 km is ideal. Draw a smaller area, or use
          the 10 × 10 km square centred on this one.
        </p>
        <div className="x-guide__actions">
          <button type="button" onClick={onUseSquare} data-testid="area-use-square">
            Use the centred 10 × 10 km square
          </button>
          <button
            type="button"
            className="x-guide__quiet"
            onClick={onDismiss}
            data-testid="area-dismiss"
          >
            Discard
          </button>
        </div>
      </section>
    );
  if (issue !== undefined)
    return (
      <section
        className="x-guide x-glass"
        role="alert"
        data-level="notice"
        data-testid="area-guide"
      >
        <p className="x-guide__title" data-testid="area-notice">
          {issue.kind === "noFrame" ? "No NISAR frame covers this area" : REJECTED[issue.reason]}
        </p>
        {issue.kind === "noFrame" && (
          <p className="x-guide__text">
            A live question needs a NISAR frame under the centre of the area. Try another spot.
          </p>
        )}
        <div className="x-guide__actions">
          <button
            type="button"
            className="x-guide__quiet"
            onClick={onDismiss}
            data-testid="area-dismiss"
          >
            OK
          </button>
        </div>
      </section>
    );
  if (tool === undefined) return null;
  return (
    <section
      className="x-guide x-glass"
      role="status"
      aria-live="polite"
      data-level={draft?.level ?? "ideal"}
      data-testid="area-guide"
    >
      <p className="x-guide__title">{HOW[tool]}</p>
      <p className="x-guide__size" data-testid="area-size">
        {SIZE_GUIDE}
        {draft !== undefined && draft.closed && <> · now {formatKm2(draft.km2)}</>}
      </p>
      {draft !== undefined && draft.closed && tool !== "point" && (
        <p className="x-guide__text">{LEVEL_TEXT[draft.level]}</p>
      )}
      {tool === "polygon" && corners > 0 && (
        <div className="x-guide__actions">
          <button
            type="button"
            onClick={onFinish}
            disabled={corners < MIN_VERTICES}
            data-testid="area-finish"
          >
            Finish
          </button>
          <button
            type="button"
            className="x-guide__quiet"
            onClick={onCancel}
            data-testid="area-cancel"
          >
            Cancel
          </button>
        </div>
      )}
    </section>
  );
};
