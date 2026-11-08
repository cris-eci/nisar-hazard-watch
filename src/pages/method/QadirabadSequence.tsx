import type { ChartMode } from "@/features/charts/chartTokens";
import { ContrastBars } from "@/features/charts/ContrastBars";
import { findCase } from "@/features/cases/cases";
import { ProvenanceChip } from "@/lib/ProvenanceChip";
import { SEQ_FRAMES, SEQ_SOURCE } from "@/pages/method/methodContent";

const QADIRABAD_GROUP = findCase("qadirabad")?.groups?.[0];

// One real answer in five frames. With motion it is a 520 vh section whose stage sticks while the
// frames crossfade (useMethodMotion); with reduced motion the frames simply stack.
export const QadirabadSequence = ({ mode }: { mode: ChartMode }) => (
  <section className="m-seq" data-seq aria-labelledby="seq-kicker" data-testid="method-sequence">
    <div className="m-seq__stage">
      <div className="m-seq__inner">
        <p id="seq-kicker" className="m-seq__kicker">
          One real answer · Qadirabad, Pakistan · July 2026
          <ProvenanceChip
            kind="real"
            source="Report crops and cell counts · NISAR-Modeling docs/FLOOD_CHARACTERIZATION.md, flood_pilot_summary.json"
          />
        </p>
        <ol className="m-seq__frames">
          {SEQ_FRAMES.map((frame) => (
            <li key={frame.n} className="m-seq__frame">
              <div className="m-seq__text" data-seq-text>
                <span className="m-seq__n">{frame.n} / 05</span>
                <h2 className="m-seq__title">{frame.title}</h2>
                <p className="m-seq__body">{frame.body}</p>
                {mode === "technical" && <p className="m-seq__tech">{frame.tech}</p>}
              </div>
              <figure className="m-seq__figure" data-seq-img>
                {frame.img !== undefined ? (
                  <img
                    src={frame.img}
                    alt={`Qadirabad, step ${frame.n}: ${frame.tag.toLowerCase()}`}
                    className="m-seq__img"
                    width={376}
                    height={377}
                    loading="lazy"
                  />
                ) : (
                  QADIRABAD_GROUP !== undefined && (
                    <div className="m-seq__bars">
                      <ContrastBars group={QADIRABAD_GROUP} mode={mode} />
                      <a href={SEQ_SOURCE} target="_blank" rel="noopener noreferrer">
                        Flood characterization report →
                      </a>
                    </div>
                  )
                )}
                <figcaption className="m-seq__caption">
                  <span className="m-seq__tag">{frame.tag}</span>
                  {frame.ramp !== undefined && (
                    <span
                      className="m-seq__ramp"
                      style={{ background: frame.ramp }}
                      aria-hidden="true"
                    />
                  )}
                </figcaption>
              </figure>
            </li>
          ))}
        </ol>
        <div className="m-seq__dots" aria-hidden="true">
          {SEQ_FRAMES.map((frame) => (
            <span key={frame.n} data-seq-dot />
          ))}
        </div>
      </div>
    </div>
  </section>
);
