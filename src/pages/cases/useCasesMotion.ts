import { gsap } from "gsap";
import { useLayoutEffect, useRef, type RefObject } from "react";

import { prefersReducedMotion, startSmoothScroll } from "@/pages/site/siteMotion";

const COLUMNS = 3;

// Smooth scroll for the page's life; the intro once; the cards rise by column when they scroll into
// view, again each time the filter changes. gsap.from, so if this never runs nothing stays hidden.
export const useCasesMotion = (root: RefObject<HTMLElement | null>, filterKey: string): void => {
  const first = useRef(true);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    return startSmoothScroll();
  }, []);

  useLayoutEffect(() => {
    const element = root.current;
    if (element === null || prefersReducedMotion()) return;
    const isFirst = first.current;
    first.current = false;

    const context = gsap.context(() => {
      if (isFirst) {
        gsap.from("[data-intro]", { y: 24, opacity: 0, duration: 0.9, ease: "power3.out" });
      }
      gsap.utils.toArray<HTMLElement>("[data-card]").forEach((card, i) => {
        const column = i % COLUMNS;
        gsap.from(card, {
          y: 32,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          delay: isFirst ? 0.15 + column * 0.08 : column * 0.05,
          scrollTrigger: { trigger: card, start: "top 92%", once: true },
        });
      });
    }, element);

    return () => context.revert();
  }, [root, filterKey]);
};
