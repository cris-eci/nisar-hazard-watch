import { useEffect, useRef, useState } from "react";

import { NovaGlyph } from "@/features/nova/NovaGlyph";
import { ONBOARDING_STEPS, type OnboardingTarget } from "@/features/onboarding/onboarding";

const TEST_ID: Record<OnboardingTarget, string> = {
  cases: "start-card",
  panel: "case-panel",
  dock: "layer-dock",
  timeline: "timeline",
};

const CARD_W = 330;
const CARD_H = 230;
const GAP = 16;
const TOP = 72;
const PAD = 8;
const NARROW_PX = 760;
// Targets appear a frame or two after the step changes (the panel opens at step 2).
const MEASURE_MS = 200;

type Box = { left: number; top: number; width: number; height: number };
type CardPosition = { left: number; top: number } | { left: number; bottom: number };
type Placement = { spot: Box | undefined; card: CardPosition };

const measure = (target: OnboardingTarget, cardH: number): Placement => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const element = document.querySelector(`[data-testid="${TEST_ID[target]}"]`);
  const rect = element?.getBoundingClientRect();
  const visible = rect !== undefined && rect.width > 0 && rect.height > 0;
  const spot = visible
    ? {
        left: rect.left - PAD,
        top: rect.top - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : undefined;
  const cardW = Math.min(CARD_W, width - GAP * 2);
  const centred = (width - cardW) / 2;
  if (spot === undefined)
    return { spot, card: { left: centred, top: Math.max(TOP, (height - cardH) / 2) } };
  // Phones: the panels sit at the bottom. The card goes under the top bar when it fits above the
  // target; otherwise (the start card fills most of the screen) it docks to the bottom, so the
  // target's heading stays visible.
  if (width < NARROW_PX)
    return {
      spot,
      card:
        spot.top - TOP >= cardH + GAP
          ? { left: centred, top: TOP }
          : { left: centred, bottom: GAP },
    };
  let left =
    target === "timeline" ? spot.left + spot.width / 2 - cardW / 2 : spot.left + spot.width + GAP;
  let top = target === "timeline" ? spot.top - cardH - GAP : spot.top + 40;
  if (target === "dock") left = spot.left - cardW - GAP;
  left = Math.max(GAP, Math.min(width - cardW - GAP, left));
  top = Math.max(TOP, Math.min(height - cardH - GAP, top));
  return { spot, card: { left, top } };
};

const sameBox = (a: Box | undefined, b: Box | undefined): boolean =>
  a === b ||
  (a !== undefined &&
    b !== undefined &&
    Math.round(a.left) === Math.round(b.left) &&
    Math.round(a.top) === Math.round(b.top) &&
    Math.round(a.width) === Math.round(b.width) &&
    Math.round(a.height) === Math.round(b.height));

const sameCard = (a: CardPosition, b: CardPosition): boolean =>
  Math.round(a.left) === Math.round(b.left) &&
  ("top" in a
    ? "top" in b && Math.round(a.top) === Math.round(b.top)
    : "bottom" in b && Math.round(a.bottom) === Math.round(b.bottom));

type OnboardingProps = {
  step: number;
  onNext: () => void;
  onSkip: () => void;
};

// A dimmed screen with a cut-out around the step's target; clicks pass through except on the card.
export const Onboarding = ({ step, onNext, onSkip }: OnboardingProps) => {
  const current = ONBOARDING_STEPS[step];
  const [placement, setPlacement] = useState<Placement>();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (current === undefined) return;
    const update = () => {
      // The card's real height depends on the step's text; before the first paint use the estimate.
      const next = measure(current.target, cardRef.current?.offsetHeight || CARD_H);
      setPlacement((previous) =>
        previous !== undefined &&
        sameBox(previous.spot, next.spot) &&
        sameCard(previous.card, next.card)
          ? previous
          : next,
      );
    };
    update();
    const timer = window.setInterval(update, MEASURE_MS);
    window.addEventListener("resize", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", update);
    };
  }, [current]);

  if (current === undefined) return null;
  const spot = placement?.spot;
  const last = step === ONBOARDING_STEPS.length - 1;
  return (
    <div className="x-onboard" data-testid="onboarding" data-step={step + 1}>
      <div
        className="x-onboard__spot"
        aria-hidden="true"
        data-rounded={current.target === "timeline"}
        style={
          spot === undefined
            ? { left: "50%", top: "50%", width: 0, height: 0 }
            : { left: spot.left, top: spot.top, width: spot.width, height: spot.height }
        }
      />
      <div
        ref={cardRef}
        className="x-onboard__card"
        role="dialog"
        aria-label="Quick tour"
        style={placement === undefined ? { visibility: "hidden" } : placement.card}
      >
        <div className="x-onboard__head">
          <NovaGlyph size={32} />
          <span>Nova</span>
          <span className="x-top__fill" />
          <span className="x-onboard__count" data-testid="onboarding-count">
            {step + 1} / {ONBOARDING_STEPS.length}
          </span>
        </div>
        <h3 className="x-onboard__title">{current.title}</h3>
        <p className="x-onboard__text">{current.text}</p>
        <div className="x-onboard__actions">
          <button
            type="button"
            className="x-onboard__skip"
            onClick={onSkip}
            data-testid="onboarding-skip"
          >
            Skip
          </button>
          <span className="x-top__fill" />
          <button
            type="button"
            className="x-onboard__next"
            onClick={onNext}
            data-testid="onboarding-next"
            autoFocus
          >
            {last ? "Start exploring" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};
