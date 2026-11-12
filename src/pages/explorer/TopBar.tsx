import { useEffect, useRef, type ReactNode } from "react";

import { Icon } from "@/features/case-panel/icons";
import { HazardIcon } from "@/features/cases/HazardIcon";
import type { IconId } from "@/features/cases/cases";
import { Link } from "@/lib/Link";
import { VERSION } from "@/pages/explorer/StartCard";
import { PlaceSearch } from "@/features/search/PlaceSearch";
import type { Place } from "@/features/search/placesApi";
import { BrandMark } from "@/lib/BrandMark";

export type ContextChip = { icon: IconId; name: string; when: string };

export type DownloadItem = {
  id: "png" | "json" | "csv" | "pdf";
  label: string;
  sub: string;
  // Why the item can't be used right now; undefined when it can.
  disabledWhy: string | undefined;
  onPick: () => void;
};

type TopBarProps = {
  context: ContextChip | undefined;
  // The area tools sit between the mode switch and the page links.
  tools: ReactNode;
  helpOpen: boolean;
  downloadOpen: boolean;
  searchOpen: boolean;
  downloads: DownloadItem[];
  story: boolean;
  showReal: boolean;
  reduceMotion: boolean;
  onHelp: (open: boolean) => void;
  onDownload: (open: boolean) => void;
  onSearch: (open: boolean) => void;
  onPickPlace: (place: Place) => void;
  onStory: (on: boolean) => void;
  onReplayTour: () => void;
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
  tools,
  helpOpen,
  downloadOpen,
  searchOpen,
  downloads,
  story,
  showReal,
  reduceMotion,
  onHelp,
  onDownload,
  onSearch,
  onPickPlace,
  onStory,
  onReplayTour,
  onShowReal,
  onReduceMotion,
  onWholeGlobe,
}: TopBarProps) => {
  const helpRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // A click anywhere outside a menu closes it, like any popover.
  useEffect(() => {
    if (!helpOpen && !downloadOpen && !searchOpen) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (helpOpen && !helpRef.current?.contains(target)) onHelp(false);
      if (downloadOpen && !downloadRef.current?.contains(target)) onDownload(false);
      if (searchOpen && !searchRef.current?.contains(target)) onSearch(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [helpOpen, downloadOpen, searchOpen, onHelp, onDownload, onSearch]);

  return (
    <header className="x-top">
      <Link to="/" className="x-pill x-pill--mark">
        <BrandMark />
        NISAR Hazard Watch
      </Link>
      {context !== undefined && !story && (
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
          aria-pressed={story}
          onClick={() => onStory(true)}
          data-testid="mode-tour"
        >
          Guided tour
        </button>
        <button
          type="button"
          aria-pressed={!story}
          onClick={() => onStory(false)}
          data-testid="mode-explore"
        >
          Explore
        </button>
      </div>
      <span className="x-top__fill" />
      {tools}
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
      <div className="x-help" ref={searchRef}>
        <button
          type="button"
          className="x-icon-button"
          onClick={() => onSearch(!searchOpen)}
          aria-label="Search a place"
          title="Search a place"
          aria-expanded={searchOpen}
          data-testid="search-button"
        >
          <Icon name="search" size={18} />
        </button>
        {searchOpen && (
          <div
            className="x-menu x-menu--search"
            role="dialog"
            aria-label="Search a place"
            data-testid="search-menu"
          >
            <PlaceSearch onPick={onPickPlace} />
          </div>
        )}
      </div>
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
            <button
              type="button"
              role="menuitem"
              className="x-menu__item"
              onClick={onReplayTour}
              data-testid="replay-tour"
            >
              Replay the quick tour
              <span>Four steps: cases, panel, layers, timeline</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="x-menu__item x-menu__story"
              onClick={() => onStory(true)}
            >
              Watch the 1-minute story
              <span>Chenab flood, Pakistan · six chapters</span>
            </button>
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
              <kbd>Esc</kbd> closes · <kbd>Tab</kbd> moves through the panel · <kbd>← →</kbd>{" "}
              chapters in the story
            </p>
            <p className="x-menu__foot">
              <span>Nova Frontier</span>
              <span>{VERSION}</span>
            </p>
          </div>
        )}
      </div>
      <div className="x-help" ref={downloadRef}>
        <button
          type="button"
          className="x-icon-button"
          onClick={() => onDownload(!downloadOpen)}
          aria-label="Download"
          title="Download"
          aria-expanded={downloadOpen}
          data-testid="download-button"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
          </svg>
        </button>
        {downloadOpen && (
          <div
            className="x-menu x-menu--download"
            role="menu"
            aria-label="Download"
            data-testid="download-menu"
          >
            <p className="x-kicker">Download</p>
            {downloads.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className="x-menu__item"
                aria-disabled={item.disabledWhy !== undefined}
                onClick={() => item.disabledWhy === undefined && item.onPick()}
                data-testid={`download-${item.id}`}
              >
                {item.label}
                <span>{item.disabledWhy ?? item.sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        className="x-icon-button x-top__fullscreen"
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
