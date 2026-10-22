type IntroCardProps = {
  frameCount: number | undefined;
  eventCount: number;
  onStartTour: () => void;
  onExplore: () => void;
};

const COUNT_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six"];

export const IntroCard = ({ frameCount, eventCount, onStartTour, onExplore }: IntroCardProps) => (
  <section data-testid="intro-card" aria-labelledby="intro-title" className="x-intro x-glass">
    <p className="x-mono">
      {frameCount === undefined
        ? "Loading NISAR frames…"
        : `${frameCount.toLocaleString("en-US")} NISAR frames · live observation plan`}
    </p>
    <h1 id="intro-title" className="x-intro__title">
      {COUNT_WORDS[eventCount] ?? eventCount} real events. Two minutes.
    </h1>
    <p className="x-intro__body">
      Three 2026 earthquakes and a fire site, each with its real NISAR before and after passes. Or
      skip ahead and pick any place on the globe.
    </p>
    <div className="x-intro__actions">
      <button type="button" data-testid="intro-tour" onClick={onStartTour} className="x-button">
        Start the tour
      </button>
      <button
        type="button"
        data-testid="intro-explore"
        onClick={onExplore}
        className="x-button x-button--ghost"
      >
        Explore freely
      </button>
    </div>
  </section>
);
