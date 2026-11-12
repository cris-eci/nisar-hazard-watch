/*
 * The next pass the Observation Plan promises: the earliest date strictly after today. The plan
 * gives no order guarantee, so every date is checked instead of trusting the first one after today.
 * A pass dated today isn't "next": it may already have been acquired. Dates are YYYY-MM-DD, so
 * string order is date order. Idea from PR #1 by Katheryn Guasca.
 */
export const nextPlannedPass = <T extends { date: string }>(
  acquisitions: readonly T[],
  today: string,
): T | undefined =>
  acquisitions.reduce<T | undefined>(
    (next, item) =>
      item.date > today && (next === undefined || item.date < next.date) ? item : next,
    undefined,
  );
