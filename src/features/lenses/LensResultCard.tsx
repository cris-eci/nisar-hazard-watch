import { useLayoutEffect, useMemo, useRef } from "react";

import { LENS_CARD, LENS_COPY, STEP_6 } from "@/content/copyV8";
import { NormalRangeCard } from "@/features/case-panel/NormalRangeCard";
import { Prov } from "@/features/case-panel/Prov";
import type { NormalRangeChannel, Subject } from "@/features/case-panel/subject";
import { VerdictGlyph } from "@/features/case-panel/Verdict";
import { SOURCE } from "@/features/case-panel/verdicts";
import { Icon } from "@/features/case-panel/icons";
import { HazardIcon } from "@/features/cases/HazardIcon";
import { findLens, type Verdict } from "@/features/cases/cases";
import type { LiveLayer } from "@/features/explore/exploreLayers";
import { lensEvaluationOf, type ExplorationView } from "@/features/explore/exploreSchemas";
import { isCardLens } from "@/features/lenses/lensSlots";
import { LENS_SLOTS } from "@/features/lenses/lensSlotsRegistry";
import { lensReasons } from "@/features/lenses/reasons";
import { surroundingsRow } from "@/features/lenses/surroundings";
import { popIn, revealBlocks } from "@/lib/motion";

const VERDICT_LABEL: Record<Verdict, string> = {
  departure: STEP_6.verdictDeparture,
  within: STEP_6.verdictWithin,
  insufficient: STEP_6.verdictNotEnough,
};

const SURROUNDINGS_GLYPH = {
  same: "within",
  darker: "departure",
  insufficient: "insufficient",
} as const;

const SOURCE_SURROUNDINGS =
  "Exploration API → result.lens.evaluation.surrounding_comparison (focal patch against matched cells)";

const signed = (value: number): string =>
  `${value < 0 ? "−" : value > 0 ? "+" : ""}${Math.abs(value).toFixed(1)}`;

const DeltaCard = ({ channel, delta, halfWidth }: NormalRangeChannel) => (
  <div className="x-ldelta" data-testid={`lens-delta-${channel}`} data-channel={channel}>
    <span className="x-ldelta__k">{channel}</span>
    <span className="x-ldelta__v">{STEP_6.pixelDelta(signed(delta))}</span>
    <span className="x-ldelta__s">
      {STEP_6.pixelBand(halfWidth.toFixed(1), Math.abs(delta) <= halfWidth)}
    </span>
  </div>
);

type Props = {
  subject: Subject;
  view: ExplorationView;
  layers: LiveLayer[];
  shownLayerId: string | undefined;
  onShowLayer: (id: string | undefined) => void;
  reduce: boolean;
  onMore: () => void;
};

/*
 * The lens result in its binding order (SPECS-v8 §6): header → the lens's rule block → the pixel →
 * why two → second witness → surroundings → possible drivers → More information. Lens-specific
 * parts arrive through LENS_SLOTS; an empty slot renders nothing.
 */
export const LensResultCard = ({
  subject,
  view,
  layers,
  shownLayerId,
  onShowLayer,
  reduce,
  onMore,
}: Props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const lens = isCardLens(subject.lens) ? subject.lens : "flood_wetland";
  const copy = LENS_COPY[lens];
  const evaluation = useMemo(
    () => (view.result === null ? undefined : lensEvaluationOf(view.result)),
    [view],
  );
  const slots = LENS_SLOTS[lens]({
    view,
    evaluation,
    subject,
    layers,
    shownLayerId,
    onShowLayer,
    reduce,
  });
  const verdict: Verdict = subject.verdict === "measured" ? "insufficient" : subject.verdict;
  const surroundings = surroundingsRow(evaluation);

  // Sections rise in when the result mounts or the lens changes; final state at once when reduced.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) return;
    const blocks = revealBlocks(root.querySelectorAll("[data-rv]"), { reduce });
    const glyph = root.querySelector(".x-lcard__verdict .x-glyph");
    const pop = glyph === null ? () => {} : popIn(glyph, { reduce });
    return () => {
      blocks();
      pop();
    };
  }, [subject.id, lens, reduce]);

  return (
    <div className="x-lcard" ref={rootRef} data-testid="lens-card" data-lens={lens}>
      <header className="x-lcard__head" data-rv data-testid="lens-head">
        <div className="x-lcard__title">
          <span className="x-lcard__icon">
            <HazardIcon id={findLens(lens)?.icon ?? "flood"} size={18} />
          </span>
          <div>
            <p className="x-kicker">{LENS_CARD.kicker(copy.label)}</p>
            <h3 className="x-lcard__question">{copy.question}</h3>
          </div>
        </div>
        <p className="x-lcard__verdict" data-testid="verdict" data-verdict={verdict}>
          <VerdictGlyph verdict={verdict} />
          {VERDICT_LABEL[verdict]}
          <Prov kind={subject.demo ? "demo" : "real"} source={SOURCE.liveVerdict} />
        </p>
        {slots.headline !== undefined && (
          <p className="x-lcard__headline" data-testid="lens-headline">
            {slots.headline}
          </p>
        )}
        {verdict === "insufficient" && (
          <ul className="x-lcard__reasons" data-testid="lens-reasons">
            {lensReasons(view.result?.lens?.reason).map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </header>

      {slots.extra != null && (
        <section className="x-lcard__slot" data-rv data-testid="lens-slot-extra">
          {slots.extra}
        </section>
      )}

      {subject.normalRange !== undefined && (
        <section className="x-lcard__section" data-rv data-testid="lens-pixel">
          <p className="x-kicker x-kicker--split">
            <span>{STEP_6.pixelTitle}</span>
            <Prov kind="real" source={SOURCE.liveRange} />
          </p>
          <NormalRangeCard range={subject.normalRange} compact heading={false} />
          <div className="x-ldeltas">
            {subject.normalRange.channels.map((channel) => (
              <DeltaCard key={channel.channel} {...channel} />
            ))}
          </div>
        </section>
      )}

      <section className="x-lcard__why" data-rv data-testid="lens-why-two">
        <span className="x-kicker">{STEP_6.whyTwoTitle}</span>
        <p>{STEP_6.whyTwo[lens]}</p>
      </section>

      {slots.witness != null && (
        <section className="x-lcard__slot" data-rv data-testid="lens-slot-witness">
          {slots.witness}
        </section>
      )}

      {surroundings !== undefined && (
        <section
          className="x-lcard__section x-lsurround"
          data-rv
          data-testid="lens-surroundings"
          data-state={surroundings.state}
        >
          <p className="x-kicker x-kicker--split">
            <span>{STEP_6.surroundingsTitle}</span>
            <Prov kind="real" source={SOURCE_SURROUNDINGS} />
          </p>
          <p className="x-lsurround__label">
            <VerdictGlyph verdict={SURROUNDINGS_GLYPH[surroundings.state]} />
            {surroundings.label}
          </p>
          <p className="x-lsurround__line">{surroundings.sentence}</p>
        </section>
      )}

      {slots.drivers != null && (
        <section className="x-lcard__slot" data-rv data-testid="lens-slot-drivers">
          {slots.drivers}
        </section>
      )}

      <button type="button" className="x-primary" onClick={onMore} data-rv data-testid="more-info">
        {STEP_6.moreInfo}
        <Icon name="arrow" size={14} />
      </button>
    </div>
  );
};
