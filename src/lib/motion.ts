// v8 motion (SPECS-v8 §9) on GSAP core only: no ScrollTrigger or Lenis, so it loads anywhere,
// including Vitest's node environment. Under reduced motion every helper shows the final state at once.
import { gsap } from "gsap";

import { formatCount } from "@/content/copyV8";

// Safe without `window` (tests, prerendering): no window means no animation preference to honour.
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type MotionOptions = { reduce?: boolean };

type Cleanup = () => void;

const shouldReduce = (options: MotionOptions): boolean => options.reduce ?? prefersReducedMotion();

// Revert hands the targets back as they were before the tween, so an unmount mid-way leaves no
// half-faded block behind.
const revertOnCleanup =
  (tween: gsap.core.Tween): Cleanup =>
  () => {
    tween.revert();
  };

// Lens result sections: each [data-rv] block rises in.
export const revealBlocks = (targets: gsap.TweenTarget, options: MotionOptions = {}): Cleanup => {
  if (shouldReduce(options)) {
    gsap.set(targets, { y: 0, opacity: 1 });
    return () => {};
  }
  return revertOnCleanup(
    gsap.fromTo(
      targets,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: "power3.out" },
    ),
  );
};

// Verdict glyph.
export const popIn = (target: gsap.TweenTarget, options: MotionOptions = {}): Cleanup => {
  if (shouldReduce(options)) {
    gsap.set(target, { scale: 1 });
    return () => {};
  }
  return revertOnCleanup(
    gsap.fromTo(
      target,
      { scale: 0 },
      { scale: 1, duration: 0.5, delay: 0.15, ease: "back.out(3)" },
    ),
  );
};

// Rule count 0 → N; every value the caller sees is already formatted en-US.
export const countUp = (
  to: number,
  onUpdate: (text: string) => void,
  options: MotionOptions = {},
): Cleanup => {
  if (shouldReduce(options)) {
    onUpdate(formatCount(to));
    return () => {};
  }
  const counter = { value: 0 };
  const tween = gsap.to(counter, {
    value: to,
    duration: 1.1,
    delay: 0.3,
    ease: "power2.out",
    onUpdate: () => onUpdate(formatCount(Math.round(counter.value))),
  });
  return () => {
    tween.kill();
  };
};

// Waiting step ring (1.6 s), footprint (1.8 s): one full .45 → 1 → .45 cycle per `seconds`.
export const pulse = (
  target: gsap.TweenTarget,
  seconds: number,
  options: MotionOptions = {},
): Cleanup => {
  if (shouldReduce(options)) {
    gsap.set(target, { opacity: 1 });
    return () => {};
  }
  return revertOnCleanup(
    gsap.fromTo(
      target,
      { opacity: 0.45 },
      { opacity: 1, duration: seconds / 2, ease: "sine.inOut", yoyo: true, repeat: -1 },
    ),
  );
};
