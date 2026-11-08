import "@/pages/site/site.css";
import "@/pages/method/method.css";

import { useRef, useState, type ReactNode } from "react";

import { BandChart } from "@/features/charts/BandChart";
import type { ChartMode } from "@/features/charts/chartTokens";
import { MetricsChart } from "@/features/charts/MetricsChart";
import { MODEL_SCORES } from "@/features/charts/metrics";
import { LENSES, type Verdict } from "@/features/cases/cases";
import { demoBandPasses } from "@/features/cases/demoBand";
import { HazardIcon } from "@/features/cases/HazardIcon";
import { EvidenceSection } from "@/pages/method/EvidenceSection";
import {
  BAND_SENTENCE,
  LANDSLIDE_CHECKS,
  LENS_NOTES,
  MODELS_REPO,
  PALETTES,
  PIPELINE,
} from "@/pages/method/methodContent";
import { QadirabadSequence } from "@/pages/method/QadirabadSequence";
import { SatelliteTeardown } from "@/pages/method/SatelliteTeardown";
import { useMethodMotion } from "@/pages/method/useMethodMotion";
import { SiteFooter, type FooterColumn } from "@/pages/site/SiteFooter";
import { SiteNav } from "@/pages/site/SiteNav";

const MODES: { value: ChartMode; label: string }[] = [
  { value: "plain", label: "Plain" },
  { value: "technical", label: "Technical" },
];

const BAND_CARDS: { verdict: Verdict; label: string; height: number }[] = [
  { verdict: "departure", label: "Changed beyond its range · hover a pass", height: 240 },
  { verdict: "within", label: "Within its range", height: 150 },
  { verdict: "insufficient", label: "Not enough radar yet", height: 150 },
];

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "RADAR DATA",
    items: [
      { label: "NISAR L2 GCOV and GUNW · ASF DAAC", href: "https://search.asf.alaska.edu/" },
      {
        label: "NISAR Observation Plan",
        href: "https://nisar.jpl.nasa.gov/mission/get-to-know-sar/observation-plan/",
      },
    ],
  },
  {
    title: "EVIDENCE",
    items: [
      { label: "NISAR-Modeling reports", href: "https://github.com/Ch0comilo/NISAR-Modeling" },
      { label: "NISAR-Models model cards", href: MODELS_REPO },
      {
        label: "OPERA DSWx-HLS · PO.DAAC",
        href: "https://podaac.jpl.nasa.gov/dataset/OPERA_L3_DSWX-HLS_V1",
      },
    ],
  },
];

// The reading level lives on this page only; the shared nav stays untouched.
const ModeSwitch = ({ mode, onChange }: { mode: ChartMode; onChange: (m: ChartMode) => void }) => (
  <div className="m-mode" role="group" aria-label="Reading level">
    {MODES.map(({ value, label }) => (
      <button
        key={value}
        type="button"
        className="m-mode__option"
        aria-pressed={mode === value}
        onClick={() => onChange(value)}
        data-testid={`method-mode-${value}`}
      >
        {label}
      </button>
    ))}
  </div>
);

const SectionHead = ({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  children?: ReactNode;
}) => (
  <div className="m-section__head" data-reveal>
    <p className="m-kicker">{kicker}</p>
    <h2 id={id} className="m-h2">
      {title}
    </h2>
    {children}
  </div>
);

export const MethodPage = () => {
  const root = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ChartMode>("plain");
  const tech = mode === "technical";
  useMethodMotion(root, mode);

  return (
    <div ref={root} className="site method">
      <a href="#main" className="s-skip">
        Skip to content
      </a>
      <SiteNav page="method" />
      <ModeSwitch mode={mode} onChange={setMode} />

      <main id="main">
        <header className="m-hero">
          <p className="m-hero__kicker" data-intro>
            Method · What we measure and what we don&apos;t
          </p>
          <h1 className="m-hero__title" data-intro>
            One honest question, asked of real radar.
          </h1>
          <p className="m-hero__lead" data-intro>
            Did the radar echo at this place change beyond its own normal range, and what else
            agrees? We don&apos;t classify events, forecast or give probabilities. We measure,
            compare, and say where the measurement runs out.
          </p>
        </header>

        <SatelliteTeardown />

        <QadirabadSequence mode={mode} />

        <div className="m-wrap">
          <section className="m-section" data-pipe data-testid="method-pipeline">
            <SectionHead
              id="pipeline-heading"
              kicker="01 · From a click to an answer"
              title="Six steps, every time."
            />
            <div className="m-pipe">
              <div className="m-pipe__rail" aria-hidden="true" />
              <div className="m-pipe__bar" data-bar aria-hidden="true" />
              <ol className="m-pipe__steps">
                {PIPELINE.map((step) => (
                  <li key={step.n} className="m-pipe__step" data-step>
                    <span className="m-pipe__node" aria-hidden="true" />
                    <span className="m-pipe__n">{step.n}</span>
                    <p className="m-pipe__title">{step.title}</p>
                    <p className="m-pipe__body">{step.body}</p>
                    {tech && <p className="m-pipe__tech">{step.tech}</p>}
                  </li>
                ))}
              </ol>
            </div>
            <p className="m-note" data-reveal>
              A live question reads real radar, so it takes about a minute. Measured cases are
              precomputed and open instantly. Answers can be partial or insufficient: no usable
              pixels, a thin history, a masked point. Those are normal outcomes, and the explorer
              explains each one.
            </p>
          </section>

          <section className="m-section" data-section aria-labelledby="band-heading">
            <SectionHead
              id="band-heading"
              kicker="02 · Reading the band chart"
              title="A place's normal range, and the pass that left it."
            >
              <p className="m-lead">
                The solid line is HH, the dashed line HV; circles and squares tell them apart
                without colour. Shaded bands are each channel&apos;s normal range from earlier
                passes. A white ring marks a pass outside its band. A break in a line means no pass
                was used that day. Hover to read any pass.
              </p>
            </SectionHead>
            <div className="m-band" data-testid="method-band-charts">
              {BAND_CARDS.map(({ verdict, label, height }) => (
                <div key={verdict} className={`m-panel m-band__${verdict}`} data-reveal>
                  <p className="m-panel__label">
                    {tech ? "Technical" : "Plain"} · {label}
                  </p>
                  <div data-draw>
                    <BandChart
                      passes={demoBandPasses(verdict)}
                      mode={mode}
                      height={height}
                      sentence={BAND_SENTENCE[verdict]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="m-section" data-section aria-labelledby="lenses-heading">
            <SectionHead
              id="lenses-heading"
              kicker="03 · Lenses are questions"
              title="The same radar, asked five different things."
            />
            <ul className="m-lenses" data-testid="method-lenses">
              {LENSES.map((lens) => (
                <li key={lens.id} className="m-lens" data-reveal data-testid="method-lens">
                  <div className="m-lens__who">
                    <span
                      className={
                        lens.id === "insar" ? "m-lens__icon m-lens__icon--dashed" : "m-lens__icon"
                      }
                    >
                      <HazardIcon id={lens.icon} size={18} />
                    </span>
                    <span className="m-lens__name">
                      <span className="m-lens__chip">{lens.chip}</span>
                      <span className="m-lens__tag">{LENS_NOTES[lens.id].tag}</span>
                    </span>
                  </div>
                  <p className="m-lens__compares">{lens.compares}</p>
                  <p className="m-lens__limit">{LENS_NOTES[lens.id].limit}</p>
                </li>
              ))}
            </ul>
          </section>

          <EvidenceSection mode={mode} />

          <section className="m-section" data-section aria-labelledby="models-heading">
            <SectionHead
              id="models-heading"
              kicker="05 · Experimental models"
              title="Three classifiers we're still testing."
            >
              <p className="m-lead">
                Our data scientist also trains water, tree-cover and tree-cover-disturbance models
                on NISAR. They run, but they&apos;re marked not ready for general use, and the
                explorer never mixes them into a verdict.
              </p>
            </SectionHead>
            <div className="m-panel m-panel--wide" data-reveal>
              <div data-draw>
                <MetricsChart models={MODEL_SCORES} mode={mode} />
              </div>
            </div>
            <a
              className="m-models__link"
              href={MODELS_REPO}
              target="_blank"
              rel="noopener noreferrer"
              data-reveal
            >
              NISAR-Models on GitHub · try each model in Colab →
            </a>
          </section>

          <section className="m-section m-slides" data-section aria-labelledby="landslides-heading">
            <SectionHead
              id="landslides-heading"
              kicker="06 · Landslides"
              title="The fifth hazard starts with two checks."
            >
              <p className="m-lead">
                Do real passes bracket the event? Can the radar see the slope at all, or is it in
                shadow or layover? Only then do we look for local changes in the echo or in
                coherence.
              </p>
              <p className="m-note">
                Intensity is not displacement. Movement needs terrain visibility plus geodetic or
                offset evidence. The backend&apos;s Niscemi example only has passes after the slide,
                so it can&apos;t show the change.
              </p>
            </SectionHead>
            <div className="m-slides__card" data-reveal data-testid="method-landslides">
              <div className="m-slides__who">
                <span className="m-slides__icon">
                  <HazardIcon id="landslide" size={26} />
                </span>
                <span className="m-lens__name">
                  <span className="m-slides__name">Landslides</span>
                  <span className="m-lens__tag m-slides__tag">No measured case yet</span>
                </span>
              </div>
              <ol className="m-slides__checks">
                {LANDSLIDE_CHECKS.map((check, i) => (
                  <li key={check}>
                    <span className="m-slides__n">0{i + 1}</span>
                    {check}
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="m-section" data-section aria-labelledby="colours-heading">
            <SectionHead
              id="colours-heading"
              kicker="07 · Colours belong to the data"
              title="How to read every map."
            />
            <div className="m-palettes" data-testid="method-palettes">
              {PALETTES.map((palette) => (
                <div key={palette.title} className="m-palette" data-reveal>
                  <p className="m-palette__title">{palette.title}</p>
                  <div className="m-palette__bar" style={{ background: palette.bar }} />
                  <p className="m-palette__ends">
                    <span>{palette.left}</span>
                    <span>{palette.right}</span>
                  </p>
                  <p className="m-palette__note">{palette.note}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter
        lon={-75.32}
        lat={4.89}
        coordLabel="NEVADO DEL RUIZ · 4.89° N, 75.32° W"
        kicker="HECHO EN COLOMBIA · WHY GROUND MOTION MATTERS"
        headline="Volcanoes swell before they erupt. Radar can measure the swelling from orbit."
        photo={{
          src: "/footer/nevado-del-ruiz.jpg",
          tag: "SEEN FROM THE ISS",
          title: "Nevado del Ruiz, 5,389 m",
          sub: "In 1985 its mudflows buried the town of Armero and killed at least 23,000 people.",
          credit: "Photo: NASA Expedition 23 crew · ISS023-E-27737",
          creditHref:
            "https://earthobservatory.nasa.gov/images/43859/nevado-del-ruiz-volcano-colombia",
        }}
        columns={FOOTER_COLUMNS}
      />
    </div>
  );
};
