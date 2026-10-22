import { useCallback, useEffect, useState } from "react";

export type AsyncState<T> =
  { status: "loading" } | { status: "success"; data: T } | { status: "error"; error: Error };

// Runs `load` whenever `key` changes and aborts the previous run.
// Pass key = undefined to stay idle (returns undefined).
export const useAsync = <T>(
  load: (signal: AbortSignal) => Promise<T>,
  key: string | undefined,
): { state: AsyncState<T> | undefined; retry: () => void } => {
  const [state, setState] = useState<AsyncState<T>>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (key === undefined) {
      setState(undefined);
      return;
    }
    const controller = new AbortController();
    setState({ status: "loading" });
    load(controller.signal)
      .then((data) => setState({ status: "success", data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });
    return () => controller.abort();
    // `load` is intentionally not a dependency: callers pass inline closures keyed by `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
};
