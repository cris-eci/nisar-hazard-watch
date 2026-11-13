import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ApiError, apiRequest, apiUrl, BAD_RESPONSE, NETWORK_ERROR } from "@/lib/api/apiClient";

const schema = z.object({ ok: z.boolean() });

const answer = (status: number, body: unknown): Response =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

const stubFetch = (response: Response | Error) => {
  const fetchMock = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => vi.unstubAllGlobals());

describe("apiUrl", () => {
  it("prefixes the path with the API version and drops undefined query values", () => {
    expect(apiUrl("/places", { q: "Río Cauca", limit: 6, skipped: undefined })).toBe(
      "/api/v1/places?q=R%C3%ADo+Cauca&limit=6",
    );
  });

  it("adds no question mark without a query", () => {
    expect(apiUrl("/lenses")).toBe("/api/v1/lenses");
  });
});

describe("apiRequest", () => {
  it("returns the answer when it matches the schema", async () => {
    stubFetch(answer(200, { ok: true }));
    await expect(apiRequest("/x", schema)).resolves.toEqual({ ok: true });
  });

  it("sends a JSON body and its content type", async () => {
    const fetchMock = stubFetch(answer(200, { ok: true }));
    await apiRequest("/x", schema, { method: "POST", body: { lens: "wildfire" } });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/x",
      expect.objectContaining({
        method: "POST",
        body: '{"lens":"wildfire"}',
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("turns a problem+json answer into an ApiError with its reason code", async () => {
    stubFetch(
      answer(503, {
        title: "Analysis capacity is full",
        detail: "5 explorations are running",
        reasonCode: "QUEUE_FULL",
        requestId: "abc",
      }),
    );
    const error = await apiRequest("/x", schema).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 503,
      reasonCode: "QUEUE_FULL",
      message: "5 explorations are running",
      requestId: "abc",
    });
  });

  it("falls back to the HTTP status when the error body is not a problem", async () => {
    stubFetch(answer(500, "<html>boom</html>"));
    const error = await apiRequest("/x", schema).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ status: 500, reasonCode: "HTTP_500" });
  });

  it("rejects an answer that drifts from the schema", async () => {
    stubFetch(answer(200, { ok: "yes" }));
    await expect(apiRequest("/x", schema)).rejects.toMatchObject({ reasonCode: BAD_RESPONSE });
  });

  it("reports an unreachable server as a network error", async () => {
    stubFetch(new TypeError("Failed to fetch"));
    await expect(apiRequest("/x", schema)).rejects.toMatchObject({
      status: 0,
      reasonCode: NETWORK_ERROR,
    });
  });

  it("lets an abort through untouched so callers can ignore it", async () => {
    const controller = new AbortController();
    controller.abort();
    const abort = new DOMException("aborted", "AbortError");
    stubFetch(abort);
    await expect(apiRequest("/x", schema, { signal: controller.signal })).rejects.toBe(abort);
  });
});
