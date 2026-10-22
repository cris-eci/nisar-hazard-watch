import "@/pages/site/site.css";
import "@/pages/method/method.css";

import { useEffect, useRef, useState } from "react";

import { ENABLED_HAZARDS } from "@/features/analysis/hazards";
import { APP_NAME } from "@/lib/appName";
import { Link } from "@/lib/Link";
import { whenIdle } from "@/lib/whenIdle";
import {
  buildFireDemo,
  buildQuakeDemo,
  FIRE_PAIR,
  QUAKE_DATE,
  QUAKE_EVENT_ID,
  QUAKE_PAIR,
  type FireDemo,
  type QuakeDemo,
} from "@/pages/method/methodDemo";
import { StepFigure, type FigureFrame } from "@/pages/method/StepFigure";
import { useMethodMotion } from "@/pages/method/useMethodMotion";
import { SiteNav } from "@/pages/site/SiteNav";

type MethodHazard = "wildfire" | "earthquake";

const hasDeformation = ENABLED_HAZARDS.some(({ kind }) => kind === "deformation");

const TABS: { id: MethodHazard; label: string }[] = [
  { id: "wildfire", label: "Wildfire" },
  ...(hasDeformation ? [{ id: "earthquake" as const, label: "Earthquake" }] : []),
];

type Step = { title: string; body: string; formula?: string };

const STEPS: Record<MethodHazard, Step[]> = {
  wildfire: [
    {
      title: "Find the passes",
      body: "Pick two NISAR L2 GCOV scenes of the same track and frame from ASF, before and after the event. Fires need HH+HV passes.",
    },
    {
      title: "Read only the area of interest",
      body: "Stream the pixels inside the area straight from the HDF5 files, mask invalid pixels and average 2×2 blocks to reduce speckle.",
    },
    {
      title: "Compare",
      body: "Compute the log-ratio of HV backscatter, pixel by pixel.",
      formula: "Δ = 10·log10(after / before)",
    },
    {
      title: "Classify",
      body: "Pixels at or below −2 dB count as burned; −4 and −6 dB split low, moderate and high severity. Area = pixels × pixel size.",
      formula: "≤ −2 · −4 · −6 dB",
    },
  ],
  earthquake: [
    {
      title: "Find a pair that brackets the event",
      body: "Pick a NISAR L2 GUNW interferogram whose first date is before the earthquake and second date after it (USGS catalogue for the time and place).",
    },
    {
      title: "Convert phase to motion",
      body: "Line-of-sight displacement from the unwrapped phase, with λ = 23.84 cm, after the ionospheric correction GUNW provides.",
      formula: "d = −λ / 4π × φ",
    },
    {
      title: "Mask what is unreliable",
      body: "Drop low-coherence pixels (water, dense vegetation that changed) so only trustworthy motion is shown.",
    },
    {
      title: "Summarise",
      body: "Report peak motion toward and away from the satellite and the area that moved more than 2 cm.",
    },
  ],
};

const VALIDATION: { value: string; what: string; metric: string; against: string }[] = [
  {
    value: "87 %",
    what: "Burn scar extent",
    metric: "Share of FIRMS detections inside the scar",
    against: "NASA FIRMS ACTIVE-FIRE DETECTIONS (VIIRS)",
  },
  {
    value: "0.71 κ",
    what: "Burn severity",
    metric: "Agreement of severity classes",
    against: "OPTICAL dNBR FROM NASA HLS",
  },
  ...(hasDeformation
    ? [
        {
          value: "1.8 cm",
          what: "Coseismic displacement",
          metric: "RMS difference, LOS-projected",
          against: "GNSS STATIONS (NEVADA GEODETIC LAB)",
        },
      ]
    : []),
];

const LIMITATIONS = [
  "Steep slopes facing away from the radar are in shadow and cannot be measured.",
  "Rain or soil moisture also change backscatter; comparing passes close in time limits false alarms.",
  "Line-of-sight motion is one component: separating vertical and horizontal motion needs ascending and descending pairs.",
  "NISAR data is still validated as PROVISIONAL by the mission; results inherit that status.",
];

const formatNumber = (value: number): string => value.toLocaleString("en-US");

const fireFigure = (demo: FireDemo | undefined): { frames: FigureFrame[]; captions: string[] } => ({
  frames: [
    {
      kind: "timeline",
      marks: [
        { at: 12, date: FIRE_PAIR[0], label: "Before", tone: "before" },
        { at: 88, date: FIRE_PAIR[1], label: "After", tone: "after" },
      ],
      note: "TRACK 47 A · FRAME 3 · HH+HV · 12 DAYS APART",
    },
    {
      kind: "images",
      images: demo && [
        { src: demo.beforeUrl, alt: "HV backscatter before", place: "left" },
        { src: demo.afterUrl, alt: "HV backscatter after", place: "right" },
      ],
    },
    {
      kind: "images",
      images: demo && [{ src: demo.changeUrl, alt: "Log-ratio of HV backscatter", place: "full" }],
    },
    {
      kind: "images",
      images: demo && [
        { src: demo.afterUrl, alt: "HV backscatter after", place: "full" },
        { src: demo.severityUrl, alt: "Burn severity classes", place: "full" },
      ],
    },
  ],
  captions: [
    "OBSERVATION PLAN",
    "HV BEFORE · AFTER",
    "LOG-RATIO, −10 → +2 dB",
    demo === undefined ? "BURN SEVERITY" : `${formatNumber(demo.affectedAreaHa)} HA BURNED`,
  ],
});

const quakeFigure = (
  demo: QuakeDemo | undefined,
): { frames: FigureFrame[]; captions: string[] } => ({
  frames: [
    {
      kind: "timeline",
      marks: [
        { at: 10, date: QUAKE_PAIR[0], label: "Before", tone: "before" },
        { at: 78, date: QUAKE_DATE, label: "M7.5", tone: "event" },
        { at: 90, date: QUAKE_PAIR[1], label: "After", tone: "after" },
      ],
      note: "TRACK 162 A · FRAME 7 · GUNW PAIR",
    },
    {
      kind: "images",
      images: demo && [
        { src: demo.fringesUrl, alt: "Interferogram fringes", place: "left" },
        { src: demo.displacementUrl, alt: "Line-of-sight displacement", place: "right" },
      ],
    },
    {
      kind: "images",
      images: demo && [
        {
          src: demo.displacementUrl,
          alt: "Displacement with unreliable pixels removed",
          place: "full",
        },
      ],
    },
    {
      kind: "summary",
      figures: demo && [
        {
          value: `${demo.maxTowardCm} cm`,
          label: "peak motion toward the satellite",
          tone: "toward",
        },
        { value: `${demo.maxAwayCm} cm`, label: "peak motion away from it", tone: "away" },
        {
          value: `${formatNumber(demo.deformedAreaKm2)} km²`,
          label: "moved more than 2 cm",
          tone: "neutral",
        },
      ],
    },
  ],
  captions: [
    "USGS + OBSERVATION PLAN",
    "FRINGES → DISPLACEMENT",
    "COHERENT PIXELS ONLY",
    "SUMMARY",
  ],
});

// The demo rasters take a moment; they wait until the browser is idle after the first paint.
const useDemos = (): { fire?: FireDemo; quake?: QuakeDemo } => {
  const [demos, setDemos] = useState<{ fire?: FireDemo; quake?: QuakeDemo }>({});
  useEffect(
    () =>
      whenIdle(() =>
        setDemos({ fire: buildFireDemo(), ...(hasDeformation ? { quake: buildQuakeDemo() } : {}) }),
      ),
    [],
  );
  return demos;
};

const initialHazard = (): MethodHazard =>
  hasDeformation && new URLSearchParams(window.location.search).get("hazard") === "earthquake"
    ? "earthquake"
    : "wildfire";

export const MethodPage = () => {
  const root = useRef<HTMLDivElement>(null);
  const [hazard, setHazard] = useState<MethodHazard>(initialHazard);
  const [step, setStep] = useState(0);
  const { fire, quake } = useDemos();
  useMethodMotion(root, setStep, hazard);

  const pickHazard = (id: MethodHazard) => {
    setHazard(id);
    // Shareable, like the explorer's ?hazard=; replace so the back button leaves the page.
    const url = new URL(window.location.href);
    url.searchParams.set("hazard", id);
    window.history.replaceState(null, "", url);
  };

  const steps = STEPS[hazard];
  const { frames, captions } = hazard === "wildfire" ? fireFigure(fire) : quakeFigure(quake);

  return (
    <div ref={root} className="site method">
      <a href="#main" className="s-skip">
        Skip to content
      </a>
      <SiteNav page="method" />

      <main id="main">
        <header className="m-intro">
          <p className="s-mono-label" data-intro>
            METHOD &amp; VALIDATION
          </p>
          <h1 className="m-intro__title" data-intro>
            How two radar passes become a map.
          </h1>
          <p className="m-intro__lead" data-intro>
            And how we check that the map is right.
          </p>
          {TABS.length > 1 && (
            <div className="m-tabs" role="group" aria-label="Hazard" data-intro>
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className="m-tabs__tab"
                  aria-pressed={hazard === id}
                  onClick={() => pickHazard(id)}
                  data-testid={`method-tab-${id}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </header>

        <section
          className="m-steps"
          aria-label={`${hazard === "wildfire" ? "Wildfire" : "Earthquake"} method`}
        >
          <div className="m-steps__grid">
            <ol className="m-steps__list">
              {steps.map(({ title, body, formula }, i) => (
                <li
                  key={i}
                  className="m-step"
                  data-step={i}
                  aria-current={i === step ? "step" : undefined}
                >
                  <p className="m-step__num">
                    STEP {i + 1} / {steps.length}
                  </p>
                  <h2 className="m-step__title">{title}</h2>
                  <p className="m-step__body">{body}</p>
                  {formula !== undefined && <p className="m-step__formula">{formula}</p>}
                </li>
              ))}
            </ol>
            <StepFigure
              frames={frames}
              step={step}
              caption={captions[step] ?? ""}
              ready={(hazard === "wildfire" ? fire : quake) !== undefined}
            />
          </div>
        </section>

        <section className="s-section--wide" data-section aria-labelledby="validation-heading">
          <div className="s-container">
            <div className="m-validation__head">
              <h2 id="validation-heading" className="s-head" data-reveal>
                Checked against
                <br />
                independent data.
              </h2>
              <p className="m-validation__note" data-reveal>
                <span className="m-demo-chip">DEMO VALUES</span>
                Placeholders until the pipeline runs on the featured events; the comparison method
                is final.
              </p>
            </div>
            <div className="m-validation__grid">
              {VALIDATION.map(({ value, what, metric, against }) => (
                <div key={what} className="m-validation__cell" data-reveal>
                  <p className="m-validation__value">{value}</p>
                  <h3 className="m-validation__what">{what}</h3>
                  <p className="m-validation__metric">{metric}</p>
                  <p className="m-validation__against">VS. {against}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="s-section--wide" data-section aria-labelledby="limits-heading">
          <div className="s-container m-limits">
            <h2 id="limits-heading" className="s-head" data-reveal>
              What radar can&apos;t tell you.
            </h2>
            <ul className="m-limits__list">
              {LIMITATIONS.map((text, i) => (
                <li key={text} className="m-limits__item" data-reveal>
                  <span className="m-limits__num">0{i + 1}</span>
                  <p>{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="s-section--wide m-close" data-section aria-labelledby="close-heading">
          <h2 id="close-heading" className="m-close__heading" data-reveal>
            See it on a real event.
          </h2>
          <div className="m-close__actions" data-reveal>
            {hasDeformation ? (
              <Link
                to={`/explore?event=${QUAKE_EVENT_ID}`}
                className="s-button s-button--large"
                testId="method-cta"
              >
                Open Venezuela, M7.5
              </Link>
            ) : (
              <Link to="/explore" className="s-button s-button--large" testId="method-cta">
                Open the globe
              </Link>
            )}
            <a
              href="https://github.com/cris-eci/nisar-hazard-watch/blob/main/docs/analysis-api.md"
              className="m-close__link"
            >
              Read the API contract →
            </a>
          </div>
        </section>
      </main>

      <footer className="s-footer">
        <div className="s-footer__cols">
          <div className="s-footer__identity">
            <p className="s-footer__name">{APP_NAME}</p>
            <p>Built for the NASA International Space Apps Challenge 2026. Chía, Colombia.</p>
          </div>
          <div className="s-footer__identity">
            <p>NASA-ISRO NISAR L2 GCOV and GUNW products, Alaska Satellite Facility DAAC.</p>
            <p>NASA NISAR Observation Plan (frames and planned passes).</p>
          </div>
          <div className="s-footer__identity">
            <p>USGS earthquake catalogue (event times and epicentres).</p>
            <p>NASA FIRMS and HLS (fire detections and optical burn index, for validation).</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
