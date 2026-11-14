import { STEP_2, STEP_3 } from "@/content/copyV8";
import { Prov } from "@/features/case-panel/Prov";
import { Icon } from "@/features/case-panel/icons";
import type { Case } from "@/features/cases/cases";
import { explorationProblem } from "@/features/explore/exploreProblems";
import { formatLonLat } from "@/features/live/liveQuestion";
import type { Place } from "@/features/search/placesApi";
import { caseName } from "@/features/search/searchRows";
import type { Coverage } from "@/features/spot/coverageApi";
import { aboutKm, spotView, type Nearest } from "@/features/spot/spot";
import { ApiError } from "@/lib/api/apiClient";
import type { AsyncState } from "@/lib/useAsync";

const SOURCE_DATES =
  "Exploration API → GET /api/v1/coverage plan.dates (the NISAR catalog, one series)";

type SpotCardProps = {
  // A search hit, or a clicked point named by its own coordinates (no reverse geocoder exists).
  place: Place;
  coverage: AsyncState<Coverage> | undefined;
  nearest: Nearest | undefined;
  // A NISAR frame from the local snapshot is needed to ask; undefined keeps Analyze off.
  canAsk: boolean;
  onAnalyse: () => void;
  onRetry: () => void;
  onOpenCase: (item: Case) => void;
  // "Pick another spot", "Open a known case instead" and the close button: back to the list.
  onClose: () => void;
};

const problemOf = (error: Error) =>
  explorationProblem(
    error instanceof ApiError
      ? { reasonCode: error.reasonCode, detail: error.message }
      : { reasonCode: "", detail: error.message },
  );

/*
 * Step 2 (SPECS-v8 §2): what the catalog holds at the picked spot, before anything is run. Every
 * date and size comes from GET /api/v1/coverage; the grid's posting and cell count only exist once
 * a job ran, so the area card shows the square's side alone.
 */
export const SpotCard = ({
  place,
  coverage,
  nearest,
  canAsk,
  onAnalyse,
  onRetry,
  onOpenCase,
  onClose,
}: SpotCardProps) => {
  const coords = formatLonLat(place.point);
  const view = coverage?.status === "success" ? spotView(coverage.data) : undefined;
  const noData = view?.state === "noCoverage";
  const title = noData ? STEP_2.noDataTitle : place.name;

  return (
    <section
      className="x-place x-glass"
      aria-label="Picked spot"
      data-testid="place-card"
      data-state={view?.state ?? coverage?.status ?? "loading"}
    >
      <header className="x-place__head">
        <div>
          <p className="x-kicker">{noData ? STEP_2.noDataKicker : STEP_2.kicker}</p>
          <h2 className="x-place__title" data-testid="place-title">
            {title}
          </h2>
        </div>
        <button
          type="button"
          className="x-icon-button x-place__close"
          onClick={onClose}
          aria-label="Close"
          data-testid="place-close"
        >
          <Icon name="close" size={16} />
        </button>
      </header>
      {title !== coords && (
        <p className="x-place__meta" data-testid="spot-coords">
          {coords}
        </p>
      )}

      {(coverage === undefined || coverage.status === "loading") && (
        <p className="x-place__note" role="status" data-testid="spot-loading">
          {STEP_3.stepSearch}…
        </p>
      )}

      {coverage?.status === "error" && (
        <div className="x-problem" role="alert" data-testid="spot-error">
          <p className="x-problem__title">{problemOf(coverage.error).title}</p>
          <p>{problemOf(coverage.error).body}</p>
          <div className="x-problem__actions">
            <button type="button" className="x-primary x-primary--small" onClick={onRetry}>
              Try again
            </button>
          </div>
        </div>
      )}

      {view !== undefined && view.state !== "noCoverage" && (
        <>
          <div className="x-spot__cards">
            <div className="x-spot__card" data-testid="spot-area">
              <span className="x-spot__k">{STEP_2.areaLabel}</span>
              <span className="x-spot__v">{STEP_2.areaValue(view.sideKm)}</span>
            </div>
            <div className="x-spot__card" data-testid="spot-wait">
              <span className="x-spot__k">{STEP_2.waitLabel}</span>
              <span className="x-spot__v">{STEP_2.waitValue}</span>
              <span className="x-spot__s">{STEP_2.waitSub}</span>
            </div>
          </div>
          <div className="x-spot__catalog" data-testid="spot-catalog">
            <p className="x-kicker x-kicker--split">
              <span>
                {view.direction === undefined
                  ? STEP_2.catalogLabelPlain
                  : STEP_2.catalogLabel(view.direction)}
              </span>
              <span className="x-spot__window">
                {STEP_2.catalogWindow}
                <Prov kind="realDates" source={SOURCE_DATES} />
              </span>
            </p>
            <ul className="x-spot__chips" aria-label="Measured dates">
              {view.chips.map((chip) => (
                <li key={chip} className="x-spot__chip">
                  {chip}
                </li>
              ))}
            </ul>
            {view.gapNote !== undefined && (
              <p className="x-place__note" data-testid="spot-gap">
                {view.gapNote}
              </p>
            )}
          </div>
          {view.state === "insufficientHistory" && (
            <div className="x-problem" role="status" data-testid="spot-insufficient">
              <p className="x-problem__title">
                {explorationProblem({ reasonCode: "INSUFFICIENT_HISTORY", detail: "" }).title}
              </p>
              <p>{explorationProblem({ reasonCode: "INSUFFICIENT_HISTORY", detail: "" }).body}</p>
            </div>
          )}
          <button
            type="button"
            className="x-primary"
            disabled={view.state !== "ready" || !canAsk}
            onClick={onAnalyse}
            data-testid="place-analyse"
          >
            {STEP_2.primary}
            <Icon name="arrow" size={14} />
          </button>
          <button type="button" className="x-ghost" onClick={onClose} data-testid="spot-cases">
            {STEP_2.secondary}
          </button>
        </>
      )}

      {noData && (
        <>
          <p className="x-place__note" data-testid="spot-nodata">
            {STEP_2.noDataBody}
          </p>
          {nearest !== undefined && (
            <button
              type="button"
              className="x-spot__nearest"
              onClick={() => onOpenCase(nearest.item)}
              data-testid="spot-nearest"
            >
              <span className="x-spot__k">{STEP_2.noDataNearest(aboutKm(nearest.km))}</span>
              <span className="x-spot__v">{caseName(nearest.item)}</span>
            </button>
          )}
          <button type="button" className="x-ghost" onClick={onClose} data-testid="spot-another">
            {STEP_2.noDataButton}
          </button>
        </>
      )}
    </section>
  );
};
