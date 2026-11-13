import "@/pages/site/site.css";
import "@/pages/landing/landing.css";

import { useCallback, useRef } from "react";

import { BARH_GROUP, BARH_SOURCE } from "@/content/barh";
import { DATA_SOURCES } from "@/content/dataSources";
import { CASES, formatPercent, OPTICAL, percent } from "@/features/cases/cases";
import { ContrastBars } from "@/features/charts/ContrastBars";
import { Link } from "@/lib/Link";
import { ProvenanceChip } from "@/lib/ProvenanceChip";
import { CompareSlider } from "@/pages/landing/CompareSlider";
import { EarthHero, type EarthControls, type Project } from "@/pages/landing/EarthHero";
import { facingRotation, lonLatToVec } from "@/pages/landing/geo";
import { LandingCaseCard } from "@/pages/landing/LandingCaseCard";
import { useLandingMotion } from "@/pages/landing/useLandingMotion";
import { SiteFooter, type FooterColumn } from "@/pages/site/SiteFooter";
import { SiteNav } from "@/pages/site/SiteNav";
import { prefersReducedMotion } from "@/pages/site/siteMotion";

const reducedMotion = prefersReducedMotion();

// The story ends on the guided tour's case; its numbers come from cases.ts, never from here.
const STORY_CASE_ID = "qadirabad";
const storyCase = CASES.find(({ id }) => id === STORY_CASE_ID);
const STORY_FOCUS = storyCase?.focus ?? [73.713, 32.329];
// New water against dry land: the headline comparison. Existing water stays on the cases page.
const CALLOUT_ROWS = (storyCase?.groups?.[0]?.rows ?? [])
  .filter(({ color }) => color !== OPTICAL.stableWater)
  .map((row) => ({ ...row, label: row.label.replace(" (optical)", "") }));

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
  { when: "Months", what: "Earlier passes set each spot's normal range" },
  { when: "Day 0", what: "NISAR passes again after the event" },
  { when: "A few days", what: "ASF publishes the radar products" },
  { when: "A minute", what: "The new pass is checked against the range" },
  { when: "Same day", what: "An optical satellite is asked to agree" },
];

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

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "DATA",
    items: [
      {
        label: "NISAR Observation Plan",
        href: "https://nisar.jpl.nasa.gov/mission/get-to-know-sar/observation-plan/",
      },
      { label: "ASF DAAC", href: "https://search.asf.alaska.edu/" },
      {
        label: "OPERA products",
        href: "https://www.jpl.nasa.gov/go/opera/products/dist-product-suite/",
      },
      { label: "Science backend", href: "https://github.com/nisar-hazard-watch/NISAR-Modeling" },
    ],
  },
  {
    title: "BUILD",
    items: [
      { label: "Source code", href: "https://github.com/nisar-hazard-watch/nisar-hazard-watch" },
      {
        label: "API contract",
        href: "https://github.com/nisar-hazard-watch/NISAR-Modeling/blob/main/docs/EXPLORE_API.md",
      },
      { label: "NISAR mission", href: "https://science.nasa.gov/mission/nisar/" },
      { label: "CesiumJS", href: "https://cesium.com/platform/cesiumjs/" },
    ],
  },
];

const FOOTER_NOTE =
  "Pictures: NISAR first image of North Dakota and artist's concept of NISAR (NASA/JPL-Caltech); " +
  "Blue Marble and cloud imagery (NASA Visible Earth), all public domain. Optical view: NASA HLS, " +
  "contains modified Copernicus Sentinel-2 data (2025), via NASA Worldview. Case imagery: Esri " +
  "World Imagery.";

const MEASURED_COUNT = CASES.filter(({ pending }) => pending !== true).length;
const COUNT_WORDS = ["NO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT"];
const measuredLabel = `${COUNT_WORDS[MEASURED_COUNT] ?? MEASURED_COUNT} MEASURED CASE${MEASURED_COUNT === 1 ? "" : "S"}`;

export const LandingPage = () => {
  const root = useRef<HTMLDivElement>(null);
  const callout = useRef<HTMLDivElement>(null);
  const cloudCover = useRef(1);
  const controls = useRef<EarthControls>(initialControls());
  const setCloudCover = useCallback((value: number) => {
    cloudCover.current = value;
  }, []);
  useLandingMotion(root, { controls, setCloudCover, home: HOME, target: TARGET });

  // Moves the callout every frame with a transform, never through React state. The card slides
  // sideways to stay on screen; the marker stays on the case point.
  const followCasePoint = useCallback((project: Project, c: EarthControls) => {
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

  return (
    <div ref={root} className="site landing" data-motion={reducedMotion ? "reduced" : "full"}>
      <a href="#main" className="s-skip">
        Skip to content
      </a>

      <SiteNav page="landing" />

      <main id="main">
        <section className="l-story" aria-label="What NISAR sees">
          <div className="l-story__stage">
            <EarthHero
              cloudCover={cloudCover}
              controls={controls}
              onFrame={followCasePoint}
              reducedMotion={reducedMotion}
            />

            <header className="l-layer l-layer--hero" data-layer="hero">
              <h1 className="s-display" data-intro>
                Earth, without the clouds.
              </h1>
              <p className="l-hero__lead" data-intro>
                NASA-ISRO&apos;s NISAR radar sees through cloud and at night. Pick a place: we
                compare its latest pass with its own history, check a second satellite, and say
                plainly what the radar can&apos;t tell.
              </p>
              <div className="l-hero__actions" data-intro>
                <Link to="/explore" className="s-button" testId="cta-explore">
                  Open the explorer
                </Link>
                <Link to="/explore?story=1" className="l-hero__story" testId="cta-story">
                  <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
                  </svg>
                  The Chenab flood · 1 min
                </Link>
              </div>
            </header>

            <div className="l-layer l-layer--a" data-layer="a">
              <p className="s-mono-label">L-BAND · 24 CM WAVELENGTH</p>
              <h2 className="s-head l-layer__head--a">Radar brings its own light.</h2>
              <p className="l-layer__body l-layer__body--a">
                So NISAR sees the ground at night and through clouds and smoke.
              </p>
            </div>

            <div className="l-layer l-layer--side l-layer--b" data-layer="b">
              <p className="l-counter">
                <span data-count>{reducedMotion ? 12 : 0}</span>
                <span className="l-counter__unit">days</span>
              </p>
              <h2 className="s-subhead">Every place, every twelve days.</h2>
              <p className="l-layer__body">
                NISAR maps almost all of Earth&apos;s land and ice on a twelve-day cycle, day or
                night, from 747 km up.
              </p>
            </div>

            <div className="l-layer l-layer--side l-layer--c" data-layer="c">
              <p className="s-mono-label">QADIRABAD, PAKISTAN · 26 JUL 2026</p>
              <h2 className="s-head l-layer__head--c">When the river rose, the radar went dark.</h2>
              <p className="l-layer__body l-layer__body--c">
                Calm water bounces radar away. Where an optical satellite saw new water, NISAR had
                flagged 64% of cells; on dry land, 1%. It also flagged 17% of water that was already
                there, and we say so.
              </p>
              <Link
                to={`/explore?case=${STORY_CASE_ID}`}
                className="s-gold-link l-layer__link"
                testId="story-case-link"
              >
                Open this event on the globe →
              </Link>
            </div>

            <div ref={callout} className="l-callout" aria-hidden="true">
              <div className="l-callout__marker" />
              <div className="l-callout__card">
                <p className="l-callout__label">Cells flagged by the radar</p>
                {/* Fixed 0–100% track, like every share on the site. */}
                {CALLOUT_ROWS.map(({ label, k, n, color }) => {
                  const value = percent(k, n);
                  return (
                    <div key={label} className="l-callout__bar">
                      <span>{label}</span>
                      <span className="l-callout__track">
                        <span style={{ width: `${value}%`, background: color }} />
                      </span>
                      <span className="l-callout__value">{formatPercent(value)}</span>
                    </div>
                  );
                })}
                <div className="l-callout__meta">
                  <span>
                    {CALLOUT_ROWS.map(
                      ({ k, n }) => `${k.toLocaleString("en-US")} / ${n.toLocaleString("en-US")}`,
                    ).join(" · ")}
                  </span>
                  <span>NISAR-MODELING</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="compare"
          className="s-section l-compare"
          data-section
          aria-labelledby="compare-heading"
        >
          <div className="s-container">
            <div className="l-compare__head">
              <h2 id="compare-heading" className="s-head" data-reveal>
                Same fields. One day apart.
              </h2>
              <p className="l-compare__lead" data-reveal>
                Drag across the image. An optical satellite saw cloud over these fields; a day
                earlier, NISAR&apos;s 24 cm radar waves went straight through to the ground.
              </p>
            </div>
            <CompareSlider reducedMotion={reducedMotion} />
            <p className="s-caption l-compare__caption">
              Farmland along the Forest River, North Dakota. Centre-pivot fields show as gold
              circles on the radar side. Labels by NASA.
            </p>
          </div>
        </section>

        <section
          className="s-section s-section--wide l-pipeline"
          data-section
          aria-labelledby="pipeline-heading"
        >
          <div className="s-container">
            <h2 id="pipeline-heading" className="s-head l-pipeline__heading" data-reveal>
              From orbit to your map.
            </h2>
            <p className="l-pipeline__lead" data-reveal>
              Every answer needs a history: earlier passes tell us what&apos;s normal for that exact
              spot. Then one new pass is checked against it, and a second satellite is asked to
              agree or not.
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
              <span>An answer, with its limits</span>
              <span className="l-pipeline__total-value">
                Target: about a minute once the live API is connected
              </span>
            </p>
          </div>
        </section>

        <section id="cases" className="l-cases" aria-labelledby="cases-heading">
          <div className="l-cases__stage">
            <div className="l-cases__head">
              <h2 id="cases-heading" className="s-head">
                Measured cases, real passes.
              </h2>
              <p className="l-cases__note">
                Each number comes from the science team&apos;s published reports, failures included.{" "}
                <Link to="/cases" className="s-gold-link" testId="landing-all-cases">
                  All cases →
                </Link>
              </p>
            </div>
            <ul className="l-cases__track">
              {CASES.map((item) => (
                <li key={item.id}>
                  <LandingCaseCard item={item} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="s-section l-honesty" data-section aria-labelledby="honesty-heading">
          <div className="s-container l-honesty__grid">
            <div>
              <p className="s-mono-label" data-reveal>
                WHERE IT FAILS, IN THE OPEN
              </p>
              <h2 id="honesty-heading" className="l-honesty__heading" data-reveal>
                We publish where the method gets it wrong.
              </h2>
              <p className="l-honesty__body" data-reveal>
                At Barh, India, the rule that caught 87.5% of new water also flagged 32.6% of water
                that was already there. A radar change is evidence, not a verdict. We never guess a
                cause, a probability or a depth.
              </p>
              <Link to="/method" className="s-gold-link l-honesty__link" testId="honesty-method">
                Where it works and where it fails →
              </Link>
            </div>
            <figure className="l-honesty__card" data-reveal data-testid="honesty-bars">
              <figcaption className="l-honesty__caption">
                <span>
                  <span className="l-honesty__title">{BARH_GROUP.title}</span>
                  <span className="l-honesty__sub">{BARH_GROUP.sub}</span>
                </span>
                <ProvenanceChip kind="real" source={BARH_SOURCE.label} />
              </figcaption>
              <ContrastBars group={BARH_GROUP} mode="plain" />
              <a
                href={BARH_SOURCE.href}
                className="l-honesty__source"
                target="_blank"
                rel="noopener"
              >
                {BARH_SOURCE.label} ↗
              </a>
            </figure>
          </div>
        </section>

        <section className="s-section l-sources" data-section aria-labelledby="sources-heading">
          <div className="s-container">
            <h2 id="sources-heading" className="s-mono-label" data-reveal>
              THE DATA WE USE
            </h2>
            <ul className="l-sources__list" data-testid="data-sources">
              {DATA_SOURCES.map(({ tag, name, what, href }) => (
                <li key={name} data-reveal>
                  <a href={href} className="l-sources__item" target="_blank" rel="noopener">
                    <span className="l-sources__tag">{tag}</span>
                    <span className="l-sources__name">{name} ↗</span>
                    <span className="l-sources__what">{what}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="s-section l-mission" data-section aria-labelledby="mission-heading">
          <div className="s-container">
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
            <p className="s-caption l-mission__caption">Artist&apos;s concept, NASA/JPL-Caltech.</p>
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

        <section className="s-section--wide l-close" data-section aria-labelledby="close-heading">
          <p className="s-mono-label" data-reveal>
            {measuredLabel} · ANY POINT ON LAND
          </p>
          <h2 id="close-heading" className="l-close__heading" data-reveal>
            Ask the radar.
          </h2>
          <p className="l-close__body" data-reveal>
            Open a measured case, or click any land to ask a live question: the radar reads NISAR
            scenes for that spot in about a minute.
          </p>
          <div className="l-close__action" data-reveal>
            <Link to="/explore" className="s-button s-button--large" testId="cta-band">
              Open the explorer
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter
        lon={-72.81}
        lat={0.7}
        coordLabel="CHIRIBIQUETE · 0.70° N, 72.81° W"
        kicker="HECHO EN COLOMBIA · UNDER THE CLOUDS"
        headline="Colombia's rainforest sits under cloud most days. NISAR's radar sees through."
        photo={{
          src: "/footer/chiribiquete.jpg",
          tag: "PATRIMONIO UNESCO",
          title: "Serranía de Chiribiquete",
          sub: "Tepuis in the Colombian Amazon. L-band's 24 cm waves reach through the canopy.",
          credit: "Photo: Carlos Castaño Uribe · CC BY-SA 3.0",
          creditHref: "https://commons.wikimedia.org/wiki/File:Chiribiquete_view.jpg",
        }}
        columns={FOOTER_COLUMNS}
        note={FOOTER_NOTE}
      />
    </div>
  );
};
