type Mark = { at: number; date: string; label: string; tone: "before" | "event" | "after" };
type Picture = { src: string; alt: string; place: "full" | "left" | "right" };
type Figure = { value: string; label: string; tone: "toward" | "away" | "neutral" };

// Pictures and figures are undefined until the demo rasters are built.
export type FigureFrame =
  | { kind: "timeline"; marks: Mark[]; note: string }
  | { kind: "images"; images: Picture[] | undefined }
  | { kind: "summary"; figures: Figure[] | undefined };

type StepFigureProps = {
  frames: FigureFrame[];
  step: number;
  caption: string;
  ready: boolean;
};

const FrameContent = ({ frame }: { frame: FigureFrame }) => {
  if (frame.kind === "timeline")
    return (
      <div className="m-figure__timeline">
        <div className="m-figure__rail">
          {frame.marks.map(({ at, date, label, tone }) => (
            <div key={label} className="m-figure__mark" data-tone={tone} style={{ left: `${at}%` }}>
              <div className="m-figure__dot" />
              <p className="m-figure__date">{date}</p>
              <p className="m-figure__label">{label}</p>
            </div>
          ))}
        </div>
        <p className="m-figure__note">{frame.note}</p>
      </div>
    );
  if (frame.kind === "summary")
    return (
      <div className="m-figure__summary">
        {frame.figures?.map(({ value, label, tone }) => (
          <div key={label}>
            <p className="m-figure__value" data-tone={tone}>
              {value}
            </p>
            <p className="m-figure__value-label">{label}</p>
          </div>
        ))}
      </div>
    );
  return (
    <>
      {frame.images?.map(({ src, alt, place }) => (
        <img
          key={alt}
          className="m-figure__image"
          data-place={place}
          src={src}
          alt={alt}
          width={256}
          height={256}
        />
      ))}
    </>
  );
};

// Sticky beside the steps: one frame per step, cross-faded as the reader scrolls.
export const StepFigure = ({ frames, step, caption, ready }: StepFigureProps) => (
  <div className="m-figure">
    <figure className="m-figure__frame" aria-busy={!ready}>
      {frames.map((frame, i) => (
        <div key={i} className="m-figure__layer" data-active={i === step} aria-hidden={i !== step}>
          <FrameContent frame={frame} />
        </div>
      ))}
      {!ready && step > 0 && <p className="m-figure__loading">Preparing the demo…</p>}
      <figcaption className="m-figure__caption">
        <span className="s-chip">{caption}</span>
        <span className="m-demo-chip">DEMO DATA</span>
      </figcaption>
    </figure>
    <div className="m-figure__progress" aria-hidden="true">
      {frames.map((_, i) => (
        <div key={i} data-done={i <= step} />
      ))}
    </div>
  </div>
);
