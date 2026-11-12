import { useCallback, useEffect, useRef, useState } from "react";

import {
  cancelExploration,
  getExploration,
  startExploration,
  type ExplorationRequest,
} from "@/features/explore/exploreApi";
import { isFinal, type ExplorationView } from "@/features/explore/exploreSchemas";
import { ApiError, NETWORK_ERROR } from "@/lib/api/apiClient";

export type ExplorationState =
  | { phase: "idle" }
  | { phase: "starting" }
  // `receivedAt` (ms) lets the timer count between polls.
  | { phase: "running"; view: ExplorationView; receivedAt: number }
  | { phase: "done"; view: ExplorationView }
  | { phase: "error"; error: ApiError };

export const POLL_MS = 1000;
const CANCELLED = "CANCELLED";
// A hiccup between polls is ridden out; the third in a row is reported.
const MAX_POLL_FAILURES = 3;
const SERVER_ERROR = 500;
const TOO_MANY_REQUESTS = 429;

export const stateOf = (view: ExplorationView): ExplorationState =>
  isFinal(view.status)
    ? { phase: "done", view }
    : { phase: "running", view, receivedAt: Date.now() };

const toApiError = (error: unknown): ApiError =>
  error instanceof ApiError
    ? error
    : new ApiError(0, NETWORK_ERROR, error instanceof Error ? error.message : String(error));

const isTransient = (error: unknown): boolean =>
  error instanceof ApiError &&
  (error.status === 0 || error.status >= SERVER_ERROR || error.status === TOO_MANY_REQUESTS);

const sleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("aborted", "AbortError"));
      },
      { once: true },
    );
  });

type Follow = {
  request: ExplorationRequest;
  signal: AbortSignal;
  publish: (state: ExplorationState) => void;
  onId: (id: string) => void;
  pollMs?: number;
};

// Starts an exploration and polls it until it is final. Throws on a failure it cannot ride out.
export const followExploration = async ({
  request,
  signal,
  publish,
  onId,
  pollMs = POLL_MS,
}: Follow): Promise<void> => {
  publish({ phase: "starting" });
  let view = await startExploration(request, signal);
  onId(view.id);
  publish(stateOf(view));
  let failures = 0;
  while (!isFinal(view.status)) {
    await sleep(pollMs, signal);
    try {
      view = await getExploration(view.id, signal);
      failures = 0;
      publish(stateOf(view));
    } catch (error) {
      failures += 1;
      if (signal.aborted || failures >= MAX_POLL_FAILURES || !isTransient(error)) throw error;
    }
  }
};

type Exploration = { state: ExplorationState; cancel: () => Promise<void>; retry: () => void };

// One exploration per `runKey` (an empty key stays idle); a new key aborts the previous one.
export const useExploration = (
  request: ExplorationRequest | undefined,
  runKey: string,
): Exploration => {
  const [state, setState] = useState<ExplorationState>({ phase: "idle" });
  const [attempt, setAttempt] = useState(0);
  const requestRef = useRef(request);
  const idRef = useRef<string>(undefined);
  const controllerRef = useRef<AbortController>(undefined);
  useEffect(() => {
    requestRef.current = request;
  });

  useEffect(() => {
    const current = requestRef.current;
    if (runKey === "" || current === undefined) {
      setState({ phase: "idle" });
      return;
    }
    idRef.current = undefined;
    const controller = new AbortController();
    controllerRef.current = controller;
    followExploration({
      request: current,
      signal: controller.signal,
      publish: setState,
      onId: (id) => {
        idRef.current = id;
      },
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ phase: "error", error: toApiError(error) });
    });
    return () => controller.abort();
  }, [runKey, attempt]);

  const cancel = useCallback(async () => {
    const id = idRef.current;
    if (id === undefined) {
      // Nothing was started yet: dropping the request is the cancellation.
      controllerRef.current?.abort();
      setState({ phase: "error", error: new ApiError(0, CANCELLED, "Request cancelled") });
      return;
    }
    try {
      setState(stateOf(await cancelExploration(id, new AbortController().signal)));
    } catch (error) {
      setState({ phase: "error", error: toApiError(error) });
    }
  }, []);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  return { state, cancel, retry };
};
