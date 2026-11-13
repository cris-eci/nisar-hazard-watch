import { useEffect, useState } from "react";

// A clock for timers that count between server answers; stays still while `active` is false.
export const useNow = (active: boolean, intervalMs = 250): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [active, intervalMs]);
  return now;
};
