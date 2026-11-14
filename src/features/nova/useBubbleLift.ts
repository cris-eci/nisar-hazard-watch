import { useEffect, useState, type RefObject } from "react";

// The bottom cards on a phone: the start card, a searched place and the result panel (the sheet).
const BOTTOM_CARDS = ".x-start, .x-place, .x-panel";
const NARROW = "(max-width: 760px)";
const GAP_PX = 12;

/*
 * SPECS-v8 §10: on a phone the bubble sits above the sheet. The sheet's height follows its content,
 * so this measures it: pixels from the explorer's bottom edge to just above the highest bottom card,
 * or undefined on wide screens or when no card is shown (the CSS default applies).
 */
export const useBubbleLift = (anchor: RefObject<HTMLElement | null>): number | undefined => {
  const [lift, setLift] = useState<number | undefined>(undefined);

  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>(".explorer");
    if (root === null || root === undefined) return;
    const narrow = window.matchMedia(NARROW);
    let frame = 0;

    const measure = () => {
      frame = 0;
      if (!narrow.matches) return setLift(undefined);
      const tops = [...root.querySelectorAll<HTMLElement>(BOTTOM_CARDS)]
        .map((card) => card.getBoundingClientRect())
        .filter((box) => box.height > 0)
        .map((box) => box.top);
      setLift(
        tops.length === 0
          ? undefined
          : root.getBoundingClientRect().bottom - Math.min(...tops) + GAP_PX,
      );
    };
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(measure);
    };

    const sizes = new ResizeObserver(schedule);
    const observe = () => {
      sizes.disconnect();
      sizes.observe(root);
      root.querySelectorAll(BOTTOM_CARDS).forEach((card) => sizes.observe(card));
      schedule();
    };
    // Cards mount and unmount as the user moves through the steps.
    const cards = new MutationObserver(observe);
    cards.observe(root, { childList: true, subtree: true });
    narrow.addEventListener("change", schedule);
    observe();

    return () => {
      window.cancelAnimationFrame(frame);
      sizes.disconnect();
      cards.disconnect();
      narrow.removeEventListener("change", schedule);
    };
  }, [anchor]);

  return lift;
};
