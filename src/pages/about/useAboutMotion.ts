import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, type RefObject } from "react";

import {
  prefersReducedMotion,
  refreshWhenLoaded,
  startSmoothScroll,
} from "@/pages/site/siteMotion";

const SCANNED = "grayscale(1) contrast(1.6) brightness(0.55)";
const CLEAR = "grayscale(0) contrast(1) brightness(1)";

// Crew orbit plus a radar sweep that "acquires" each member card as it passes. Under reduced motion
// nothing moves and every card renders acquired, which is also the markup's default.
export const useAboutMotion = (root: RefObject<HTMLElement | null>): void => {
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
        stagger: 0.1,
        delay: 0.1,
      });
      // The ring turns and each node turns back, so the names stay upright.
      gsap.to("[data-orbit]", { rotation: 360, duration: 120, ease: "none", repeat: -1 });
      gsap.to("[data-node]", { rotation: -360, duration: 120, ease: "none", repeat: -1 });

      const scan = element.querySelector("[data-scan]");
      const grid = element.querySelector("[data-grid]");
      gsap.fromTo(
        scan,
        { top: "0%" },
        {
          top: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: grid,
            start: "top 62%",
            end: "bottom 62%",
            scrub: 0.4,
            onToggle: ({ isActive }) => {
              gsap.to(scan, { opacity: isActive ? 1 : 0, duration: 0.3 });
            },
          },
        },
      );

      for (const card of gsap.utils.toArray<HTMLElement>("[data-card]")) {
        const dim = card.querySelectorAll("[data-dim]");
        const avatar = card.querySelector("[data-avatar]");
        const ticks = card.querySelectorAll("[data-tick]");
        const status = card.querySelector<HTMLElement>("[data-status]");
        const acquire = (on: boolean, instant = false) => {
          const duration = instant ? 0 : 0.6;
          gsap.to(dim, {
            opacity: on ? 1 : 0.12,
            y: on ? 0 : 6,
            duration,
            stagger: on ? 0.06 : 0,
            ease: "power2.out",
          });
          gsap.to(avatar, { filter: on ? CLEAR : SCANNED, duration });
          gsap.to(ticks, { opacity: on ? 1 : 0.25, duration });
          if (status !== null) {
            status.textContent = on ? "ACQUIRED" : "SCANNING";
            status.dataset.state = on ? "acquired" : "scanning";
          }
        };
        acquire(false, true);
        ScrollTrigger.create({
          trigger: card,
          start: "top 62%",
          onEnter: () => acquire(true),
          onLeaveBack: () => acquire(false),
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-rise]").forEach((rise, i) => {
        gsap.from(rise, {
          y: 32,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          delay: (i % 4) * 0.06,
          scrollTrigger: { trigger: rise, start: "top 88%" },
        });
      });
    }, element);
    const stopRefreshing = refreshWhenLoaded();

    return () => {
      stopRefreshing();
      context.revert();
      stopSmoothScroll();
    };
  }, [root]);
};
