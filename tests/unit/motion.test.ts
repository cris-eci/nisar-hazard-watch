import { gsap } from "gsap";
import { afterEach, describe, expect, it, vi } from "vitest";

import { countUp, popIn, prefersReducedMotion, pulse, revealBlocks } from "@/lib/motion";

type Block = { y: number; opacity: number };

// Jumps every running tween to its end, as if the animation had played out.
const finishAll = () => {
  for (const child of gsap.globalTimeline.getChildren()) child.progress(1);
};

afterEach(() => {
  gsap.globalTimeline.clear();
});

describe("prefersReducedMotion", () => {
  it("is false without a window (node)", () => {
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe("countUp", () => {
  it("under reduced motion calls back once, synchronously, with the final count", () => {
    const onUpdate = vi.fn();
    countUp(5513, onUpdate, { reduce: true });
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith("5,513");
  });

  it("with motion ends on the same formatted count", () => {
    const onUpdate = vi.fn();
    countUp(5513, onUpdate, { reduce: false });
    finishAll();
    expect(onUpdate).toHaveBeenLastCalledWith("5,513");
  });

  it("stops calling back after cleanup", () => {
    const onUpdate = vi.fn();
    const cleanup = countUp(5513, onUpdate, { reduce: false });
    cleanup();
    finishAll();
    expect(onUpdate).not.toHaveBeenCalled();
  });
});

describe("revealBlocks", () => {
  it("under reduced motion leaves the blocks in their final state", () => {
    const a: Block = { y: 16, opacity: 0 };
    const b: Block = { y: 16, opacity: 0 };
    revealBlocks([a, b], { reduce: true });
    expect(a).toMatchObject({ y: 0, opacity: 1 });
    expect(b).toMatchObject({ y: 0, opacity: 1 });
  });

  it("with motion starts hidden and ends in the same final state", () => {
    const a: Block = { y: 0, opacity: 1 };
    revealBlocks([a], { reduce: false });
    expect(a).toMatchObject({ y: 16, opacity: 0 });
    finishAll();
    expect(a).toMatchObject({ y: 0, opacity: 1 });
  });
});

describe("popIn", () => {
  it("under reduced motion shows the glyph at full size", () => {
    const glyph = { scale: 0 };
    popIn(glyph, { reduce: true });
    expect(glyph.scale).toBe(1);
  });

  it("with motion grows from 0 to 1", () => {
    const glyph = { scale: 1 };
    popIn(glyph, { reduce: false });
    expect(glyph.scale).toBe(0);
    finishAll();
    expect(glyph.scale).toBe(1);
  });
});

describe("pulse", () => {
  it("under reduced motion holds full opacity", () => {
    const ring = { opacity: 0.45 };
    pulse(ring, 1.6, { reduce: true });
    expect(ring.opacity).toBe(1);
  });

  it("with motion starts dim and cleanup hands the target back as it was", () => {
    const ring = { opacity: 1 };
    const cleanup = pulse(ring, 1.8, { reduce: false });
    expect(ring.opacity).toBe(0.45);
    cleanup();
    expect(ring.opacity).toBe(1);
  });
});
