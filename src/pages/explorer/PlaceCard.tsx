import { Icon } from "@/features/case-panel/icons";
import type { Frame } from "@/features/frames/frame.types";
import { AOI_SIDE_KM } from "@/features/geo/limits";
import type { Place } from "@/features/search/placesApi";
import { formatLonLat } from "@/features/live/liveQuestion";

type PlaceCardProps = {
  place: Place;
  // The NISAR frame under the place, if any; the question needs one.
  frame: Frame | undefined;
  onAnalyse: () => void;
  onClose: () => void;
};

// A searched place waiting for the user to ask about it.
export const PlaceCard = ({ place, frame, onAnalyse, onClose }: PlaceCardProps) => (
  <section className="x-place x-glass" aria-label="Searched place" data-testid="place-card">
    <header className="x-place__head">
      <div>
        <p className="x-kicker">Searched place · {place.kind}</p>
        <h2 className="x-place__title" data-testid="place-title">
          {place.name}
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
    <p className="x-place__where">{place.displayName}</p>
    <p className="x-place__meta">{formatLonLat(place.point)}</p>
    {frame === undefined ? (
      <div className="x-problem" role="status" data-testid="place-no-frame">
        <p className="x-problem__title">No NISAR frame covers this place</p>
        <p>
          The radar question needs a NISAR frame over the place. Try another spot or a measured
          case.
        </p>
      </div>
    ) : (
      <p className="x-place__frame" data-testid="place-frame">
        Track {frame.track} · Frame {frame.frame} · {frame.hasCrossPol ? "HH+HV" : "HH only"}
      </p>
    )}
    <p className="x-place__note">
      The radar reads a {AOI_SIDE_KM} km square around this point, drawn on the globe.
    </p>
    <button
      type="button"
      className="x-primary"
      disabled={frame === undefined}
      onClick={onAnalyse}
      data-testid="place-analyse"
    >
      Analyse this area
      <Icon name="arrow" size={14} />
    </button>
  </section>
);
