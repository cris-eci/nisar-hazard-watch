import { LENS_CARD, LENS_COPY, STEP_3, STEP_4 } from "@/content/copyV8";
import { Icon } from "@/features/case-panel/icons";
import { HazardIcon } from "@/features/cases/HazardIcon";
import { findLens, type LensId } from "@/features/cases/cases";
import { countdown, formatClock } from "@/features/explore/exploreTiming";
import type { ExplorationView } from "@/features/explore/exploreSchemas";
import type { CardLens } from "@/features/lenses/lensSlots";
import { useNow } from "@/lib/useNow";

const CARD_LENSES = Object.keys(LENS_COPY) as CardLens[];

const iconOf = (lens: LensId) => findLens(lens)?.icon ?? "flood";

export type LensRun = {
  lens: CardLens;
  // Undefined until the backend has answered the first request of this run.
  view: ExplorationView | undefined;
  receivedAt: number;
};

type RowProps = { run: LensRun; onCancel: () => void };

// SPECS-v8 §5: a compact row under the grid while a lens switch runs; the other lenses stay usable.
const LensRunningRow = ({ run, onCancel }: RowProps) => {
  const now = useNow(true);
  const elapsed =
    run.view === undefined ? 0 : countdown(run.view, run.receivedAt, now).elapsedSeconds;
  return (
    <div className="x-lrun" role="status" aria-live="polite" data-testid="lens-running">
      <span className="x-lrun__dot" aria-hidden="true" />
      <div className="x-lrun__text">
        <p className="x-lrun__title">{STEP_3.compactTitle(LENS_COPY[run.lens].label)}</p>
        <p className="x-lrun__sub" data-testid="lens-running-elapsed">
          {LENS_CARD.runningSub(formatClock(elapsed))}
        </p>
      </div>
      <button
        type="button"
        className="x-round"
        onClick={onCancel}
        aria-label={LENS_CARD.cancelLens}
        title={LENS_CARD.cancelLens}
        data-testid="lens-running-cancel"
      >
        <Icon name="close" size={13} />
      </button>
    </div>
  );
};

type Props = {
  lens: LensId;
  // Tabs above a lens result; the full grid otherwise.
  tabs: boolean;
  running: LensRun | undefined;
  onLens: (lens: LensId) => void;
  onCancel: () => void;
};

// The four lenses, their questions and ground motion (decision 2): every control picks a lens the
// same way, so a question link and its button ask the same run and write the same shared link.
export const LensPicker = ({ lens, tabs, running, onLens, onCancel }: Props) => {
  const ground = (
    <button
      type="button"
      className={tabs ? "x-ltab x-ltab--ground" : "x-lground"}
      aria-pressed={lens === "insar"}
      onClick={() => onLens("insar")}
      data-testid="lens-insar"
    >
      <HazardIcon id={iconOf("insar")} size={tabs ? 13 : 16} />
      <span>{LENS_CARD.groundMotion}</span>
      <span className="x-lground__note">{LENS_CARD.groundMotionNote}</span>
    </button>
  );
  if (tabs)
    return (
      <div role="group" aria-label="Lens" className="x-ltabs" data-testid="lens-tabs">
        {CARD_LENSES.map((id) => (
          <button
            key={id}
            type="button"
            className="x-ltab"
            aria-pressed={id === lens}
            onClick={() => onLens(id)}
            data-testid={`lens-${id}`}
          >
            <HazardIcon id={iconOf(id)} size={13} />
            {LENS_COPY[id].label}
          </button>
        ))}
        {ground}
      </div>
    );
  return (
    <div className="x-lpick" data-testid="lens-picker">
      <p className="x-kicker x-lpick__title">{STEP_4.lensTitle}</p>
      <div role="group" aria-label="Lens" className="x-lgrid">
        {CARD_LENSES.map((id) => (
          <button
            key={id}
            type="button"
            className="x-lbtn"
            aria-pressed={id === lens}
            data-running={running?.lens === id || undefined}
            onClick={() => onLens(id)}
            data-testid={`lens-${id}`}
          >
            <HazardIcon id={iconOf(id)} size={18} />
            <span>{LENS_COPY[id].label}</span>
          </button>
        ))}
      </div>
      {running !== undefined && <LensRunningRow run={running} onCancel={onCancel} />}
      <div className="x-lask">
        <p className="x-lask__title">{STEP_4.lensOrAsk}</p>
        {CARD_LENSES.map((id) => (
          <button
            key={id}
            type="button"
            className="x-lask__q"
            onClick={() => onLens(id)}
            data-testid={`lens-ask-${id}`}
          >
            <span aria-hidden="true">→</span>
            {LENS_COPY[id].question}
          </button>
        ))}
      </div>
      {ground}
    </div>
  );
};
