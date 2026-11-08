type PassTimelineProps = {
  beforeDate: string;
  afterDate: string;
  nextPassDate: string | undefined;
};

const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(new Date(`${date}T00:00:00`));
};

export const PassTimeline = ({ beforeDate, afterDate, nextPassDate }: PassTimelineProps) => {
  return (
    <section className="x-flood-timeline" aria-labelledby="flood-timeline-title">
      <div className="x-flood-timeline__heading">
        <p id="flood-timeline-title" className="x-mono">
          Satellite observation
        </p>

        <p className="x-flood-timeline__description">
          Comparison scenes and next scheduled acquisition
        </p>
      </div>

      <div className="x-flood-timeline__rail" aria-hidden="true">
        <span className="x-flood-timeline__line x-flood-timeline__line--observed" />
        <span className="x-flood-timeline__line x-flood-timeline__line--planned" />

        <span className="x-flood-timeline__dot x-flood-timeline__dot--before" />
        <span className="x-flood-timeline__dot x-flood-timeline__dot--after" />

        {nextPassDate !== undefined && (
          <span className="x-flood-timeline__dot x-flood-timeline__dot--next" />
        )}
      </div>

      <div className="x-flood-timeline__events">
        <div>
          <span className="x-flood-timeline__label">Before</span>

          <time className="x-mono" dateTime={beforeDate}>
            {formatDate(beforeDate)}
          </time>

          <span className="x-flood-timeline__status">Reference</span>
        </div>

        <div>
          <span className="x-flood-timeline__label">After</span>

          <time className="x-mono" dateTime={afterDate}>
            {formatDate(afterDate)}
          </time>

          <span className="x-flood-timeline__status">Analyzed</span>
        </div>

        <div>
          <span className="x-flood-timeline__label">Next pass</span>

          {nextPassDate !== undefined ? (
            <>
              <time className="x-mono" dateTime={nextPassDate}>
                {formatDate(nextPassDate)}
              </time>

              <span className="x-flood-timeline__status">Planned</span>
            </>
          ) : (
            <>
              <span className="x-mono">Not scheduled</span>

              <span className="x-flood-timeline__status">Planned</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
