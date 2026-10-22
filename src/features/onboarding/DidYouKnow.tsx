import { useState } from "react";

import { NISAR_FACTS } from "@/content/facts";

export const DidYouKnow = () => {
  const [index, setIndex] = useState<number>();
  const fact = index === undefined ? undefined : NISAR_FACTS[index];

  return (
    <div className="absolute right-4 bottom-8 flex max-w-sm flex-col items-end gap-2">
      {fact !== undefined && (
        <div
          data-testid="fact-card"
          role="status"
          className="rounded-xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-200 shadow-xl backdrop-blur"
        >
          <p>{fact}</p>
          <div className="mt-2 flex justify-end gap-3 text-xs">
            <button
              type="button"
              onClick={() => setIndex(((index ?? 0) + 1) % NISAR_FACTS.length)}
              className="text-sky-300 hover:underline"
            >
              Next fact
            </button>
            <button type="button" onClick={() => setIndex(undefined)} className="text-slate-400">
              Close
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        data-testid="did-you-know"
        onClick={() => setIndex(index === undefined ? 0 : undefined)}
        className="rounded-full border border-white/10 bg-slate-950/85 px-4 py-2 text-sm text-slate-100 shadow-lg backdrop-blur hover:border-white/30 focus-visible:outline-2 focus-visible:outline-sky-400"
      >
        Did you know?
      </button>
    </div>
  );
};
