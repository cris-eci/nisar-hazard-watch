import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, type RefObject } from "react";

import {
  prefersReducedMotion,
  refreshWhenLoaded,
  revealSections,
  startSmoothScroll,
} from "@/pages/site/siteMotion";

// Matches the narrow-screen block in method.css, where the figure sticks above the steps.
const stepLine = (): string => (window.matchMedia("(max-width: 50rem)").matches ? "72%" : "55%");

// The step under the middle of the viewport drives the sticky figure. That works with reduced
// motion too (it is state, not animation); smooth scroll and the entrances do not run there.
export const useMethodMotion = (
  root: RefObject<HTMLElement | null>,
  setStep: (step: number) => void,
  hazard: string,
): void => {
  useLayoutEffect(() => {
    const element = root.current;
    if (element === null) return;
    const reduced = prefersReducedMotion();
    const stopSmoothScroll = reduced ? undefined : startSmoothScroll();

    const context = gsap.context(() => {
      if (!reduced) {
        gsap.from("[data-intro]", {
          y: 28,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.09,
          delay: 0.1,
        });
        revealSections();
      }
      for (const step of gsap.utils.toArray<HTMLElement>("[data-step]")) {
        const index = Number(step.dataset.step);
        ScrollTrigger.create({
          trigger: step,
          start: () => `top ${stepLine()}`,
          end: () => `bottom ${stepLine()}`,
          onToggle: ({ isActive }) => {
            if (isActive) setStep(index);
          },
        });
      }
    }, element);
    const stopRefreshing = refreshWhenLoaded();

    return () => {
      stopRefreshing();
      context.revert();
      stopSmoothScroll?.();
    };
  }, [root, setStep]);

  // Another hazard's copy changes the steps' heights.
  useLayoutEffect(() => {
    ScrollTrigger.refresh();
  }, [hazard]);
};
