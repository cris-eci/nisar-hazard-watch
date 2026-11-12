import real from "../fixtures/exploration-qadirabad.json";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { followExploration, type ExplorationState } from "@/features/explore/useExploration";
import { ApiError } from "@/lib/api/apiClient";

const REAL = real as Record<string, unknown>;

const view = (status: string, extra: object = {}) => ({
  ...REAL,
  status,
  ...(status === "succeeded" ? {} : { result: null }),
  ...extra,
});

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status });

const problem = (status: number, reasonCode: string): Response =>
  json({ detail: "x", reasonCode }, status);

// Answers the calls in order; each entry is a body (200), a Response or an Error.
const script = (...steps: Array<Response | Error>) => {
  const calls = steps.slice();
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => {
    const next = calls.shift();
    if (next === undefined) throw new Error("unexpected extra call");
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const run = async (signal = new AbortController().signal) => {
  const published: ExplorationState[] = [];
  const ids: string[] = [];
  const done = followExploration({
    request: {
      lens: "flood_wetland",
      geometry: { type: "Point", coordinates: [73.7, 32.3] },
      source: "L",
    },
    signal,
    publish: (state) => published.push(state),
    onId: (id) => ids.push(id),
    pollMs: 1000,
  });
  return { published, ids, done };
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("followExploration", () => {
  it("starts, polls once a second and ends on the final answer", async () => {
    const fetchMock = script(
      json(view("queued"), 202),
      json(view("running")),
      json(view("succeeded")),
    );
    const { published, ids, done } = await run();

    await vi.advanceTimersByTimeAsync(2000);
    await done;

    expect(published.map((state) => state.phase)).toEqual([
      "starting",
      "running",
      "running",
      "done",
    ]);
    expect(ids).toEqual([REAL["id"]]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "POST" });
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(`/explorations/${String(REAL["id"])}`);
  });

  it("returns at once when the answer is already final (a cache hit)", async () => {
    const fetchMock = script(json(view("succeeded")));
    const { published, done } = await run();

    await done;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(published.at(-1)?.phase).toBe("done");
  });

  it("rides out two failed polls and keeps going", async () => {
    script(
      json(view("running"), 202),
      new TypeError("Failed to fetch"),
      problem(502, "UPSTREAM_ML_ERROR"),
      json(view("succeeded")),
    );
    const { published, done } = await run();

    await vi.advanceTimersByTimeAsync(3000);
    await done;

    expect(published.at(-1)?.phase).toBe("done");
  });

  it("reports the third failed poll in a row", async () => {
    script(
      json(view("running"), 202),
      problem(503, "QUEUE_FULL"),
      problem(503, "QUEUE_FULL"),
      problem(503, "QUEUE_FULL"),
    );
    const { done } = await run();
    const outcome = done.catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(3000);

    await expect(outcome).resolves.toMatchObject({ status: 503, reasonCode: "QUEUE_FULL" });
  });

  it("gives up at once on an answer that will not change", async () => {
    script(json(view("running"), 202), problem(404, "NOT_FOUND"));
    const { done } = await run();
    const outcome = done.catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(1000);

    await expect(outcome).resolves.toBeInstanceOf(ApiError);
  });

  it("surfaces a refusal to start, such as a full queue, without polling", async () => {
    const fetchMock = script(problem(503, "QUEUE_FULL"));
    const { done } = await run();

    await expect(done).rejects.toMatchObject({ reasonCode: "QUEUE_FULL" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops polling when the run is aborted", async () => {
    const controller = new AbortController();
    const fetchMock = script(json(view("running"), 202), json(view("running")));
    const { done } = await run(controller.signal);
    const outcome = done.catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(500);
    controller.abort();
    await vi.advanceTimersByTimeAsync(5000);

    await expect(outcome).resolves.toBeInstanceOf(DOMException);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
