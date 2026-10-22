import { useEffect, useRef, useState } from "react";

import { NISAR_FACTS } from "@/content/facts";

const DISMISSED_KEY = "nisar-watch:welcome-dismissed";

// localStorage can throw (private mode, blocked storage); the dialog then simply shows again.
const wasDismissed = (): boolean => {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
};

const rememberDismissal = (): void => {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Not critical: worst case the welcome shows on the next visit.
  }
};

type WelcomeDialogProps = { appName: string; onStartTour: () => void };

export const WelcomeDialog = ({ appName, onStartTour }: WelcomeDialogProps) => {
  const [isOpen, setIsOpen] = useState(() => !wasDismissed());
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) dialogRef.current?.showModal();
  }, [isOpen]);

  const close = () => {
    if (dontShowAgain) rememberDismissal();
    dialogRef.current?.close();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      data-testid="welcome-dialog"
      aria-labelledby="welcome-title"
      onCancel={close}
      className="m-auto max-w-xl overscroll-contain rounded-2xl border border-white/10 bg-slate-950 p-8 text-slate-100 shadow-2xl backdrop:bg-black/60"
    >
      <h2 id="welcome-title" className="text-2xl">
        Welcome to {appName}
      </h2>
      <h3 className="mt-5 text-sm text-slate-400 uppercase">Did you know?</h3>
      <p className="mt-1 text-slate-300">
        {NISAR_FACTS[1]} {NISAR_FACTS[2]}
      </p>
      <h3 className="mt-5 text-sm text-slate-400 uppercase">How to explore</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-300">
        <li>Hover the globe to find a NISAR radar frame; click it to analyse it.</li>
        <li>Or start from a featured event: real earthquakes with real NISAR pairs.</li>
        <li>Scroll or pinch to zoom, drag to rotate, Esc to zoom back out.</li>
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          data-testid="welcome-tour"
          onClick={() => {
            close();
            onStartTour();
          }}
          className="rounded-lg bg-sky-500 px-4 py-2 text-slate-950 hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          Start with a featured event
        </button>
        <button
          type="button"
          data-testid="welcome-explore"
          onClick={close}
          className="rounded-lg border border-white/20 px-4 py-2 hover:border-white/40 focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          Explore the globe
        </button>
      </div>
      <label className="mt-5 flex items-center gap-2 text-sm text-slate-400">
        <input
          type="checkbox"
          checked={dontShowAgain}
          onChange={(e) => setDontShowAgain(e.target.checked)}
        />
        Don&apos;t show this again
      </label>
    </dialog>
  );
};
