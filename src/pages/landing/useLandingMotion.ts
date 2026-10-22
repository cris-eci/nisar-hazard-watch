import { gsap } from "gsap";
import { useLayoutEffect, type RefObject } from "react";

import type { EarthControls } from "@/pages/landing/EarthHero";
import {
  prefersReducedMotion,
  refreshWhenLoaded,
  revealSections,
  startSmoothScroll,
} from "@/pages/site/siteMotion";

// Matches the narrow-screen block in landing.css, where layer C sits above the planet.
const narrow = (): boolean => window.matchMedia("(max-width: 40rem)").matches;

type Story = {
  controls: { current: EarthControls };
  setCloudCover: (value: number) => void;
  home: { x: number; y: number };
  target: { x: number; y: number };
};

// Smooth scroll; the pinned story (clouds dissolve, orbit, the 12-day counter, the turn to the
// epicentre); the pipeline fill; the events carousel; the mission parallax; one staggered entrance
// per section. Entrances use gsap.from, so if this never runs nothing stays hidden. With reduced
// motion the page lays the story out as plain sections (landing.css) and only the cloud cover is set.
export const useLandingMotion = (
  root: RefObject<HTMLElement | null>,
  { controls, setCloudCover, home, target }: Story,
): void => {
  useLayoutEffect(() => {
    const element = root.current;
    if (element === null) return;

    if (prefersReducedMotion()) {
      setCloudCover(0.35);
      return;
    }

    const stopSmoothScroll = startSmoothScroll();

    const P = controls.current;
    const count = { n: 0 };
    const clouds = { cover: 1 };
    const counter = element.querySelector("[data-count]");

    const context = gsap.context(() => {
      gsap.from("[data-intro]", {
        y: 28,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.15,
      });
      gsap.from(P, { z: 6.5, duration: 2.2, ease: "power3.out" });

      // Positions are fractions (0..1) of the story section's scroll.
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: ".l-story",
            invalidateOnRefresh: true,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
          },
        })
        .to('[data-layer="hero"]', { opacity: 0, y: -60, duration: 0.1 }, 0)
        .to(clouds, { cover: 0, duration: 0.28, onUpdate: () => setCloudCover(clouds.cover) }, 0.02)
        .to(P, { offY: 0, z: 4.9, rx: home.x + 0.1, duration: 0.28, ease: "power1.inOut" }, 0)
        .fromTo(
          '[data-layer="a"]',
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.07 },
          0.12,
        )
        .to('[data-layer="a"]', { opacity: 0, y: -30, duration: 0.06 }, 0.3)
        .to(P, { offX: -0.2, z: 4.4, duration: 0.12, ease: "power1.inOut" }, 0.32)
        .to(P, { ring: 1, duration: 0.08 }, 0.36)
        .fromTo(
          '[data-layer="b"]',
          { opacity: 0, x: -30 },
          { opacity: 1, x: 0, duration: 0.07 },
          0.38,
        )
        .to(
          count,
          {
            n: 12,
            duration: 0.14,
            ease: "power2.out",
            onUpdate: () => {
              if (counter !== null) counter.textContent = String(Math.round(count.n));
            },
          },
          0.38,
        )
        .to('[data-layer="b"]', { opacity: 0, x: -30, duration: 0.06 }, 0.6)
        .to(P, { ring: 0, duration: 0.08 }, 0.62)
        .to(
          P,
          {
            rx: target.x,
            ry: target.y,
            drift: 0,
            z: 2.45,
            offX: () => (narrow() ? 0 : -0.16),
            offY: () => (narrow() ? -0.24 : 0),
            duration: 0.2,
            ease: "power2.inOut",
          },
          0.64,
        )
        .fromTo(
          '[data-layer="c"]',
          { opacity: 0, x: -30 },
          { opacity: 1, x: 0, duration: 0.07 },
          0.8,
        )
        .to(P, { callout: 1, duration: 0.06 }, 0.84)
        .to({}, { duration: 0.1 }, 0.9);

      const pipeline = element.querySelector(".l-pipeline");
      if (pipeline !== null) {
        const steps = pipeline.querySelectorAll("[data-step]");
        const fill = gsap.timeline({
          scrollTrigger: { trigger: pipeline, start: "top 70%", end: "bottom 60%", scrub: 0.5 },
        });
        fill.fromTo(
          ".l-pipeline__fill",
          { scaleX: 0 },
          { scaleX: 1, ease: "none", duration: 1 },
          0,
        );
        steps.forEach((step, i) => {
          fill.fromTo(
            step,
            { opacity: 0.3 },
            { opacity: 1, duration: 0.12 },
            (i / steps.length) * 0.9,
          );
        });
      }

      const track = element.querySelector<HTMLElement>(".l-events__track");
      if (track !== null) {
        gsap.to(track, {
          x: () => -Math.max(0, track.scrollWidth - window.innerWidth),
          ease: "none",
          scrollTrigger: {
            trigger: ".l-events",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
      }

      gsap.to("[data-parallax]", {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-parallax]",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      revealSections();
    }, element);

    const stopRefreshing = refreshWhenLoaded();

    return () => {
      stopRefreshing();
      context.revert();
      stopSmoothScroll();
    };
  }, [root, controls, setCloudCover, home, target]);
};
