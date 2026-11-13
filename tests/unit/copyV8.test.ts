import { describe, expect, it } from "vitest";

import * as copy from "@/content/copyV8";
import { cellsOf, formatCount, LENS_COPY, passOf } from "@/content/copyV8";
import { LIVE_LENSES } from "@/features/explore/exploreApi";

// COPY-v8 "Never": a flood probability, flooded hectares, "disaster", "alert", centimetres.
const NEVER = /probab|hectare|disaster|alert|centimet|\bcm\b/i;

// A denial, not a claim: the known coherence case says it shows no centimetres (COPY-v8 §1).
const ALLOWED = new Set([
  "No lens for ground motion. Coherence is not displacement, so no centimetres are shown.",
]);

// Every visible string in the module, templates filled with a placeholder value.
const strings = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (typeof value === "function")
    return strings((value as (...args: unknown[]) => unknown)("1", "1", "1", "1", "1", "1", "1"));
  if (Array.isArray(value)) return value.flatMap(strings);
  if (typeof value === "object" && value !== null) return Object.values(value).flatMap(strings);
  return [];
};

describe("LENS_COPY", () => {
  it("has the flood lens verbatim", () => {
    expect(LENS_COPY.flood_wetland).toEqual({
      label: "Flood & wetland",
      question: "Did water appear here?",
      rule: "HH ≤ −3 dB and HV ≤ −1.5 dB vs this spot's baseline",
    });
  });

  it("covers the live lenses except ground motion", () => {
    expect(Object.keys(LENS_COPY).sort()).toEqual(
      LIVE_LENSES.filter((lens) => lens !== "insar").sort(),
    );
  });
});

describe("templates", () => {
  it("writes the pass counter", () => {
    expect(passOf(2, 5)).toBe("PASS 2 OF 5");
  });

  it("writes cell counts in en-US", () => {
    expect(cellsOf(5513, 16384)).toBe("5,513 of 16,384 cells");
    expect(formatCount(1234567)).toBe("1,234,567");
  });
});

describe("Never words", () => {
  const all = strings(copy);

  it("walks a real amount of copy", () => {
    expect(all.length).toBeGreaterThan(150);
  });

  it("no string says what the radar can't", () => {
    expect(all.filter((text) => NEVER.test(text) && !ALLOWED.has(text))).toEqual([]);
  });

  it("the allowed denial is still in the copy", () => {
    expect(all.filter((text) => ALLOWED.has(text))).toHaveLength(1);
  });
});
