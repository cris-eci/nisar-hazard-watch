import type { HazardId } from "@/features/analysis/analysis.types";
import type { FeaturedEvent } from "@/features/events/events";

const HAZARD_ICON: Record<HazardId, string> = {
  earthquake: "〰",
  wildfire: "🔥",
  flood: "💧",
  deforestation: "🌳",
};

type EventsListProps = {
  events: FeaturedEvent[];
  activeId: string | undefined;
  onOpen: (event: FeaturedEvent) => void;
};

export const EventsList = ({ events, activeId, onOpen }: EventsListProps) => (
  <section className="mt-4">
    <h2 className="text-xs tracking-wide text-slate-500 uppercase">Featured events</h2>
    <ul className="mt-1.5 space-y-1">
      {events.map((event) => (
        <li key={event.id}>
          <button
            type="button"
            data-testid={`event-${event.id}`}
            aria-current={event.id === activeId}
            onClick={() => onOpen(event)}
            className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-sky-400 aria-[current=true]:bg-white/10"
          >
            <span aria-hidden="true">{HAZARD_ICON[event.hazard]}</span>
            <span>
              <span className="block text-slate-100">{event.title}</span>
              <span className="block text-xs text-slate-400">
                {event.place} · {event.date}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  </section>
);
