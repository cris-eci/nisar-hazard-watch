import "@/pages/landing/landing.css";

import { useCallback, useRef, useState } from "react";

import { FEATURED_EVENTS } from "@/features/events/events";
import { Link } from "@/lib/Link";
import { EarthHero } from "@/pages/landing/EarthHero";
import { prefersReducedMotion, useLandingMotion } from "@/pages/landing/useLandingMotion";

const reducedMotion = prefersReducedMotion();

type Mode = "optical" | "radar";

const SHOWCASE: Record<Mode, { heading: string; image: string; alt: string; caption: string }> = {
  optical: {
    heading: "Cloud hides the ground",
    image: "/landing/optical-north-dakota.jpg",
    alt: "Sentinel-2 view of farmland along the Forest River, North Dakota, mostly hidden under cumulus cloud",
    caption:
      "Sentinel-2, 24 August 2025. Farmland along the Forest River, North Dakota, almost all of it under cloud.",
  },
  radar: {
    heading: "Radar sees the ground",
    image: "/landing/radar-north-dakota.jpg",
    alt: "NISAR radar image of the same North Dakota farmland, every field visible, with NASA's labels for corn, wetlands and centre-pivot fields",
    caption:
      "NISAR, 23 August 2025. The same farmland, every field readable; centre-pivot fields show as gold circles. Labels by NASA.",
  },
};

type SlipGroup = { heading: string; rows: { what: string; when: string }[] };

const SLIP: SlipGroup[] = [
  {
    heading: "In orbit",
    rows: [
      { what: "First pass, the before image", when: "Day 0" },
      { what: "NISAR returns to the same frame", when: "Day 12" },
    ],
  },
  {
    heading: "On the ground",
    rows: [
      { what: "ASF publishes the radar products", when: "A few days" },
      { what: "The pipeline compares both passes", when: "Minutes" },
    ],
  },
  {
    heading: "On your screen",
    rows: [{ what: "The change is drawn on the globe", when: "Seconds" }],
  },
];

const EVENT_LINES: Record<string, { name: string; detail: string }> = {
  "venezuela-2026": { name: "Venezuela", detail: "M7.5, 24 June 2026" },
  "kumamoto-2026": { name: "Kumamoto", detail: "M6.8, 28 July 2026" },
  "panama-2026": { name: "Panama", detail: "M7.7, 9 October 2026" },
  "andes-fire-demo": { name: "Andes fire", detail: "Demo site" },
};

const CREDITS: { role: string; name: string; href: string }[] = [
  {
    role: "Radar satellite",
    name: "NISAR, by NASA JPL and ISRO",
    href: "https://science.nasa.gov/mission/nisar/",
  },
  {
    role: "Frames and passes",
    name: "NISAR Observation Plan API",
    href: "https://nisar.jpl.nasa.gov/mission/get-to-know-sar/observation-plan/",
  },
  {
    role: "Radar products",
    name: "Alaska Satellite Facility DAAC",
    href: "https://search.asf.alaska.edu/",
  },
  {
    role: "Earthquakes",
    name: "USGS earthquake catalogue",
    href: "https://earthquake.usgs.gov/earthquakes/search/",
  },
  {
    role: "Optical comparison",
    name: "NASA HLS, from Copernicus Sentinel-2",
    href: "https://hls.gsfc.nasa.gov/",
  },
  {
    role: "Earth and clouds",
    name: "NASA Blue Marble",
    href: "https://visibleearth.nasa.gov/collection/1484/blue-marble",
  },
  {
    role: "Eruption time-lapse",
    name: "NASA Scientific Visualization Studio",
    href: "https://svs.gsfc.nasa.gov/",
  },
  {
    role: "Globe engine",
    name: "CesiumJS, open source",
    href: "https://cesium.com/platform/cesiumjs/",
  },
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
      <a href="#main" className="l-skip">
        Skip to content
      </a>

      <header className="l-hero">
        <nav className="l-nav l-frame" aria-label="Main">
          <Link to="/" className="l-nav__mark">
            NISAR Hazard Watch
          </Link>
          <div className="l-nav__links">
            <a href="#events" className="l-nav__link l-nav__link--secondary">
              Events
            </a>
            <Link to="/method" className="l-nav__link l-nav__link--secondary">
              Method
            </Link>
            <Link to="/explore" className="l-button l-button--ghost" testId="nav-explore">
              Open the globe
            </Link>
          </div>
        </nav>

        <EarthHero cloudCover={cloudCover} reducedMotion={reducedMotion} />

        <div id="main" className="l-hero__copy l-frame">
          <h1 className="l-hero__title">Earth, without the clouds</h1>
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
        <section className="l-figure l-frame" data-section aria-labelledby="figure-heading">
          <h2 id="figure-heading" className="l-figure__claim" data-reveal>
            Every place, every twelve days
          </h2>
          <p className="l-figure__number" data-reveal>
            12<span className="l-figure__unit">days</span>
          </p>
          <div className="l-figure__notes" data-reveal>
            <p>
              NISAR maps almost all of Earth&apos;s land and ice on a twelve-day cycle, day or
              night, so every frame on the globe gets a fresh before and after.
            </p>
            <p className="l-figure__source">From 747 km up, on a sun-synchronous orbit.</p>
          </div>
        </section>

        <section
          className="l-screen l-frame"
          data-mode={mode}
          data-section
          aria-labelledby="showcase-heading"
        >
          <div className="l-screen__head">
            <div>
              <h2 id="showcase-heading" className="l-heading" data-reveal aria-live="polite">
                {SHOWCASE[mode].heading}
              </h2>
              <p className="l-screen__lead" data-reveal>
                Flip the switch. An optical satellite saw cloud over these fields; a day earlier,
                NISAR&apos;s 24 cm radar waves went straight through to the ground.
              </p>
            </div>
            <div className="l-switch" role="group" aria-label="Satellite view" data-reveal>
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
          </div>

          <figure className="l-screen__frame" data-reveal>
            <img
              className="l-screen__optical"
              src={SHOWCASE.optical.image}
              alt={mode === "optical" ? SHOWCASE.optical.alt : ""}
              aria-hidden={mode !== "optical"}
              width={1580}
              height={851}
            />
            <img
              className="l-screen__radar"
              src={SHOWCASE.radar.image}
              alt={mode === "radar" ? SHOWCASE.radar.alt : ""}
              aria-hidden={mode !== "radar"}
              width={2048}
              height={1103}
            />
          </figure>
          <p className="l-screen__caption">{SHOWCASE[mode].caption}</p>
        </section>

        <section className="l-stages" data-section aria-labelledby="stages-heading">
          <div className="l-stages__inner l-frame">
            <div className="l-stages__copy">
              <h2 id="stages-heading" className="l-heading" data-reveal>
                From orbit to your map
              </h2>
              <p data-reveal>
                A change map needs two radar passes over the same ground. Most of the wait is the
                satellite coming back around; once both passes are on the archive, the rest takes
                minutes.
              </p>
            </div>
            <div className="l-slip" data-reveal>
              {SLIP.map(({ heading, rows }) => (
                <div key={heading} className="l-slip__group">
                  <h3>{heading}</h3>
                  <dl>
                    {rows.map(({ what, when }) => (
                      <div key={what} className="l-slip__row">
                        <dt>{what}</dt>
                        <dd>{when}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
              <p className="l-slip__total">
                <span>A map of what changed</span>
                <span>About two weeks</span>
              </p>
            </div>
          </div>
        </section>

        <section className="l-about" data-section aria-labelledby="about-heading">
          <div className="l-about__panel">
            <div className="l-about__left">
              <h2 id="about-heading" className="l-heading" data-reveal>
                Twelve metres of gold mesh
              </h2>
              <figure className="l-about__figure" data-reveal>
                <img
                  src="/landing/nisar-concept.jpg"
                  alt="Artist's concept of NISAR above Earth, its 12 m gold mesh reflector open on a long boom"
                  width={1280}
                  height={989}
                />
              </figure>
            </div>
            <div className="l-about__text">
              <div data-reveal>
                <h3>Two radars, one mission</h3>
                <p>
                  NISAR carries an L-band radar built by NASA&apos;s JPL and an S-band radar from
                  ISRO. It launched from Sriharikota on 30 July 2025.
                </p>
              </div>
              <div data-reveal>
                <h3>A dish the width of a house</h3>
                <p>
                  Its 12 m reflector of gold-plated wire mesh unfolded in orbit in August 2025. It
                  focuses the radar on a strip of ground about 240 km wide.
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
              <p className="l-about__caption">Artist&apos;s concept, NASA/JPL-Caltech.</p>
            </div>
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

        <section className="l-credits l-frame" data-section aria-labelledby="credits-heading">
          <h2 id="credits-heading" className="l-heading" data-reveal>
            Built on open data
          </h2>
          <figure className="l-credits__still" data-reveal>
            <img
              src="/landing/reflector-deployment.jpg"
              alt="NISAR's team in a JPL control room, screens showing the reflector unfurling in orbit"
              width={1600}
              height={1065}
              loading="lazy"
            />
            <figcaption>JPL&apos;s team watching the reflector unfurl, August 2025.</figcaption>
          </figure>
          <dl className="l-credits__roll">
            {CREDITS.map(({ role, name, href }) => (
              <div key={role} className="l-credits__line" data-reveal>
                <dt>{role}</dt>
                <dd>
                  <a href={href}>{name}</a>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="l-ticket" data-section aria-labelledby="ticket-heading">
          <div className="l-ticket__inner l-frame">
            <p className="l-ticket__aside" data-reveal>
              16,663 frames are on NISAR&apos;s plan. Every one of them is a place you can open.
            </p>
            <div className="l-ticket__card" data-reveal>
              <h2 id="ticket-heading">Pick any frame</h2>
              <p>
                Point at the globe to see NISAR&apos;s frames, open one to list its passes, or start
                with a real earthquake.
              </p>
              <Link to="/explore" className="l-ticket__action" testId="cta-band">
                Open the globe
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="l-footer l-frame">
        <p className="l-footer__mark" aria-hidden="true">
          NISAR Hazard Watch
        </p>
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
          Pictures: NISAR first image of North Dakota, NISAR reflector deployment and artist&apos;s
          concept of NISAR (NASA/JPL-Caltech); NISAR eruption time-lapse (NASA Scientific
          Visualization Studio); Blue Marble and cloud imagery (NASA Visible Earth), all public
          domain. Optical view: NASA HLS, contains modified Copernicus Sentinel-2 data (2025), via
          NASA Worldview.
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
