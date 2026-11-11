import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, type RefObject } from "react";

import {
  prefersReducedMotion,
  refreshWhenLoaded,
  revealSections,
  startSmoothScroll,
} from "@/pages/site/siteMotion";

// The Qadirabad frames crossfade on scrub: text fades and slides ±24 px, the picture fades and
// settles from 1.03 to 1, and the dot of the shown frame fills.
const scrubSequence = (section: HTMLElement): void => {
  const texts = section.querySelectorAll<HTMLElement>("[data-seq-text]");
  const images = section.querySelectorAll<HTMLElement>("[data-seq-img]");
  const dots = section.querySelectorAll<HTMLElement>("[data-seq-dot]");
  const count = images.length;
  if (count === 0) return;
  gsap.set([...texts, ...images], { opacity: 0 });
  gsap.set([texts[0], images[0]], { opacity: 1 });
  gsap.set(dots[0] ?? [], { backgroundColor: "#ebe9e4" });
  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.5 },
  });
  for (let i = 1; i < count; i++) {
    const at = i - 0.5;
    timeline
      .to(texts[i - 1] ?? [], { opacity: 0, y: -24, duration: 0.25 }, at)
      .fromTo(
        texts[i] ?? [],
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.25 },
        at + 0.15,
      )
      .to(images[i - 1] ?? [], { opacity: 0, scale: 0.97, duration: 0.3 }, at)
      .fromTo(
        images[i] ?? [],
        { opacity: 0, scale: 1.03 },
        { opacity: 1, scale: 1, duration: 0.3 },
        at + 0.05,
      )
      .to(dots[i] ?? [], { backgroundColor: "#ebe9e4", duration: 0.1 }, at + 0.1);
  }
  timeline.to({}, { duration: 0.5 }, count - 0.5);
};

// The gold bar fills with the scroll and each step lights up as the bar reaches it.
const scrubPipeline = (pipe: HTMLElement): void => {
  const steps = pipe.querySelectorAll<HTMLElement>("[data-step]");
  const timeline = gsap.timeline({
    scrollTrigger: { trigger: pipe, start: "top 70%", end: "bottom 55%", scrub: 0.5 },
  });
  timeline.fromTo(
    pipe.querySelector("[data-bar]"),
    { scaleX: 0 },
    { scaleX: 1, ease: "none", duration: 1 },
    0,
  );
  steps.forEach((step, i) =>
    timeline.fromTo(
      step,
      { opacity: 0.3 },
      { opacity: 1, duration: 0.12 },
      (i / steps.length) * 0.9,
    ),
  );
};

// Everything here is decoration on top of a page that reads fine without it: with reduced motion
// the sequence stacks (CSS), the bar shows full and charts draw at once.
export const useMethodMotion = (root: RefObject<HTMLElement | null>, mode: string): void => {
  useLayoutEffect(() => {
    const element = root.current;
    if (element === null || prefersReducedMotion()) return;
    const stopSmoothScroll = startSmoothScroll();

    const context = gsap.context(() => {
      gsap.from("[data-intro]", {
        y: 28,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.09,
        delay: 0.1,
      });
      revealSections();
      const sequence = element.querySelector<HTMLElement>("[data-seq]");
      if (sequence !== null) scrubSequence(sequence);
      const pipe = element.querySelector<HTMLElement>("[data-pipe]");
      if (pipe !== null) scrubPipeline(pipe);
      for (const chart of gsap.utils.toArray<HTMLElement>("[data-draw]")) {
        gsap.fromTo(
          chart,
          { clipPath: "inset(0 100% 0 0)" },
          {
            clipPath: "inset(0 0% 0 0)",
            duration: 1.4,
            ease: "power2.inOut",
            scrollTrigger: { trigger: chart, start: "top 82%", once: true },
          },
        );
      }
    }, element);
    const stopRefreshing = refreshWhenLoaded();

    return () => {
      stopRefreshing();
      context.revert();
      stopSmoothScroll();
    };
  }, [root]);

  // Technical copy is longer, so every trigger below the switch moves.
  useLayoutEffect(() => {
    ScrollTrigger.refresh();
  }, [mode]);
};
