import { useEffect, useState } from "react";

import { getFacts } from "@/content/facts";

const ROTATE_MS = 7000;

type FactsCarouselProps = { reduceMotion: boolean };

// While the radar works: one sourced fact at a time. It rotates until the reader hovers or focuses
// one of its controls, or presses Pause.
export const FactsCarousel = ({ reduceMotion }: FactsCarouselProps) => {
  const facts = getFacts();
  const [index, setIndex] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (engaged || held || reduceMotion || facts.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % facts.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(timer);
  }, [engaged, held, reduceMotion, facts.length]);

  const fact = facts[index];
  if (fact === undefined) return null;
  const step = (delta: number) =>
    setIndex((value) => (value + delta + facts.length) % facts.length);
  const engage = {
    onMouseEnter: () => setEngaged(true),
    onMouseLeave: () => setEngaged(false),
    onFocus: () => setEngaged(true),
    onBlur: () => setEngaged(false),
  };
  return (
    <section className="x-facts-carousel" aria-label="Did you know" data-testid="facts-carousel">
      <p className="x-kicker">
        Did you know · {index + 1} of {facts.length}
      </p>
      <p className="x-facts-carousel__text" aria-live="polite" data-testid="fact-text">
        {fact.text}
      </p>
      <p className="x-facts-carousel__source">
        <a
          href={fact.source.href}
          target="_blank"
          rel="noopener"
          data-testid="fact-source"
          {...engage}
        >
          {fact.source.label}
        </a>
        <span className="x-facts-carousel__nav">
          <button type="button" onClick={() => step(-1)} aria-label="Previous fact" {...engage}>
            ‹
          </button>
          <button
            type="button"
            onClick={() => setHeld((value) => !value)}
            aria-pressed={held}
            aria-label={held ? "Resume the facts" : "Pause the facts"}
            data-testid="fact-pause"
            {...engage}
          >
            {held ? "▶" : "❚❚"}
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next fact" {...engage}>
            ›
          </button>
        </span>
      </p>
    </section>
  );
};
