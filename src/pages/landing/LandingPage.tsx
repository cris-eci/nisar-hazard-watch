import "@/pages/landing/landing.css";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  generateDeformationField,
  summarizeDeformation,
} from "@/features/analysis/mock/deformationField";
import { fringeColor } from "@/features/analysis/mock/mockDeformation";
import { toPngUrl } from "@/features/analysis/mock/png";
import { GRID_SIZE } from "@/features/analysis/mock/scarField";
import { FEATURED_EVENTS } from "@/features/events/events";
import { Link } from "@/lib/Link";
import { CompareSlider } from "@/pages/landing/CompareSlider";
import { EarthHero, type EarthControls, type Project } from "@/pages/landing/EarthHero";
import { facingRotation, lonLatToVec } from "@/pages/landing/geo";
import { prefersReducedMotion, useLandingMotion } from "@/pages/landing/useLandingMotion";

const reducedMotion = prefersReducedMotion();

const STORY_EVENT_ID = "venezuela-2026";
const storyEvent = FEATURED_EVENTS.find(({ id }) => id === STORY_EVENT_ID);
const STORY_FOCUS = storyEvent?.focus ?? [-67.221, 10.595];
// The explorer's demo seed for this event (hazard:frame:before:after), so both pages show one value.
const STORY_SEED = "earthquake:162-7:2026-06-13:2026-06-25";

const HOME = facingRotation(-74, 4); // Colombia
const TARGET = facingRotation(STORY_FOCUS[0], STORY_FOCUS[1]);
const MARKER = lonLatToVec(STORY_FOCUS[0], STORY_FOCUS[1], 1.003);

const CALLOUT_INSET = 16;

const initialControls = (): EarthControls => ({
  offX: 0,
  offY: -0.56,
  z: 3.6,
  rx: HOME.x + 0.25,
  ry: HOME.y,
  ring: 0,
  drift: 1,
  callout: 0,
});

const STEPS: { when: string; what: string }[] = [
  { when: "Day 0", what: "First pass, the before image" },
  { when: "Day 12", what: "NISAR returns to the same frame" },
  { when: "A few days", what: "ASF publishes the radar products" },
  { when: "Minutes", what: "The pipeline compares both passes" },
  { when: "Seconds", what: "The change is drawn on the globe" },
];

const EVENT_LINES: Record<string, { name: string; meta: string }> = {
  "venezuela-2026": { name: "Venezuela", meta: "M7.5 · 2026-06-24 · TRACK 162 A" },
  "kumamoto-2026": { name: "Kumamoto, Japan", meta: "M6.8 · 2026-07-28 · TRACK 24 A" },
  "panama-2026": { name: "Pitaloza Arriba, Panama", meta: "M7.7 · 2026-10-09 · TRACK 76 A" },
  "andes-fire-demo": { name: "Colombian Andes", meta: "WILDFIRE · DEMO SITE · TRACK 47 A" },
};

const MISSION: { heading: string; body: string }[] = [
  {
    heading: "Two radars, one mission",
    body: "NISAR carries an L-band radar built by NASA's JPL and an S-band radar from ISRO. It launched from Sriharikota on 30 July 2025.",
  },
  {
    heading: "A dish the width of a house",
    body: "Its 12 m reflector of gold-plated wire mesh unfolded in orbit in August 2025. It focuses the radar on a strip of ground about 240 km wide.",
  },
  {
    heading: "Open data, every pass",
    body: "Every product goes to NASA's archive at the Alaska Satellite Facility, free for anyone. NISAR Hazard Watch reads that archive and turns it into maps.",
  },
];

const CREDITS: { role: string; name: string; href: string }[] = [
  {
    role: "Frames and passes",
    name: "NISAR Observation Plan",
    href: "https://nisar.jpl.nasa.gov/mission/get-to-know-sar/observation-plan/",
  },
  { role: "Radar products", name: "ASF DAAC", href: "https://search.asf.alaska.edu/" },
  {
    role: "Earthquakes",
    name: "USGS catalogue",
    href: "https://earthquake.usgs.gov/earthquakes/search/",
  },
  { role: "Optical", name: "NASA HLS / Sentinel-2", href: "https://hls.gsfc.nasa.gov/" },
  {
    role: "Earth",
    name: "NASA Blue Marble",
    href: "https://visibleearth.nasa.gov/collection/1484/blue-marble",
  },
  { role: "Globe", name: "CesiumJS", href: "https://cesium.com/platform/cesiumjs/" },
];

type DemoFringes = { url: string; maxTowardCm: number };

// The 256² field takes a moment, so it waits until the browser is idle after the first paint.
const useDemoFringes = (): DemoFringes | undefined => {
  const [fringes, setFringes] = useState<DemoFringes>();
  useEffect(() => {
    const build = () => {
      const field = generateDeformationField(STORY_SEED, GRID_SIZE);
      // Pixel area only scales the deformed-area figure, which the callout does not show.
      const { maxTowardCm } = summarizeDeformation(field, 0);
      const url = toPngUrl(GRID_SIZE, (i) => fringeColor(field.losCm[i] ?? 0));
      setFringes({ url, maxTowardCm });
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(build, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(build, 200);
    return () => clearTimeout(id);
  }, []);
  return fringes;
};

export const LandingPage = () => {
  const root = useRef<HTMLDivElement>(null);
  const callout = useRef<HTMLDivElement>(null);
  const cloudCover = useRef(1);
  const controls = useRef<EarthControls>(initialControls());
  const setCloudCover = useCallback((value: number) => {
    cloudCover.current = value;
  }, []);
  const fringes = useDemoFringes();
  useLandingMotion(root, { controls, setCloudCover, home: HOME, target: TARGET });

  // Moves the callout every frame with a transform, never through React state. The card slides
  // sideways to stay on screen; the marker stays on the epicentre.
  const followEpicentre = useCallback((project: Project, c: EarthControls) => {
    const element = callout.current;
    const card = element?.lastElementChild;
    if (element === null || !(card instanceof HTMLElement)) return;
    const { x, y } = project(MARKER);
    const left = x + card.offsetLeft;
    const max = window.innerWidth - CALLOUT_INSET - card.offsetWidth;
    const shift = Math.max(CALLOUT_INSET, Math.min(max, left)) - left;
    element.style.transform = `translate(${x}px, ${y}px)`;
    element.style.opacity = String(c.callout);
    card.style.translate = `${shift}px 0`;
  }, []);

  const events = FEATURED_EVENTS.filter(({ id }) => id in EVENT_LINES);

  return (
    <div ref={root} className="landing" data-motion={reducedMotion ? "reduced" : "full"}>
      <a href="#main" className="l-skip">
        Skip to content
      </a>

      <nav className="l-nav" aria-label="Main">
        <Link to="/" className="l-nav__mark">
          NISAR Hazard Watch
        </Link>
        <div className="l-nav__links">
          <a href="#events" className="l-nav__link">
            Events
          </a>
          <Link to="/method" className="l-nav__link">
            Method
          </Link>
          <Link to="/explore" className="l-nav__pill" testId="nav-explore">
            Open the globe
          </Link>
        </div>
      </nav>

      <main id="main">
        <section className="l-story" aria-label="What NISAR sees">
          <div className="l-story__stage">
            <EarthHero
              cloudCover={cloudCover}
              controls={controls}
              onFrame={followEpicentre}
              reducedMotion={reducedMotion}
            />

            <header className="l-layer l-layer--hero" data-layer="hero">
              <h1 className="l-display" data-intro>
                Earth, without the clouds.
              </h1>
              <p className="l-hero__lead" data-intro>
                NISAR Hazard Watch turns NASA-ISRO radar passes into maps of burn scars, floods and
                moving ground, through cloud, smoke and night.
              </p>
              <div className="l-hero__actions" data-intro>
                <Link to="/explore" className="l-button" testId="cta-explore">
                  Open the globe
                </Link>
                <a href="#compare" className="l-hero__more">
                  See through the clouds ↓
                </a>
              </div>
            </header>

            <div className="l-layer l-layer--a" data-layer="a">
              <p className="l-mono-label">L-BAND · 24 CM WAVELENGTH</p>
              <h2 className="l-head l-layer__head--a">Radar brings its own light.</h2>
              <p className="l-layer__body l-layer__body--a">
                So NISAR sees the ground at night and through clouds and smoke.
              </p>
            </div>

            <div className="l-layer l-layer--side l-layer--b" data-layer="b">
              <p className="l-counter">
                <span data-count>{reducedMotion ? 12 : 0}</span>
                <span className="l-counter__unit">days</span>
              </p>
              <h2 className="l-subhead">Every place, every twelve days.</h2>
              <p className="l-layer__body">
                NISAR maps almost all of Earth&apos;s land and ice on a twelve-day cycle, day or
                night, from 747 km up.
              </p>
            </div>

            <div className="l-layer l-layer--side l-layer--c" data-layer="c">
              <h2 className="l-head">Down to the centimetre.</h2>
              <p className="l-layer__body l-layer__body--c">
                Comparing two passes, NISAR can measure ground motion of about a centimetre. Here,
                the M7.5 earthquake at Catia La Mar, Venezuela.
              </p>
              <Link to={`/explore?event=${STORY_EVENT_ID}`} className="l-gold-link l-layer__link">
                Open this event on the globe →
              </Link>
            </div>

            <div ref={callout} className="l-callout" aria-hidden="true">
              <div className="l-callout__marker" />
              <div className="l-callout__card">
                <div className="l-callout__row">
                  {fringes !== undefined && (
                    <img
                      src={fringes.url}
                      alt="Demo interferogram fringes"
                      width={72}
                      height={72}
                    />
                  )}
                  <div>
                    <p className="l-callout__value">
                      {fringes === undefined ? "…" : `${fringes.maxTowardCm} cm`}
                    </p>
                    <p className="l-callout__label">peak motion toward the satellite</p>
                  </div>
                </div>
                <div className="l-callout__meta">
                  <span>2026-06-13 → 06-25</span>
                  <span className="l-callout__demo">DEMO DATA</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="compare"
          className="l-section l-compare"
          data-section
          aria-labelledby="compare-heading"
        >
          <div className="l-container">
            <div className="l-compare__head">
              <h2 id="compare-heading" className="l-head" data-reveal>
                Same fields. One day apart.
              </h2>
              <p className="l-compare__lead" data-reveal>
                Drag across the image. An optical satellite saw cloud over these fields; a day
                earlier, NISAR&apos;s 24 cm radar waves went straight through to the ground.
              </p>
            </div>
            <CompareSlider reducedMotion={reducedMotion} />
            <p className="l-caption l-compare__caption">
              Farmland along the Forest River, North Dakota. Centre-pivot fields show as gold
              circles on the radar side. Labels by NASA.
            </p>
          </div>
        </section>

        <section
          className="l-section l-section--wide l-pipeline"
          data-section
          aria-labelledby="pipeline-heading"
        >
          <div className="l-container">
            <h2 id="pipeline-heading" className="l-head l-pipeline__heading" data-reveal>
              From orbit to your map.
            </h2>
            <p className="l-pipeline__lead" data-reveal>
              A change map needs two radar passes over the same ground. Most of the wait is the
              satellite coming back around; once both passes are on the archive, the rest takes
              minutes.
            </p>
            <div className="l-pipeline__track">
              <div className="l-pipeline__rail" />
              <div className="l-pipeline__fill" />
              <ol className="l-pipeline__steps">
                {STEPS.map(({ when, what }) => (
                  <li key={when} className="l-pipeline__step" data-step>
                    <div className="l-pipeline__dot" />
                    <p className="l-pipeline__when">{when}</p>
                    <p className="l-pipeline__what">{what}</p>
                  </li>
                ))}
              </ol>
            </div>
            <p className="l-pipeline__total" data-reveal>
              <span>A map of what changed</span>
              <span className="l-pipeline__total-value">About two weeks</span>
            </p>
          </div>
        </section>

        <section id="events" className="l-events" aria-labelledby="events-heading">
          <div className="l-events__stage">
            <div className="l-events__head">
              <h2 id="events-heading" className="l-head">
                Real events, real passes.
              </h2>
              <p className="l-events__note">
                Event dates and NISAR passes are real. The analyses drawn on top are demo data until
                the team&apos;s pipeline runs on them.
              </p>
            </div>
            <ul className="l-events__track">
              {events.map((event) => {
                const line = EVENT_LINES[event.id];
                if (line === undefined) return null;
                return (
                  <li key={event.id}>
                    <Link
                      to={`/explore?event=${event.id}`}
                      className="l-card"
                      testId={`landing-event-${event.id}`}
                    >
                      <img
                        src={`/landing/event-${event.id}.jpg`}
                        alt=""
                        width={660}
                        height={740}
                        loading="lazy"
                      />
                      <span className="l-card__text">
                        <span className="l-card__meta">{line.meta}</span>
                        <span className="l-card__name">{line.name}</span>
                        <span className="l-card__summary">{event.summary}</span>
                        <span className="l-card__action">Open on the globe →</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="l-section l-mission" data-section aria-labelledby="mission-heading">
          <div className="l-container">
            <figure className="l-mission__figure" data-reveal>
              <img
                data-parallax
                src="/landing/nisar-concept.jpg"
                alt="Artist's concept of NISAR above Earth, its 12 m gold mesh reflector open on a long boom"
                width={1280}
                height={989}
                loading="lazy"
              />
              <h2 id="mission-heading" className="l-mission__heading">
                Twelve metres of gold mesh.
              </h2>
            </figure>
            <p className="l-caption l-mission__caption">Artist&apos;s concept, NASA/JPL-Caltech.</p>
            <div className="l-mission__cols">
              {MISSION.map(({ heading, body }) => (
                <div key={heading} data-reveal>
                  <h3 className="l-mission__col-heading">{heading}</h3>
                  <p className="l-mission__col-body">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="l-section--wide l-close" data-section aria-labelledby="close-heading">
          <p className="l-mono-label" data-reveal>
            16,663 FRAMES ON NISAR&apos;S PLAN
          </p>
          <h2 id="close-heading" className="l-close__heading" data-reveal>
            Pick any frame.
          </h2>
          <p className="l-close__body" data-reveal>
            Point at the globe to see NISAR&apos;s frames, open one to list its passes, or start
            with a real earthquake.
          </p>
          <div className="l-close__action" data-reveal>
            <Link to="/explore" className="l-button l-button--large" testId="cta-band">
              Open the globe
            </Link>
          </div>
        </section>
      </main>

      <footer className="l-footer">
        <div className="l-footer__cols">
          <div className="l-footer__identity">
            <p className="l-footer__name">NISAR Hazard Watch</p>
            <p>Built for the NASA International Space Apps Challenge 2026. Chía, Colombia.</p>
          </div>
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
          <div className="l-footer__credits">
            {CREDITS.map(({ role, name, href }) => (
              <p key={role}>
                <span>{role}: </span>
                <a href={href}>{name}</a>
              </p>
            ))}
          </div>
        </div>
        <p className="l-footer__pictures">
          Pictures: NISAR first image of North Dakota and artist&apos;s concept of NISAR
          (NASA/JPL-Caltech); Blue Marble and cloud imagery (NASA Visible Earth), all public domain.
          Optical view: NASA HLS, contains modified Copernicus Sentinel-2 data (2025), via NASA
          Worldview.
        </p>
      </footer>
    </div>
  );
};
