// Runs work once the browser is idle after the first paint (Safari has no requestIdleCallback).
// Returns a cancel function for effect cleanups.
export const whenIdle = (work: () => void): (() => void) => {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(work, { timeout: 2000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(work, 200);
  return () => clearTimeout(id);
};
