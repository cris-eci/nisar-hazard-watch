import type { FeaturedEvent } from "@/features/events/events";

type EventsListProps = {
  events: FeaturedEvent[];
  activeId: string | undefined;
  onOpen: (event: FeaturedEvent) => void;
};

// Earthquakes show their magnitude ("M7.5 earthquake" → "M7.5"); other events their hazard.
const eventTag = ({ hazard, title }: FeaturedEvent): string =>
  hazard === "earthquake"
    ? (title.split(" ")[0] ?? "")
    : `${hazard}${title.includes("demo") ? " · demo" : ""}`;

export const EventsList = ({ events, activeId, onOpen }: EventsListProps) => (
  <section className="x-explore__events">
    <h2 className="x-mono">Featured events</h2>
    <ul className="x-explore__list">
      {events.map((event) => (
        <li key={event.id}>
          <button
            type="button"
            data-testid={`event-${event.id}`}
            aria-current={event.id === activeId}
            onClick={() => onOpen(event)}
            className="x-event-row"
          >
            <span>{event.place.split(",")[0]}</span>
            <span className="x-event-row__meta">{eventTag(event).toUpperCase()}</span>
          </button>
        </li>
      ))}
    </ul>
  </section>
);
