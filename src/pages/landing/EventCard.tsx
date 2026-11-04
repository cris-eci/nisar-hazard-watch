import { useState } from "react";

import type { FeaturedEvent } from "@/features/events/events";
import { Link } from "@/lib/Link";
import { esriImageryUrl, EVENT_IMAGERY } from "@/pages/landing/eventImagery";

type EventCardProps = {
  event: FeaturedEvent;
  name: string;
  meta: string;
};

// Shows the epicentre from orbit. If the imagery service fails, the card falls back to the v4 demo
// analysis, labelled as such.
export const EventCard = ({ event, name, meta }: EventCardProps) => {
  const [failed, setFailed] = useState(false);
  const place = EVENT_IMAGERY === "place" && !failed;
  const isDemoSite = event.id === "andes-fire-demo";

  return (
    <Link to={`/explore?event=${event.id}`} className="l-card" testId={`landing-event-${event.id}`}>
      {place ? (
        <img
          src={esriImageryUrl(event.focus)}
          alt={`Satellite view of ${name}, the epicentre marked`}
          width={680}
          height={850}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <img
          src={`/landing/event-${event.id}.jpg`}
          alt={`Demo analysis over ${name}`}
          width={660}
          height={740}
          loading="lazy"
        />
      )}
      {place && <span className="l-card__marker" aria-hidden="true" />}
      <span className={place ? "l-card__chip" : "l-card__chip l-card__chip--demo"}>
        {!place
          ? "DEMO ANALYSIS"
          : isDemoSite
            ? "DEMO SITE · ESRI WORLD IMAGERY"
            : "EPICENTRE · ESRI WORLD IMAGERY"}
      </span>
      <span className="l-card__text">
        <span className="l-card__meta">{meta}</span>
        <span className="l-card__name">{name}</span>
        <span className="l-card__summary">{event.summary}</span>
        <span className="l-card__action">Open on the globe →</span>
      </span>
    </Link>
  );
};
