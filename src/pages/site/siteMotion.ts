import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Lenis smooth scroll driven by GSAP's ticker, so ScrollTrigger and Lenis share one clock.
export const startSmoothScroll = (): (() => void) => {
  const lenis = new Lenis({ lerp: 0.1 });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
};

// One staggered entrance per [data-section]. Uses gsap.from, so if this never runs nothing stays
// hidden. Call it inside a gsap.context so it reverts with the page.
export const revealSections = (): void => {
  for (const section of gsap.utils.toArray<HTMLElement>("[data-section]")) {
    gsap.from(section.querySelectorAll("[data-reveal]"), {
      y: 28,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.08,
      scrollTrigger: { trigger: section, start: "top 78%", once: true },
    });
  }
};

// Scroll lengths depend on the final fonts and image sizes.
export const refreshWhenLoaded = (): (() => void) => {
  const refresh = () => ScrollTrigger.refresh();
  void document.fonts.ready.then(refresh);
  window.addEventListener("load", refresh);
  return () => window.removeEventListener("load", refresh);
};
