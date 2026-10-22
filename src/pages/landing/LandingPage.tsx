import "@/pages/landing/landing.css";

import { useCallback, useRef, useState } from "react";

import { FEATURED_EVENTS } from "@/features/events/events";
import { Link } from "@/lib/Link";
import { EarthHero } from "@/pages/landing/EarthHero";
import { prefersReducedMotion, useLandingMotion } from "@/pages/landing/useLandingMotion";

const reducedMotion = prefersReducedMotion();

type Mode = "optical" | "radar";

const SHOWCASE: Record<Mode, { heading: string; image: string; alt: string }> = {
  optical: {
    heading: "Cloud hides the ground",
    image: "/landing/optical-northern-plains.jpg",
    alt: "Northern Plains of North Dakota seen by an optical satellite, mostly under cloud",
  },
  radar: {
    heading: "Radar sees the ground",
    image: "/landing/radar-north-dakota.jpg",
    alt: "NISAR radar image of North Dakota farmland, with round centre-pivot fields in gold",
  },
};

const STAGES = [
  { duration: "Twelve days", clause: "First, NISAR passes over the same frame again.", grow: 58 },
  {
    duration: "A few days",
    clause: "Then the Alaska Satellite Facility publishes the radar products.",
    grow: 18,
  },
  { duration: "Minutes", clause: "Next, the pipeline compares the two passes.", grow: 12 },
  { duration: "Seconds", clause: "Finally, you read the change on the globe.", grow: 12 },
];

const STAGE_COLOURS = ["var(--accent)", "var(--ocean)", "var(--land)", "var(--ink)"];
const STAGE_INKS = ["var(--accent-ink)", "var(--ink)", "var(--land-ink)", "var(--bg)"];

const EVENT_LINES: Record<string, { name: string; detail: string }> = {
  "venezuela-2026": { name: "Venezuela", detail: "M7.5, 24 June 2026" },
  "kumamoto-2026": { name: "Kumamoto", detail: "M6.8, 28 July 2026" },
  "panama-2026": { name: "Panama", detail: "M7.7, 9 October 2026" },
  "andes-fire-demo": { name: "Andes fire", detail: "Demo site" },
};

const SOURCES = ["NASA JPL", "ISRO", "Alaska Satellite Facility", "USGS", "NASA FIRMS", "CesiumJS"];

const FOOTER_MARK = [
  { height: "62%", colour: "var(--ocean)" },
  { height: "100%", colour: "var(--accent)" },
  { height: "78%", colour: "var(--land)" },
  { height: "88%", colour: "var(--surface)" },
  { height: "70%", colour: "var(--accent)" },
  { height: "94%", colour: "var(--ocean)" },
];

export const LandingPage = () => {
  const root = useRef<HTMLDivElement>(null);
  const cloudCover = useRef(1);
  const setCloudCover = useCallback((value: number) => {
    cloudCover.current = value;
  }, []);
  const [mode, setMode] = useState<Mode>("optical");
  const [previewId, setPreviewId] = useState<string>();
  useLandingMotion(root, setCloudCover);

  const events = FEATURED_EVENTS.filter(({ id }) => id in EVENT_LINES);

  return (
    <div ref={root} className="landing">
      <a
        href="#main"
        className="sr-only rounded-full bg-[#e6a93a] px-4 py-2 text-[#1a1204] focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-20"
      >
        Skip to content
      </a>

      <header className="l-hero l-frame">
        <nav className="l-nav l-frame" aria-label="Main">
          <Link to="/" className="l-nav__link font-medium">
            NISAR Hazard Watch
          </Link>
          <div className="l-nav__links">
            <a href="#events" className="l-nav__link l-nav__link--secondary">
              Events
            </a>
            <Link to="/method" className="l-nav__link l-nav__link--secondary">
              Method
            </Link>
            <Link to="/explore" className="l-button l-button--ink" testId="nav-explore">
              Open the globe
            </Link>
          </div>
        </nav>

        <div className="l-hero__disc" aria-hidden="true" />
        <EarthHero cloudCover={cloudCover} reducedMotion={reducedMotion} />

        <div id="main" className="l-hero__copy">
          <h1 className="l-hero__title" data-reveal>
            Earth, without the clouds
          </h1>
          <p className="l-hero__lead" data-reveal>
            NISAR Hazard Watch turns NASA-ISRO radar passes into maps of burn scars, floods and
            moving ground, through cloud, smoke and night.
          </p>
          <div className="l-hero__action" data-reveal>
            <Link to="/explore" className="l-button" testId="cta-explore">
              Open the globe
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="l-section l-frame" data-section aria-labelledby="stats-heading">
          <div className="l-stats">
            <h2 id="stats-heading" className="l-heading l-stats__heading" data-reveal>
              Every twelve days
            </h2>
            <div className="l-tile l-tile--tall" data-reveal>
              <p className="l-tile__figure">12 days</p>
              <p className="l-tile__caption">
                NISAR returns to the same ground on a fixed cycle, day or night.
              </p>
            </div>
            <div className="l-tile l-tile--ink" data-reveal>
              <p className="l-tile__figure">24 cm</p>
              <p className="l-tile__caption">
                Its L-band waves are long enough to pass through forest canopy.
              </p>
            </div>
            <div className="l-tile l-tile--mid" data-reveal>
              <p className="l-tile__figure">16,663</p>
              <p className="l-tile__caption">radar frames on the plan, each one a place to open.</p>
            </div>
          </div>
        </section>

        <section
          className="l-section l-showcase l-frame"
          data-mode={mode}
          data-section
          aria-labelledby="showcase-heading"
        >
          <div className="l-showcase__copy">
            <h2 id="showcase-heading" className="l-heading" data-reveal aria-live="polite">
              {SHOWCASE[mode].heading}
            </h2>
            <p data-reveal>
              Flip the switch. An optical satellite sees the cloud; NISAR&apos;s radar sees the
              fields beneath it.
            </p>
          </div>

          <div className="l-showcase__picture" data-reveal>
            {(["optical", "radar"] as const).map((key) => (
              <img
                key={key}
                src={SHOWCASE[key].image}
                alt={key === mode ? SHOWCASE[key].alt : ""}
                aria-hidden={key !== mode}
                width={1020}
                height={576}
                loading="lazy"
                style={{ opacity: key === mode ? 1 : 0 }}
              />
            ))}
          </div>
          <p className="l-showcase__caption">
            {mode === "radar"
              ? "NISAR's first image of North Dakota, 23 August 2025: centre-pivot fields read as gold circles."
              : "The same area in NASA Blue Marble imagery, under a NASA cloud layer composited on top."}
          </p>

          <div className="l-switch" role="group" aria-label="Satellite view" data-ui>
            {(["optical", "radar"] as const).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={mode === key}
                onClick={() => setMode(key)}
                data-testid={`view-${key}`}
              >
                {key === "optical" ? "Optical" : "Radar"}
              </button>
            ))}
          </div>
        </section>

        <section className="l-section l-frame" data-section aria-labelledby="stages-heading">
          <h2 id="stages-heading" className="l-stages__heading" data-reveal>
            From orbit to your map
          </h2>
          <div className="l-stages__bar" data-ui data-reveal>
            {STAGES.map(({ duration, grow }, i) => (
              <div
                key={duration}
                className="l-stage"
                style={{
                  flexGrow: grow,
                  background: STAGE_COLOURS[i],
                  color: STAGE_INKS[i],
                }}
              >
                {duration}
              </div>
            ))}
          </div>
          <div className="l-stages__clauses" data-reveal>
            {STAGES.map(({ duration, clause, grow }) => (
              <p key={duration} style={{ flexGrow: grow }}>
                {clause}
              </p>
            ))}
          </div>
        </section>

        <section className="l-section" data-section aria-labelledby="about-heading">
          <div className="l-about">
            <h2 id="about-heading" className="l-about__statement" data-reveal>
              Twelve metres of gold mesh
            </h2>
            <div className="l-about__text">
              <div data-reveal>
                <h3>Two radars, one mission</h3>
                <p>
                  NISAR carries an L-band radar built by NASA&apos;s JPL and an S-band radar from
                  ISRO. It launched from Sriharikota on 30 July 2025 and maps almost all of
                  Earth&apos;s land and ice every 12 days.
                </p>
              </div>
              <div data-reveal>
                <h3>Open data, every pass</h3>
                <p>
                  Every product goes to NASA&apos;s archive at the Alaska Satellite Facility, free
                  for anyone. NISAR Hazard Watch reads that archive and turns it into maps.
                </p>
              </div>
              <div data-reveal>
                <Link to="/method" className="l-button">
                  How it is computed
                </Link>
              </div>
            </div>
            <img
              className="l-about__photo"
              src="/landing/reflector-deployment.jpg"
              alt="NISAR's team in a JPL control room, screens showing the reflector unfurling in orbit"
              width={1600}
              height={1065}
              loading="lazy"
            />
            <p className="l-about__photo-caption">
              JPL&apos;s team watching the reflector unfurl, August 2025.
            </p>
          </div>
        </section>

        <section
          id="events"
          className="l-section l-events l-frame"
          data-section
          aria-labelledby="events-heading"
        >
          <h2 id="events-heading" className="l-heading l-events__heading" data-reveal>
            Real events, real passes
          </h2>
          <div className="l-events__layout">
            <ul className="l-events__list">
              {events.map((event) => {
                const line = EVENT_LINES[event.id];
                if (line === undefined) return null;
                return (
                  <li key={event.id} data-reveal>
                    <Link
                      to={`/explore?event=${event.id}`}
                      className="l-event"
                      testId={`landing-event-${event.id}`}
                      onMouseEnter={() => setPreviewId(event.id)}
                      onFocus={() => setPreviewId(event.id)}
                      onMouseLeave={() => setPreviewId(undefined)}
                      onBlur={() => setPreviewId(undefined)}
                    >
                      <span className="l-event__name">{line.name}</span>
                      <span className="l-event__detail">{line.detail}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div>
              <div className="l-events__preview">
                <video
                  src="/landing/volcano-timelapse.webm"
                  poster="/landing/volcano-poster.jpg"
                  muted
                  loop
                  playsInline
                  autoPlay={!reducedMotion}
                  aria-label="NISAR radar time-lapse of a volcanic eruption"
                  data-active={previewId === undefined}
                />
                {events.map((event) => (
                  <img
                    key={event.id}
                    src={`/landing/event-${event.id}.jpg`}
                    alt=""
                    width={660}
                    height={740}
                    loading="lazy"
                    data-active={previewId === event.id}
                  />
                ))}
              </div>
              <p className="l-events__preview-caption">
                {previewId === undefined
                  ? "NISAR time-lapse of a volcanic eruption, 2026. Point at an event to preview it."
                  : (FEATURED_EVENTS.find(({ id }) => id === previewId)?.summary ?? "")}
              </p>
            </div>
          </div>
          <p className="l-events__note" data-reveal>
            Event dates and NISAR passes are real. The analyses drawn on top are demo data until the
            team&apos;s pipeline runs on them.
          </p>
        </section>

        <section className="l-section l-frame" data-section aria-labelledby="proof-heading">
          <div className="l-proof">
            <div className="l-proof__tile l-proof__tile--head" data-reveal>
              <h2 id="proof-heading">Built on open data</h2>
            </div>
            {SOURCES.map((name) => (
              <div key={name} className="l-proof__tile" data-reveal>
                {name}
              </div>
            ))}
          </div>
        </section>

        <section className="l-section l-section--cta" data-section aria-label="Open the explorer">
          <Link to="/explore" className="l-cta" testId="cta-band">
            <span className="l-cta__sentence">
              Open the globe and pick any of 16,663 frames, or start with a real earthquake.
            </span>
            <span className="l-cta__word" aria-hidden="true">
              Explore
            </span>
            <span className="sr-only">Explore the globe</span>
          </Link>
        </section>
      </main>

      <footer className="l-footer l-frame">
        <div className="l-footer__mark" aria-hidden="true">
          {FOOTER_MARK.map(({ height, colour }, i) => (
            <span key={i} style={{ height, background: colour }} />
          ))}
        </div>
        <div className="l-footer__cols">
          <nav className="l-footer__links" aria-label="Footer">
            <Link to="/explore">Explorer</Link>
            <Link to="/method">Method</Link>
            <a href="https://github.com/cris-eci/nisar-hazard-watch">Source code</a>
            <a href="https://github.com/cris-eci/nisar-hazard-watch/blob/main/docs/analysis-api.md">
              API contract
            </a>
            <a href="https://search.asf.alaska.edu/">ASF data search</a>
            <a href="https://science.nasa.gov/mission/nisar/">NISAR mission</a>
          </nav>
          <div className="l-footer__contact">
            <p>Built for the NASA International Space Apps Challenge 2026.</p>
            <p>Chía, Colombia.</p>
          </div>
        </div>
        <p className="l-footer__credits">
          Pictures: NISAR first image of North Dakota, NISAR reflector deployment
          (NASA/JPL-Caltech), NISAR eruption time-lapse (NASA Scientific Visualization Studio), Blue
          Marble and cloud imagery (NASA Visible Earth). All public domain, via Wikimedia Commons
          and NASA.
        </p>
        <div className="l-footer__base">
          <p>NISAR Hazard Watch, 2026</p>
          <Link to="/explore" className="l-button">
            Open the globe
          </Link>
        </div>
      </footer>
    </div>
  );
};
