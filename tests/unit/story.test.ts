import { describe, expect, it } from "vitest";

import { caseSubject } from "@/features/case-panel/subject";
import { CASES, findCase, type Case } from "@/features/cases/cases";
import { stripLines, STRIP_BRAND } from "@/features/downloads/globeImage";
import {
  CSV_COLUMNS,
  timelineCsv,
  timelineJson,
  timelineRows,
} from "@/features/downloads/timelineExport";
import { viewInsets } from "@/features/globe/framing";
import { NO_IMPACT, novaAnswer, suggestionsFor } from "@/features/nova/novaAnswer";
import { CHAPTERS, chapterCount, clampChapter, storyCase } from "@/features/story/chapters";
import { reportSummary, SUMMARY_LABEL } from "@/pages/report/reportSummary";

const caseOf = (id: string): Case => {
  const item = findCase(id);
  if (item === undefined) throw new Error(`missing case ${id}`);
  return item;
};

const qadirabad = caseOf("qadirabad");
const choco = caseOf("choco");
const ready = { subject: caseSubject(qadirabad), pending: undefined, running: false };
const empty = { subject: undefined, pending: undefined, running: false };

describe("guided story", () => {
  it("tells the Qadirabad flood in six chapters", () => {
    expect(storyCase()?.id).toBe("qadirabad");
    expect(CHAPTERS).toHaveLength(6);
    expect(chapterCount(0)).toBe("Chapter 1 of 6 · Chenab flood, Pakistan");
    expect(CHAPTERS.map((chapter) => chapter.view)).toEqual([
      "region",
      "chip",
      "drape",
      "drape",
      "drape",
      "chip",
    ]);
  });

  it("keeps the chapter index inside the story", () => {
    expect(clampChapter(-1)).toBe(0);
    expect(clampChapter(9)).toBe(5);
  });

  it("frames the chip left of the story card and above the captions", () => {
    expect(viewInsets("story", 1440, 900)).toEqual({ left: 0, right: 488, top: 72, bottom: 220 });
  });

  // The chapter 4 caption rounds the report's shares; it must not drift from them.
  it("quotes the report's shares in chapter 4", () => {
    const rows = qadirabad.groups?.[0]?.rows ?? [];
    const pct = rows.map((row) => Math.round((row.k / row.n) * 100));
    expect(pct).toEqual([64, 17, 1]);
    expect(CHAPTERS[3]?.caption).toContain("64%");
    expect(CHAPTERS[3]?.caption).toContain("17%");
  });
});

describe("Nova (rule-based)", () => {
  it("never answers impact questions with numbers", () => {
    for (const context of [empty, ready])
      expect(novaAnswer("How many people were affected?", { ...context, mode: "plain" })).toEqual({
        kind: "nodata",
        text: NO_IMPACT,
      });
  });

  it("says where demo values are when asked if the data is real", () => {
    const reply = novaAnswer("Is this data real?", { ...ready, mode: "plain" });
    expect(reply.kind).toBe("answer");
    if (reply.kind !== "answer") return;
    expect(reply.text).toContain("published report");
    expect(reply.text).toContain("DEMO chip");
    expect(reply.cites.length).toBeGreaterThan(0);
    expect(reply.cites.length).toBeLessThanOrEqual(2);
  });

  it("explains grey and white the same way everywhere", () => {
    const reply = novaAnswer("Why grey on the map?", { ...empty, mode: "plain" });
    expect(reply.kind === "answer" && reply.text).toContain("Grey means there was no measurement");
  });

  it("gives the plain limit, or adds the technical one", () => {
    const plain = novaAnswer("What can't it tell me?", { ...ready, mode: "plain" });
    const tech = novaAnswer("What can't it tell me?", { ...ready, mode: "technical" });
    expect(plain.kind === "answer" && plain.text).toBe(qadirabad.plainLimit);
    expect(tech.kind === "answer" && tech.text).toContain(qadirabad.techLimit);
  });

  it("summarises the verdict with the case's own stat", () => {
    const plain = novaAnswer("What does this mean?", { ...ready, mode: "plain" });
    expect(plain.kind === "answer" && plain.text).toContain("Changed beyond its normal range");
    expect(plain.kind === "answer" && plain.text).toContain("64.3% vs 1.0%");
    const tech = novaAnswer("What does this mean?", { ...ready, mode: "technical" });
    expect(tech.kind === "answer" && tech.text).toContain("observed_departure");
  });

  it("has no result to explain while a job runs, and none for a pending case", () => {
    expect(
      novaAnswer("What does this mean?", { ...empty, running: true, mode: "plain" }).kind,
    ).toBe("nodata");
    const pending = novaAnswer("What does this mean?", { ...empty, pending: choco, mode: "plain" });
    expect(pending.kind === "answer" && pending.text).toContain("No measurement yet");
  });

  it("suggests starting questions without a selection", () => {
    expect(suggestionsFor(false)).toContain("How many people were affected?");
    expect(suggestionsFor(true)).toContain("Is this data real?");
  });
});

describe("timeline downloads", () => {
  it("flags every pass as demo and planned passes as not measured", () => {
    const rows = timelineRows(qadirabad);
    expect(rows).toHaveLength(qadirabad.timeline?.passes.length ?? 0);
    expect(rows.every((row) => row.demo)).toBe(true);
    expect(rows.filter((row) => row.role === "planned").every((row) => !row.measured)).toBe(true);
    expect(rows.find((row) => row.role === "target")).toMatchObject({
      date: "2026-07-26",
      cells_outside_range_pct: 11.2,
    });
    expect(rows[0]?.cells_outside_range_pct).toBeNull();
  });

  it("writes a CSV with a source comment, the header and one line per pass", () => {
    const lines = timelineCsv(qadirabad).trim().split("\n");
    expect(lines[0]).toMatch(/^# .*DEMO/);
    expect(lines[1]).toBe(CSV_COLUMNS.join(","));
    expect(lines[1]).toBe("case,lens,date,role,cells_outside_range_pct,measured,demo");
    expect(lines[2]).toBe("qadirabad,flood_wetland,2026-06-20,baseline,,true,true");
    expect(lines).toHaveLength(2 + (qadirabad.timeline?.passes.length ?? 0));
  });

  it("writes JSON with its source and the same rows", () => {
    const parsed = JSON.parse(timelineJson(qadirabad)) as { source: string; passes: unknown[] };
    expect(parsed.source).toContain("DEMO");
    expect(parsed.passes).toEqual(timelineRows(qadirabad));
  });

  it("has nothing to export for a case without a timeline", () => {
    expect(timelineRows(choco)).toEqual([]);
  });
});

describe("globe PNG strip", () => {
  it("names the place, question, dates and the brand", () => {
    const lines = stripLines({
      title: "Qadirabad, Chenab River, Pakistan",
      question: "Did it flood?",
      dates: "Target pass 26 Jul 2026",
      legend: undefined,
      demo: false,
    });
    expect(lines).toEqual([
      "Qadirabad, Chenab River, Pakistan",
      "Did it flood? · Target pass 26 Jul 2026",
      "",
      STRIP_BRAND,
    ]);
  });
});

describe("report summary (template)", () => {
  it("is labelled as a template, not AI", () => {
    expect(SUMMARY_LABEL).toBe("Summary · written from the data above (template)");
  });

  it("only uses the case's own fields", () => {
    const text = reportSummary(qadirabad);
    expect(text).toContain("Qadirabad (Chenab River, Pakistan)");
    expect(text).toContain("Did it flood?");
    expect(text).toContain("64.3% vs 1.0%");
    expect(text).toContain(qadirabad.plainLimit);
  });

  it("says no area when a case has no processed chip", () => {
    const kumamoto = caseOf("kumamoto");
    expect(reportSummary(kumamoto)).toContain("Across the area, 3 cells");
  });

  it("skips the stat for every case still pending", () => {
    for (const item of CASES.filter((entry) => entry.pending === true))
      expect(reportSummary(item)).not.toContain(item.stat);
  });
});
