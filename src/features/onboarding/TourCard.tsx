import { useEffect } from "react";

import type { FeaturedEvent } from "@/features/events/events";

type TourCardProps = {
  events: FeaturedEvent[];
  index: number;
  onGo: (index: number) => void;
  onExit: () => void;
};

// The tour walks the featured events in order; the arrow keys step through them too.
export const TourCard = ({ events, index, onGo, onExit }: TourCardProps) => {
  const event = events[index];
  const isLast = index >= events.length - 1;

  useEffect(() => {
    const step = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "ArrowRight") onGo(index + 1);
      if (keyEvent.key === "ArrowLeft" && index > 0) onGo(index - 1);
    };
    window.addEventListener("keydown", step);
    return () => window.removeEventListener("keydown", step);
  }, [index, onGo]);

  if (event === undefined) return null;

  return (
    <section data-testid="tour-card" aria-labelledby="tour-title" className="x-dock x-tour x-glass">
      <div className="x-tour__head">
        <p className="x-mono x-tour__chapter">
          Event {index + 1} of {events.length}
        </p>
        <button type="button" onClick={onExit} className="x-text-button">
          Exit tour
        </button>
      </div>
      <h1 id="tour-title" className="x-tour__title">
        {event.title.replace(" (demo site)", "")}, {event.place.split(",")[0]}
      </h1>
      <p className="x-tour__line">
        {event.date} · {event.summary}
      </p>
      <div className="x-tour__nav">
        <button
          type="button"
          aria-label="Previous event"
          disabled={index === 0}
          onClick={() => onGo(index - 1)}
          className="x-tour__prev"
        >
          ←
        </button>
        <div className="x-tour__dots">
          {events.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Event ${i + 1}: ${item.place}`}
              aria-current={i === index ? "step" : undefined}
              data-done={i <= index}
              onClick={() => onGo(i)}
              className="x-tour__dot"
            />
          ))}
        </div>
        <button
          type="button"
          data-testid="tour-next"
          onClick={() => onGo(index + 1)}
          className="x-button x-tour__next"
        >
          {isLast ? "Explore freely" : "Next event →"}
        </button>
      </div>
    </section>
  );
};
