import { Icon } from "@/features/case-panel/icons";
import { HazardIcon } from "@/features/cases/HazardIcon";
import { CASES, findLens, type Case } from "@/features/cases/cases";
import type { Frame } from "@/features/frames/frame.types";
import { Link } from "@/lib/Link";
import type { AsyncState } from "@/lib/useAsync";

export const VERSION = "Design v7 · 0.7.0";

type StartCardProps = {
  frames: AsyncState<Frame[]> | undefined;
  onOpen: (item: Case) => void;
  onRetryFrames: () => void;
  onStory: () => void;
  onSearch: () => void;
};

const country = (item: Case): string => item.place.split(",").at(-1)?.trim() ?? item.place;

// Nothing selected yet: the measured cases, and the way into a live question.
export const StartCard = ({ frames, onOpen, onRetryFrames, onStory, onSearch }: StartCardProps) => (
  <section className="x-start x-glass" aria-label="Start" data-testid="start-card">
    <p className="x-kicker">Measured cases · real NISAR passes</p>
    <h1 className="x-start__title">What did the radar see?</h1>
    <p className="x-start__body">
      At each marker our pipeline compared real NISAR passes with the place's own history. Pick one,
      or click any land to ask the radar yourself.
    </p>
    <button type="button" className="x-search-cta" onClick={onSearch} data-testid="search-cta">
      <Icon name="search" size={16} />
      Search a place
    </button>
    <ul className="x-cases">
      {CASES.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className="x-case"
            onClick={() => onOpen(item)}
            data-testid={`case-row-${item.id}`}
          >
            <span className="x-case__icon" data-pending={item.pending === true}>
              <HazardIcon id={item.hazard} size={14} />
            </span>
            <span className="x-case__text">
              <span>
                {item.name}, {country(item)}
              </span>
              <span className="x-case__q">{findLens(item.lens)?.chip}</span>
            </span>
            <span className="x-case__meta" data-pending={item.pending === true}>
              {item.pending === true ? "Pending" : item.when}
            </span>
          </button>
        </li>
      ))}
    </ul>
    <button type="button" className="x-story-start" onClick={onStory} data-testid="story-start">
      Watch the 1-minute story · Chenab flood
    </button>
    <FramesStatus state={frames} onRetry={onRetryFrames} />
    <p className="x-start__foot">
      <Link to="/about" testId="intro-team" className="x-start__team">
        Nova Frontier · Space Apps 2026
      </Link>
      <span>{VERSION}</span>
    </p>
  </section>
);

type FramesStatusProps = { state: AsyncState<Frame[]> | undefined; onRetry: () => void };

// Hovering and live questions need the frames snapshot; say so if it didn't load.
const FramesStatus = ({ state, onRetry }: FramesStatusProps) => {
  if (state?.status === "error")
    return (
      <p role="alert" className="x-start__status" data-testid="frames-status">
        Could not load the NISAR frames, so live questions are off.{" "}
        <button type="button" className="x-text" onClick={onRetry}>
          Try again
        </button>
      </p>
    );
  if (state?.status === "success" && state.data.length === 0)
    return (
      <p role="status" className="x-start__status" data-testid="frames-status">
        No NISAR frames in the snapshot, so live questions are off.
      </p>
    );
  return (
    <p role="status" className="x-start__status" data-testid="frames-status">
      {state?.status === "success"
        ? `${state.data.length.toLocaleString("en-US")} NISAR frames from the Observation Plan`
        : "Loading NISAR frames…"}
    </p>
  );
};

export const HintPill = () => (
  <p className="x-hint" data-testid="hint-pill">
    <span className="x-hint__ring" aria-hidden="true" />
    Click any land to ask the radar
    <span className="x-hint__meta">Demo answer for now</span>
  </p>
);
