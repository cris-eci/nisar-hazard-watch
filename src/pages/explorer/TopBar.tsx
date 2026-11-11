import { useEffect, useRef } from "react";

import { Icon } from "@/features/case-panel/icons";
import { HazardIcon } from "@/features/cases/HazardIcon";
import type { IconId } from "@/features/cases/cases";
import { Link } from "@/lib/Link";
import { VERSION } from "@/pages/explorer/StartCard";

export type ContextChip = { icon: IconId; name: string; when: string };

type TopBarProps = {
  context: ContextChip | undefined;
  helpOpen: boolean;
  showReal: boolean;
  reduceMotion: boolean;
  onHelp: (open: boolean) => void;
  onShowReal: (on: boolean) => void;
  onReduceMotion: (on: boolean) => void;
  onWholeGlobe: () => void;
};

const toggleFullScreen = () => {
  if (document.fullscreenElement !== null) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.();
};

export const TopBar = ({
  context,
  helpOpen,
  showReal,
  reduceMotion,
  onHelp,
  onShowReal,
  onReduceMotion,
  onWholeGlobe,
}: TopBarProps) => {
  const helpRef = useRef<HTMLDivElement>(null);

  // A click anywhere outside the menu closes it, like any popover.
  useEffect(() => {
    if (!helpOpen) return;
    const close = (event: PointerEvent) => {
      if (!helpRef.current?.contains(event.target as Node)) onHelp(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [helpOpen, onHelp]);

  return (
    <header className="x-top">
      <Link to="/" className="x-pill x-pill--mark">
        NISAR Hazard Watch
      </Link>
      {context !== undefined && (
        <span className="x-pill x-context" data-testid="context-chip">
          <span className="x-context__icon">
            <HazardIcon id={context.icon} size={14} />
          </span>
          {context.name}
          <span className="x-context__when">{context.when}</span>
        </span>
      )}
      <span className="x-top__fill" />
      <div role="group" aria-label="Mode" className="x-mode">
        <button
          type="button"
          aria-pressed="false"
          disabled
          title="Coming next"
          data-testid="mode-tour"
        >
          Guided tour
        </button>
        <button type="button" aria-pressed="true" data-testid="mode-explore">
          Explore
        </button>
      </div>
      <span className="x-top__fill" />
      <Link to="/cases" className="x-pill x-top__nav" testId="nav-cases">
        Cases
      </Link>
      <Link to="/method" className="x-pill x-top__nav" testId="nav-method">
        Method
      </Link>
      <button
        type="button"
        className="x-icon-button"
        onClick={onWholeGlobe}
        aria-label="Whole globe"
        title="Whole globe"
        data-testid="whole-globe"
      >
        <Icon name="globe" size={18} />
      </button>
      <div className="x-help" ref={helpRef}>
        <button
          type="button"
          className="x-icon-button"
          onClick={() => onHelp(!helpOpen)}
          aria-label="Help"
          title="Help"
          aria-expanded={helpOpen}
          data-testid="help-button"
        >
          <Icon name="help" size={18} />
        </button>
        {helpOpen && (
          <div className="x-menu" role="menu" aria-label="Help" data-testid="help-menu">
            <nav className="x-menu__nav" aria-label="Pages">
              <Link to="/cases">Cases</Link>
              <Link to="/method">Method</Link>
            </nav>
            <Switch
              label="Show REAL labels (DEMO always shows)"
              on={showReal}
              onChange={onShowReal}
              testId="toggle-real"
            />
            <Switch
              label="Reduce motion"
              on={reduceMotion}
              onChange={onReduceMotion}
              testId="toggle-motion"
            />
            <p className="x-menu__keys">
              <kbd>Esc</kbd> closes · <kbd>Tab</kbd> moves through the panel
            </p>
            <p className="x-menu__foot">
              <span>Nova Frontier</span>
              <span>{VERSION}</span>
            </p>
          </div>
        )}
      </div>
      <button
        type="button"
        className="x-icon-button"
        onClick={toggleFullScreen}
        aria-label="Full screen"
        title="Full screen"
      >
        <Icon name="fullscreen" size={18} />
      </button>
    </header>
  );
};

type SwitchProps = { label: string; on: boolean; onChange: (on: boolean) => void; testId: string };

const Switch = ({ label, on, onChange, testId }: SwitchProps) => (
  <button
    type="button"
    role="menuitemcheckbox"
    aria-checked={on}
    className="x-menu__switch"
    onClick={() => onChange(!on)}
    data-testid={testId}
  >
    <span>{label}</span>
    <span className="x-toggle" aria-hidden="true" />
  </button>
);
