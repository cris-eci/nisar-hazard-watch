import { describe, expect, it } from "vitest";

import { TEAM } from "@/content/team";

// Every file under public/team, as Vite sees it ("/public/team/x.png").
const SHIPPED = new Set(Object.keys(import.meta.glob("/public/team/*")));

describe("team", () => {
  it("links every member to a GitHub and a LinkedIn profile", () => {
    for (const member of TEAM) {
      expect(member.github, member.name).toMatch(/^https:\/\/github\.com\/[\w-]+$/);
      expect(member.linkedin, member.name).toMatch(
        /^https:\/\/www\.linkedin\.com\/in\/[\w%-]+\/?$/,
      );
    }
  });

  it("points every photo at a file that ships with the app", () => {
    for (const member of TEAM) {
      if (member.photo === undefined) continue;
      expect(SHIPPED.has(`/public${member.photo}`), member.name).toBe(true);
    }
  });
});
