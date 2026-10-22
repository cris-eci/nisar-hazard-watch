import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useLayoutEffect, type RefObject } from "react";

gsap.registerPlugin(ScrollTrigger);

const STAGGER_S = 0.075;
const RISE_PX = 24;

export const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Smooth scroll, the hero's clouds dissolving with the scroll, and one staggered entrance per
// section (heading, then text, then picture). Uses gsap.from, so if this never runs nothing stays
// hidden. With reduced motion only the cloud cover is set, statically.
export const useLandingMotion = (
  root: RefObject<HTMLElement | null>,
  setCloudCover: (value: number) => void,
): void => {
  useLayoutEffect(() => {
    const element = root.current;
    if (element === null) return;

    if (prefersReducedMotion()) {
      setCloudCover(0.35);
      return;
    }

    const lenis = new Lenis({ lerp: 0.11 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ".l-hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: ({ progress }) => {
          setCloudCover(1 - Math.min(1, progress * 1.6));
        },
      });
      gsap.to(".l-hero__space", {
        yPercent: 18,
        ease: "none",
        scrollTrigger: { trigger: ".l-hero", start: "top top", end: "bottom top", scrub: true },
      });

      gsap.from(".l-hero [data-reveal]", {
        y: RISE_PX,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
        delay: 0.1,
      });

      for (const section of gsap.utils.toArray<HTMLElement>("[data-section]")) {
        gsap.from(section.querySelectorAll("[data-reveal]"), {
          y: RISE_PX,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: STAGGER_S,
          scrollTrigger: { trigger: section, start: "top 78%", once: true },
        });
      }
    }, element);

    return () => {
      context.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [root, setCloudCover]);
};
