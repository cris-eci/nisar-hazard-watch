import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/apiClient";
import { placeSearchMessage, searchPlaces } from "@/features/search/placesApi";

const QADIRABAD = {
  id: "n4295615569",
  name: "Qadirabad",
  displayName:
    "Qadirabad, Phalia Tehsil, Mandi Bahauddin District, Gujrat Division, Punjab, Pakistan",
  kind: "town",
  point: [73.5025289, 32.297263],
  bbox: [73.4625289, 32.257263, 73.5425289, 32.337263],
  importance: 0.16,
};

const stubFetch = (body: unknown, status = 200) => {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => vi.unstubAllGlobals());

describe("searchPlaces", () => {
  it("asks the backend once with the text and the limit and returns the places", async () => {
    const fetchMock = stubFetch({
      places: [QADIRABAD, { ...QADIRABAD, id: "n1", bbox: null }],
      attribution: "© OpenStreetMap contributors",
    });
    const results = await searchPlaces("Qadirabad", new AbortController().signal);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/places?q=Qadirabad&limit=6",
      expect.objectContaining({ method: "GET" }),
    );
    expect(results.places).toHaveLength(2);
    expect(results.places[0]?.point).toEqual([73.5025289, 32.297263]);
    expect(results.places[1]?.bbox).toBeNull();
    expect(results.attribution).toBe("© OpenStreetMap contributors");
  });

  it("rejects a place whose point is not a pair of numbers", async () => {
    stubFetch({ places: [{ ...QADIRABAD, point: ["a", "b"] }], attribution: "x" });
    await expect(searchPlaces("Qadirabad", new AbortController().signal)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});

describe("placeSearchMessage", () => {
  it.each([
    [new ApiError(429, "RATE_LIMITED", "slow"), "Too many searches. Try again in a minute."],
    [new ApiError(503, "QUEUE_FULL", "busy"), "Place search is busy. Try again in a few seconds."],
    [
      new ApiError(502, "UPSTREAM_GEOCODER_ERROR", "down"),
      "We couldn't reach the place search. The globe still works.",
    ],
    [new Error("anything"), "We couldn't reach the place search. The globe still works."],
  ])("says what happened for %o", (error, message) => {
    expect(placeSearchMessage(error)).toBe(message);
  });
});
