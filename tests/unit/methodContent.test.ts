import { describe, expect, it } from "vitest";

import { formatPercent, percent } from "@/features/cases/cases";
import {
  BENCH,
  BENCH_MAX_DB,
  EVIDENCE,
  formatSignedDb,
  INTERVAL_DOMAIN,
  toPercent,
} from "@/pages/method/methodContent";

const shares = (id: string): string[] =>
  EVIDENCE.find((item) => item.id === id)?.group?.rows.map((row) =>
    formatPercent(percent(row.k, row.n)),
  ) ?? [];

describe("toPercent", () => {
  it("places a value on a fixed axis and clamps it to the track", () => {
    expect(toPercent(0, [-3.5, 1.5])).toBe(70);
    expect(toPercent(-5, [-3.5, 1.5])).toBe(0);
    expect(toPercent(3, [-3.5, 1.5])).toBe(100);
    expect(toPercent(1, [2, 2])).toBe(0);
  });
});

describe("formatSignedDb", () => {
  it("uses a real minus sign and keeps two decimals", () => {
    expect(formatSignedDb(-1.34)).toBe("−1.34");
    expect(formatSignedDb(0.17)).toBe("+0.17");
    expect(formatSignedDb(0)).toBe("0.00");
  });
});

describe("Method evidence", () => {
  // The counts must reproduce the shares quoted in FLOOD_EVIDENCE.md.
  it("derives the reported Matam and Barh shares from their cell counts", () => {
    expect(shares("matam")).toEqual(["17.8%", "1.1%"]);
    expect(shares("barh")).toEqual(["87.5%", "32.6%"]);
  });

  it("keeps both Timber Fire intervals across zero and inside the drawn axis", () => {
    const timber = EVIDENCE.find((item) => item.id === "timber")?.intervals ?? [];
    expect(timber).toHaveLength(2);
    for (const { low, high, value } of timber) {
      expect(low).toBeLessThan(0);
      expect(high).toBeGreaterThan(0);
      expect(low).toBeGreaterThanOrEqual(INTERVAL_DOMAIN[0]);
      expect(high).toBeLessThanOrEqual(INTERVAL_DOMAIN[1]);
      expect(value).toBeGreaterThanOrEqual(low);
      expect(value).toBeLessThanOrEqual(high);
    }
  });

  it("fits every benchmark error on the shared dB axis", () => {
    const all = BENCH.flatMap((region) => region.rmse);
    expect(all.every((value) => value > 0 && value <= BENCH_MAX_DB)).toBe(true);
  });
});
