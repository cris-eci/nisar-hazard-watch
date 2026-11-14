import "@/pages/site/site.css";
import "@/features/charts/charts.css";
import "@/pages/explorer/explorer.css";
import "@/pages/explorer/story.css";
import "@/features/lenses/lenses.css";

import type { Viewer } from "cesium";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CasePanel } from "@/features/case-panel/CasePanel";
import { PendingSummary, ResultSummary } from "@/features/case-panel/CaseSummary";
import { ShowRealContext } from "@/features/case-panel/showReal";
import { caseSubject, type Subject } from "@/features/case-panel/subject";
import { VERDICT } from "@/features/case-panel/verdicts";
import { CASES, findCase, findLens, LENSES, type Case, type LensId } from "@/features/cases/cases";
import type { ChartMode } from "@/features/charts/chartTokens";
import { captureGlobe, type GlobeStrip } from "@/features/downloads/globeImage";
import { saveBlob, timelineCsv, timelineJson } from "@/features/downloads/timelineExport";
import type { Frame, LonLat } from "@/features/frames/frame.types";
import { findFrameAt, loadFrames } from "@/features/frames/frames";
import { areaFromParams, areaToParams } from "@/features/geo/areaLink";
import {
  draftOf,
  isDrawing,
  reduceDraw,
  startTool,
  type DrawEvent,
  type DrawState,
} from "@/features/geo/drawMachine";
import type { Area, DrawTool } from "@/features/geo/geo.types";
import { formatKm2, levelOf } from "@/features/geo/limits";
import { boundsOf } from "@/features/geo/longitude";
import { areaKm2Of, centreOf, ringAreaKm2, ringOf } from "@/features/geo/measure";
import { toGeoJson } from "@/features/geo/serialize";
import { ringOfBox, squareAround, squareBounds } from "@/features/geo/square";
import type { Drape } from "@/features/globe/frameEntities";
import { GlobeView, type GlobeScene, type GlobeStamp } from "@/features/globe/GlobeView";
import {
  DIRECTION_CHOICE_READY,
  isLiveLens,
  type Direction,
  type ExplorationRequest,
} from "@/features/explore/exploreApi";
import type { InsarChoice } from "@/features/insar/insarApi";
import { InsarPairPicker } from "@/features/insar/InsarPairPicker";
import { insarFromParams } from "@/features/insar/insarLink";
import { explorationCsv, explorationJson } from "@/features/explore/exploreExport";
import {
  defaultView,
  measuredPasses,
  nextStep,
  playStart,
  shownLayer,
  timeLapseSteps,
  type DockPick,
} from "@/features/explore/exploreDock";
import { liveLayers } from "@/features/explore/exploreLayers";
import type { ExplorationView } from "@/features/explore/exploreSchemas";
import { exploreSubject } from "@/features/explore/exploreSubject";
import { exploreTimeline } from "@/features/explore/exploreTimeline";
import { useExploration } from "@/features/explore/useExploration";
import { JobModal } from "@/features/live/JobModal";
import { formatLonLat, gridMetres, LIVE_CHIP_KM } from "@/features/live/liveQuestion";
import { LiveProblem, LiveProgress } from "@/features/live/LiveStatus";
import { LensPicker, type LensRun } from "@/features/lenses/LensPicker";
import { LensResultCard } from "@/features/lenses/LensResultCard";
import { isCardLens } from "@/features/lenses/lensSlots";
import { PlanState } from "@/features/live/LiveSummary";
import { useFramePlan } from "@/features/live/useFramePlan";
import { NovaChat } from "@/features/nova/NovaChat";
import type { NovaContext } from "@/features/nova/novaAnswer";
import { Onboarding } from "@/features/onboarding/Onboarding";
import {
  hasSeenOnboarding,
  markOnboardingSeen,
  ONBOARDING_STEPS,
} from "@/features/onboarding/onboardingState";
import { MoreInfoSheet } from "@/features/sheet/MoreInfoSheet";
import {
  CHAPTERS,
  LAST_CHAPTER,
  REGION_CENTRE,
  STORY_ADVANCE_MS,
  storyCase,
} from "@/features/story/chapters";
import { coordinatePlace } from "@/features/search/coordinates";
import { placeFraming } from "@/features/search/placeFraming";
import type { Place } from "@/features/search/placesApi";
import { fetchCoverage } from "@/features/spot/coverageApi";
import { nearestCase, squareSideKm } from "@/features/spot/spot";
import { StoryMode } from "@/features/story/StoryMode";
import { PassTimeline } from "@/features/timeline/PassTimeline";
import { formatDay } from "@/features/timeline/timelineLayout";
import { STEP_4, passOf } from "@/content/copyV8";
import { useAsync } from "@/lib/useAsync";
import { AreaGuide, type AreaIssue } from "@/pages/explorer/AreaGuide";
import { AreaTools } from "@/pages/explorer/AreaTools";
import { DirectionSwitch } from "@/pages/explorer/DirectionSwitch";
import { SpotCard } from "@/pages/explorer/SpotCard";
import { LEGEND, type DrapeKind } from "@/pages/explorer/drapeLegend";
import { LayerDock } from "@/pages/explorer/LayerDock";
import { LiveLayerDock } from "@/pages/explorer/LiveLayerDock";
import { SourceSwitch } from "@/pages/explorer/SourceSwitch";
import { HintPill, StartCard } from "@/pages/explorer/StartCard";
import { TopBar, type DownloadItem } from "@/pages/explorer/TopBar";

type Selection =
  | { kind: "case"; item: Case }
  | {
      kind: "live";
      frame: Frame;
      // Where the question is asked: the clicked point, or the centre of a drawn area.
      point: LonLat;
      area: Area;
      lens: LensId;
      // A live question started from a case's lens chips can go back to that case.
      fromCase: Case | undefined;
      // Ground motion measures one pair, chosen first from the picker.
      insar: InsarChoice | undefined;
      run: number;
      // A lens switch on the same area waits in the compact row; the first run of an area gets the modal.
      lensSwitch: boolean;
    };

const DEFAULT_LENS: LensId = "flood_wetland";
const CHIP_ZOOM = 3.2;
// Chocó has no processed square yet, so the camera shows the region around the event instead.
const REGION_KM = 240;
const REGION_ZOOM = 1;
const DEFAULT_OPACITY = 85;
// SPECS-v8 §4: the time-lapse advances one pass every 1.1 s.
const TIME_LAPSE_MS = 1100;
// Chapter 1 shows the Punjab plains around the Chenab (SPECS §5: ~2,600 km altitude).
const STORY_REGION_KM = 900;
const STORY_REGION_SECONDS = 2.2;
const today = new Date().toISOString().slice(0, 10);

const isLens = (value: string | null): value is LensId => LENSES.some((lens) => lens.id === value);

// Shared links: ?case=<id>, ?frame=<track-frame>[&lens=<id>] for a live question on a point,
// ?bbox= or ?geo= (plus &lens=) for a drawn area, ?story=1. Ground motion adds &pair=<id>[&coherence=<0.1-0.9>].
const readParams = () => {
  const params = new URLSearchParams(window.location.search);
  const lens = params.get("lens");
  return {
    item: findCase(params.get("case")),
    frameId: params.get("frame"),
    area: areaFromParams(params),
    lens: isLens(lens) ? lens : DEFAULT_LENS,
    insar: insarFromParams(params),
    story: params.get("story") === "1",
  };
};

const paramsOf = (selection: Selection | undefined, story: boolean): string => {
  if (story) return "story=1";
  if (selection === undefined) return "";
  if (selection.kind === "case") return new URLSearchParams({ case: selection.item.id }).toString();
  const lens = selection.lens !== DEFAULT_LENS && { lens: selection.lens };
  const pair = selection.insar !== undefined && {
    pair: selection.insar.pairId,
    coherence: String(selection.insar.threshold),
  };
  const params = new URLSearchParams({
    ...(areaToParams(selection.area) ?? { frame: selection.frame.id }),
    ...lens,
    ...pair,
  });
  // Commas are legal in a query and keep a shared area readable.
  return params.toString().replaceAll("%2C", ",");
};

const frameUnder = (frames: Frame[], point: LonLat): Frame | undefined =>
  findFrameAt(frames, point, "A") ?? findFrameAt(frames, point, "D");

const bboxCentre = ({ bbox: [west, south, east, north] }: Frame): LonLat => [
  (west + east) / 2,
  (south + north) / 2,
];

const country = (item: Case): string => item.place.split(",").at(-1)?.trim() ?? item.place;

const AREA_NAME = { point: "Point", rectangle: "Rectangle", polygon: "Polygon" } as const;

// A drawn area is named by its shape and size; a point by where it is.
const liveName = ({ area, point }: { area: Area; point: LonLat }): string =>
  area.kind === "point"
    ? formatLonLat(point)
    : `${AREA_NAME[area.kind]} · ${formatKm2(areaKm2Of(area))}`;

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canSpeak = (): boolean => typeof window !== "undefined" && "speechSynthesis" in window;

// Web Speech can be missing or throw (no voices, blocked audio); captions always carry the story.
const speak = (text: string | undefined): void => {
  if (!canSpeak()) return;
  try {
    window.speechSynthesis.cancel();
    if (text === undefined) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Voice is optional.
  }
};

export const ExplorerPage = () => {
  const [initial] = useState(readParams);
  const [selection, setSelection] = useState<Selection | undefined>(
    initial.story ? undefined : initial.item && { kind: "case", item: initial.item },
  );
  const [story, setStory] = useState(initial.story && storyCase() !== undefined);
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [voice, setVoice] = useState(false);
  // First visit with nothing open: the four-step tour. Links to a case or the story skip it.
  const [onboarding, setOnboarding] = useState<number | undefined>(() =>
    !initial.story &&
    initial.item === undefined &&
    initial.frameId === null &&
    initial.area === undefined &&
    !hasSeenOnboarding()
      ? 0
      : undefined,
  );
  const [novaOpen, setNovaOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const viewerRef = useRef<Viewer | undefined>(undefined);
  // A shared ?frame=, ?bbox= or ?geo= link can only open once the frames snapshot is in.
  const opensLink = initial.item === undefined && !initial.story;
  const linkRef = useRef(opensLink ? initial.frameId : null);
  const areaLinkRef = useRef(opensLink ? initial.area : undefined);
  const [linkPending, setLinkPending] = useState(
    opensLink && (initial.frameId !== null || initial.area !== undefined),
  );
  const [draw, setDraw] = useState<DrawState>(() => startTool(undefined));
  const drawRef = useRef(draw);
  const [areaIssue, setAreaIssue] = useState<AreaIssue>();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Sent with the question once the backend accepts it (DIRECTION_CHOICE_READY).
  const [direction, setDirection] = useState<Direction>("ascending");
  // A picked spot (v8 step 2): a search hit or a clicked point, waiting for "Analyze this spot".
  const [place, setPlace] = useState<Place>();
  const [collapsed, setCollapsed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<ChartMode>("plain");
  const [helpOpen, setHelpOpen] = useState(false);
  const [showReal, setShowReal] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(prefersReducedMotion);
  const [drapeKind, setDrapeKind] = useState<DrapeKind>("change");
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [homeRequest, setHomeRequest] = useState(0);
  const [unavailable, setUnavailable] = useState(false);

  const ask = useCallback(
    (
      frame: Frame,
      point: LonLat,
      lens: LensId = DEFAULT_LENS,
      fromCase?: Case,
      area?: Area,
      insar?: InsarChoice,
      lensSwitch = false,
    ) => {
      setSelection((previous) => ({
        kind: "live",
        frame,
        point,
        area: area ?? { kind: "point", point },
        lens,
        fromCase,
        insar,
        run: previous?.kind === "live" ? previous.run + 1 : 0,
        lensSwitch,
      }));
      setAreaIssue(undefined);
      setPlace(undefined);
      setCollapsed(false);
      setSheetOpen(false);
      setHelpOpen(false);
      setDownloadOpen(false);
    },
    [],
  );

  const loadFramesAndLink = useCallback(
    async (signal: AbortSignal) => {
      const loaded = await loadFrames(signal);
      const linked = linkRef.current;
      const linkedArea = areaLinkRef.current;
      if (linkedArea !== undefined) {
        areaLinkRef.current = undefined;
        const centre = centreOf(linkedArea);
        const frame = frameUnder(loaded, centre);
        if (frame !== undefined)
          ask(frame, centre, initial.lens, undefined, linkedArea, initial.insar);
        else setAreaIssue({ kind: "noFrame" });
        setLinkPending(false);
      } else if (linked !== null) {
        linkRef.current = null;
        const frame = loaded.find((entry) => entry.id === linked);
        if (frame !== undefined)
          ask(frame, bboxCentre(frame), initial.lens, undefined, undefined, initial.insar);
        setLinkPending(false);
      }
      return loaded;
    },
    [ask, initial.lens, initial.insar],
  );
  const { state: framesState, retry: retryFrames } = useAsync(loadFramesAndLink, "frames");
  const frames = useMemo(
    () => (framesState?.status === "success" ? framesState.data : []),
    [framesState],
  );
  const placeFrame = useMemo(
    () => (place === undefined ? undefined : frameUnder(frames, place.point)),
    [frames, place],
  );
  // What the catalog holds at the spot: free, so it runs on every pick.
  const { state: coverage, retry: retryCoverage } = useAsync(
    (signal) =>
      place === undefined
        ? Promise.reject(new Error("no spot"))
        : fetchCoverage(place.point, signal),
    place?.id,
  );
  const nearest = useMemo(
    () => (place === undefined ? undefined : nearestCase(place.point, CASES)),
    [place],
  );
  // The footprint, sized by the backend, appears once the catalog answers that it has passes here.
  // Without coverage nothing is drawn and the camera stays put: no close-up of open ocean.
  const spotSideKm =
    coverage?.status === "success" && coverage.data.plan.status !== "noCoverage"
      ? squareSideKm(coverage.data.areaKm2)
      : undefined;
  const framesRef = useRef(frames);
  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  // A drawn area is asked at its centre, on the frame that covers it.
  const askArea = useCallback(
    (area: Area) => {
      const centre = centreOf(area);
      const frame = frameUnder(framesRef.current, centre);
      if (frame === undefined) setAreaIssue({ kind: "noFrame" });
      else ask(frame, centre, DEFAULT_LENS, undefined, area);
    },
    [ask],
  );

  const live = selection?.kind === "live" ? selection : undefined;
  const runKey =
    live === undefined
      ? ""
      : `${live.area.kind}|${live.point.join(",")}|${live.lens}|${live.insar?.pairId ?? ""}|${live.insar?.threshold ?? ""}|${live.run}`;
  // Ground motion waits for a pair; every other lens runs on the backend as soon as it is asked.
  const needsPair = live !== undefined && live.lens === "insar" && live.insar === undefined;
  const liveRuns = live !== undefined && isLiveLens(live.lens) && !needsPair;
  const request: ExplorationRequest | undefined =
    live !== undefined && liveRuns
      ? {
          lens: live.lens,
          geometry: toGeoJson(live.area),
          source: "L",
          ...(live.insar && {
            pairId: live.insar.pairId,
            coherenceThreshold: live.insar.threshold,
          }),
        }
      : undefined;
  const exploration = useExploration(request, liveRuns ? runKey : "");
  const framePlan = useFramePlan(live?.frame, runKey);
  const phase = exploration.state.phase;
  const running = phase === "starting" || phase === "running";
  const exploredView =
    exploration.state.phase === "running" || exploration.state.phase === "done"
      ? exploration.state.view
      : undefined;
  const receivedAt = exploration.state.phase === "running" ? exploration.state.receivedAt : 0;
  // The wait modal can be closed while the job runs; it stays closed for that run.
  const [modalClosedFor, setModalClosedFor] = useState("");
  const modalOpen =
    liveRuns && running && modalClosedFor !== runKey && !story && live?.lensSwitch !== true;
  const layers = useMemo(
    () => (phase === "done" && exploredView !== undefined ? liveLayers(exploredView) : []),
    [phase, exploredView],
  );
  // The dock's pick and the selected pass belong to one run; a new run starts from its defaults.
  const [dockChoice, setDockChoice] = useState<{
    runKey: string;
    pick: DockPick;
    date: string | undefined;
  }>();
  // The run whose time-lapse is playing; any other run (or none) means stopped.
  const [lapseFor, setLapseFor] = useState("");

  const openCase = useCallback((item: Case) => {
    setSelection({ kind: "case", item });
    setAreaIssue(undefined);
    setPlace(undefined);
    setCollapsed(false);
    setSheetOpen(false);
    setHelpOpen(false);
    setDownloadOpen(false);
    setDrapeKind("change");
  }, []);

  // The globe stays put while the story or the tour tells the user where to look.
  const storyRef = useRef(story);
  useEffect(() => {
    storyRef.current = story;
  }, [story]);
  const onGlobeOpenCase = useCallback(
    (item: Case) => {
      if (!storyRef.current) openCase(item);
    },
    [openCase],
  );
  // A click picks a spot (step 2); the question runs only from "Analyze this spot".
  const onGlobeAsk = useCallback((point: LonLat) => {
    if (storyRef.current) return;
    setSelection(undefined);
    setSheetOpen(false);
    setCollapsed(false);
    setAreaIssue(undefined);
    setPlace(coordinatePlace(point));
  }, []);

  const chooseTool = useCallback((tool: DrawTool | undefined) => {
    const next = startTool(tool);
    drawRef.current = next;
    setDraw(next);
    setAreaIssue(undefined);
    if (tool !== undefined) {
      setHelpOpen(false);
      setDownloadOpen(false);
    }
  }, []);

  const finishArea = useCallback(
    (area: Area) => {
      const km2 = areaKm2Of(area);
      if (levelOf(km2) === "tooLarge") setAreaIssue({ kind: "tooLarge", area, km2 });
      else askArea(area);
    },
    [askArea],
  );

  // The reducer reads the ref, not the state, so events in the same frame never see a stale one.
  const onDraw = useCallback(
    (event: DrawEvent) => {
      if (storyRef.current) return;
      const step = reduceDraw(drawRef.current, event);
      // One drawing, one question: a finished area puts the tool away.
      const next = step.area === undefined ? step.state : startTool(undefined);
      drawRef.current = next;
      setDraw(next);
      if (step.rejected !== undefined) setAreaIssue({ kind: "rejected", reason: step.rejected });
      if (step.area !== undefined) finishArea(step.area);
    },
    [finishArea],
  );

  useEffect(() => {
    if (linkPending) return;
    const url = new URL(window.location.href);
    url.search = paramsOf(selection, story);
    window.history.replaceState(null, "", url);
  }, [selection, story, linkPending]);

  useEffect(() => {
    if (onboarding !== undefined) markOnboardingSeen();
  }, [onboarding]);

  const close = useCallback(() => {
    setSelection(undefined);
    setPlace(undefined);
    setSheetOpen(false);
  }, []);

  const pickPlace = useCallback((picked: Place) => {
    setSelection(undefined);
    setSheetOpen(false);
    setCollapsed(false);
    setAreaIssue(undefined);
    setSearchOpen(false);
    setPlace(picked);
  }, []);

  const startStory = useCallback(() => {
    close();
    chooseTool(undefined);
    setHelpOpen(false);
    setDownloadOpen(false);
    setNovaOpen(false);
    setOnboarding(undefined);
    setChapter(0);
    setPlaying(false);
    setStory(true);
  }, [close, chooseTool]);

  const leaveStory = useCallback(() => {
    speak(undefined);
    setPlaying(false);
    setStory(false);
  }, []);

  const exitStory = useCallback(() => {
    leaveStory();
    close();
  }, [leaveStory, close]);

  const exploreFromStory = useCallback(() => {
    leaveStory();
    const item = storyCase();
    if (item !== undefined) openCase(item);
  }, [leaveStory, openCase]);

  const goChapter = useCallback(
    (index: number) => {
      if (index < 0) return;
      if (index > LAST_CHAPTER) exploreFromStory();
      else setChapter(index);
    },
    [exploreFromStory],
  );

  // Captions always show; the voice reads them when it is on, and a chapter change cuts it off.
  useEffect(() => {
    if (!story) return;
    speak(voice ? CHAPTERS[chapter]?.caption : undefined);
  }, [story, chapter, voice]);
  useEffect(() => () => speak(undefined), []);

  // Play advances every 9 s and stops on the last chapter instead of leaving the story.
  useEffect(() => {
    if (!story || !playing) return;
    const timer = window.setTimeout(() => {
      const next = Math.min(LAST_CHAPTER, chapter + 1);
      setChapter(next);
      if (next === LAST_CHAPTER) setPlaying(false);
    }, STORY_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [story, playing, chapter]);

  const startOnboarding = () => {
    if (story) leaveStory();
    close();
    setHelpOpen(false);
    setNovaOpen(false);
    setOnboarding(0);
  };

  const nextOnboarding = () => {
    const next = (onboarding ?? 0) + 1;
    // The panel, dock and timeline only exist with a case open, so step 2 opens the story case.
    const item = storyCase();
    if (next === 1 && item !== undefined) openCase(item);
    setOnboarding(next < ONBOARDING_STEPS.length ? next : undefined);
  };

  const wholeGlobe = () => {
    if (story) leaveStory();
    close();
    chooseTool(undefined);
    setHelpOpen(false);
    setHomeRequest((count) => count + 1);
  };

  // Esc closes the innermost thing first: onboarding, story, a drawing, menus, Nova, sheet, selection
  // (SPECS §4). A drawing gives way in steps: its notice, the shape in progress, then the tool.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement | null)?.closest("input, textarea") != null;
      if (event.key === "Enter" && draw.tool === "polygon" && isDrawing(draw) && !typing)
        onDraw({ type: "finish" });
      if (event.key === "Escape") {
        if (onboarding !== undefined) setOnboarding(undefined);
        else if (story) exitStory();
        else if (modalOpen) setModalClosedFor(runKey);
        else if (areaIssue !== undefined) setAreaIssue(undefined);
        else if (draw.tool !== undefined) {
          if (isDrawing(draw)) onDraw({ type: "cancel" });
          else chooseTool(undefined);
        } else if (helpOpen || downloadOpen || searchOpen) {
          setHelpOpen(false);
          setDownloadOpen(false);
          setSearchOpen(false);
        } else if (novaOpen) setNovaOpen(false);
        else if (sheetOpen) setSheetOpen(false);
        else close();
        return;
      }
      if (!story || onboarding !== undefined) return;
      if (event.key === "ArrowRight") goChapter(chapter + 1);
      if (event.key === "ArrowLeft") goChapter(chapter - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    onboarding,
    story,
    chapter,
    draw,
    modalOpen,
    runKey,
    areaIssue,
    helpOpen,
    downloadOpen,
    searchOpen,
    novaOpen,
    sheetOpen,
    close,
    exitStory,
    goChapter,
    onDraw,
    chooseTool,
  ]);

  const openSheet = () => {
    setLapseFor("");
    setSheetOpen(true);
  };

  const chooseLens = (lens: LensId) => {
    setLapseFor("");
    if (selection === undefined) return;
    if (selection.kind === "case") {
      if (lens === selection.item.lens) return;
      const frame = frameUnder(frames, selection.item.focus);
      if (frame !== undefined) ask(frame, selection.item.focus, lens, selection.item);
      return;
    }
    if (lens === selection.lens) return;
    if (selection.fromCase !== undefined && lens === selection.fromCase.lens) {
      openCase(selection.fromCase);
      return;
    }
    ask(
      selection.frame,
      selection.point,
      lens,
      selection.fromCase,
      selection.area,
      undefined,
      true,
    );
  };

  // The pair is chosen after the lens: the choice starts the run and goes into the shared link.
  const measurePair = (current: typeof live, choice: InsarChoice) => {
    if (current === undefined) return;
    ask(current.frame, current.point, current.lens, current.fromCase, current.area, choice);
  };
  const measureLivePair = (fromCase: Case) => {
    const frame = frameUnder(frames, fromCase.focus);
    if (frame !== undefined) ask(frame, fromCase.focus, "insar", fromCase);
  };

  const item = selection?.kind === "case" ? selection.item : undefined;
  const subject: Subject | undefined =
    item !== undefined && item.pending !== true
      ? caseSubject(item)
      : live !== undefined && phase === "done" && exploredView !== undefined
        ? exploreSubject(exploredView, {
            name: liveName(live),
            frameLabel: `Track ${live.frame.track} · Frame ${live.frame.frame}`,
            point: live.point,
          })
        : undefined;
  // Live answers of the four lenses read as the v8 lens result; cases and ground motion keep v7.
  const showLensCard =
    subject?.kind === "live" && exploredView !== undefined && isCardLens(subject.lens);
  const lensRun: LensRun | undefined =
    live !== undefined && live.lensSwitch && liveRuns && running && isCardLens(live.lens)
      ? { lens: live.lens, view: exploredView, receivedAt }
      : undefined;
  const liveTimeline = useMemo(
    () =>
      phase === "done" && exploredView !== undefined
        ? exploreTimeline(
            exploredView,
            framePlan.plan?.status === "success" ? framePlan.plan.data : undefined,
            today,
          )
        : undefined,
    [phase, exploredView, framePlan.plan],
  );
  const livePasses = useMemo(() => measuredPasses(liveTimeline?.passes ?? []), [liveTimeline]);
  const dockDefault = useMemo(() => defaultView(layers, livePasses), [layers, livePasses]);
  const dockView = dockChoice?.runKey === runKey ? dockChoice : dockDefault;
  const liveLayer = shownLayer(layers, dockView.pick, dockView.date);
  const layerId = liveLayer?.id;
  const lapsePlaying = lapseFor !== "" && lapseFor === runKey;
  const stopLapse = () => setLapseFor("");
  const setDock = (pick: DockPick, date: string | undefined = dockView.date) =>
    setDockChoice({ runKey, pick, date });
  // Any pick of a layer that is not a pass channel stops the time-lapse; HH ↔ HV keeps it going.
  const pickDock = (pick: DockPick) => {
    if (pick?.kind !== "pass") stopLapse();
    setDock(pick);
  };
  const pickPass = (date: string) => {
    stopLapse();
    setDock(dockView.pick, date);
  };
  const lapsePol = dockView.pick?.kind === "pass" ? dockView.pick.pol : "HH";
  const lapseSteps = useMemo(
    () => timeLapseSteps(livePasses, layers, lapsePol),
    [livePasses, layers, lapsePol],
  );
  const lapseIndex = lapseSteps.findIndex((step) => step.date === dockView.date);
  const togglePlay = () => {
    if (lapsePlaying) {
      stopLapse();
      return;
    }
    const start = lapseSteps[playStart(lapseIndex, lapseSteps.length)];
    if (start === undefined) return;
    setDock({ kind: "pass", pol: lapsePol }, start.date);
    setLapseFor(runKey);
  };
  // One step every 1.1 s; the step after the target ends the time-lapse on the target.
  useEffect(() => {
    if (!lapsePlaying) return;
    const timer = window.setTimeout(() => {
      const next = nextStep(lapseIndex, lapseSteps.length);
      const step = next === undefined ? undefined : lapseSteps[next];
      if (step === undefined) setLapseFor("");
      else setDockChoice({ runKey, pick: { kind: "pass", pol: lapsePol }, date: step.date });
    }, TIME_LAPSE_MS);
    return () => window.clearTimeout(timer);
  }, [lapsePlaying, lapseIndex, lapseSteps, lapsePol, runKey]);
  const lapseStep = lapsePlaying ? lapseSteps[lapseIndex] : undefined;
  // Under the footprint the user asked about, which is the box the images cover.
  const lapseBox = live === undefined ? undefined : boundsOf(ringOf(live.area));

  const tourItem = storyCase();
  const storyItem = story ? tourItem : undefined;
  const scene =
    storyItem === undefined
      ? sceneOf(selection, !running, drapeKind, opacity, {
          place,
          spotSideKm,
          liveDrape: liveLayer && { url: liveLayer.href, bounds: liveLayer.bounds },
          gridMetres: gridMetresOf(exploredView),
          stamp: lapseStep &&
            lapseBox && {
              date: formatDay(lapseStep.date).toUpperCase(),
              pass:
                lapseStep.role === undefined
                  ? passOf(lapseStep.k, lapseStep.n)
                  : STEP_4.playStampPass(lapseStep.k, lapseStep.n, lapseStep.role),
              target: lapseStep.role === "TARGET",
              box: lapseBox,
            },
        })
      : storyScene(storyItem, chapter, opacity);
  const draft = draftOf(draw);
  const draftKm2 = draft?.closed === true ? ringAreaKm2(draft.ring) : 0;
  const draftView = draft && { ...draft, km2: draftKm2, level: levelOf(draftKm2) };
  const toolsOffWhy = story
    ? "Not available during the guided tour"
    : unavailable
      ? "The 3D globe isn't available in this browser"
      : framesState?.status !== "success"
        ? "Waiting for the NISAR frames"
        : undefined;

  const showTimeline = item?.timeline !== undefined && item.pending !== true && !sheetOpen;
  const showLiveTimeline = liveTimeline !== undefined && !sheetOpen;
  const showDock = item?.crops !== undefined && !sheetOpen;
  const showLiveDock = layers.length > 0 && !sheetOpen;

  const lensId = item?.lens ?? live?.lens;
  const lensChip = lensId === undefined ? "" : (findLens(lensId)?.chip ?? "");
  const novaContext: NovaContext = {
    subject,
    pending: item?.pending === true ? item : undefined,
    running: live !== undefined && running,
    mode,
  };
  const lookingAt =
    item !== undefined
      ? `${item.name} · ${lensChip} · ${
          item.pending === true
            ? "no measurement yet"
            : sheetOpen
              ? "full view"
              : VERDICT[item.verdict].label
        }`
      : live !== undefined
        ? `${formatLonLat(live.point)} · ${lensChip} · ${
            subject === undefined ? "processing" : VERDICT[subject.verdict].label
          }`
        : "the whole globe";

  const downloadPng = async () => {
    setDownloadOpen(false);
    const viewer = viewerRef.current;
    if (viewer === undefined) return;
    const shown = storyItem ?? item;
    const strip: GlobeStrip = {
      title:
        shown !== undefined
          ? `${shown.name}, ${shown.place}`
          : live !== undefined
            ? `Live question · ${formatLonLat(live.point)}`
            : "The whole globe · NISAR measured cases",
      question:
        shown !== undefined
          ? (findLens(shown.lens)?.chip ?? "")
          : live !== undefined
            ? lensChip
            : "Click any land to ask the radar",
      dates: [
        shown?.target !== undefined ? `Target pass ${formatDay(shown.target)}` : undefined,
        `Exported ${today}`,
      ]
        .filter(Boolean)
        .join(" · "),
      legend:
        scene.drape === undefined
          ? undefined
          : (({ stops, scale, text }) => ({ ramp: stops, scale, text }))(
              LEGEND[storyItem === undefined ? drapeKind : "change"],
            ),
      // A case's point chart and pass dates are demo; a live answer is real unless the service says
      // its result is synthetic.
      demo:
        storyItem === undefined &&
        (live !== undefined
          ? subject?.demo === true
          : item !== undefined &&
            item.pending !== true &&
            (item.band !== undefined || item.timeline !== undefined)),
    };
    const blob = await captureGlobe(viewer, strip);
    if (blob !== null) saveBlob(blob, `nisar-${shown?.id ?? "globe"}-view.png`);
  };

  const exportsLive = live !== undefined && exploredView?.result != null;
  const timelineWhy = exportsLive
    ? undefined
    : live !== undefined
      ? "Wait for the answer first"
      : item === undefined
        ? "Open a case first"
        : item.timeline === undefined
          ? "This case has no pass timeline yet"
          : undefined;
  const downloads: DownloadItem[] = [
    {
      id: "png",
      label: "Screenshot of the globe",
      sub: "PNG of this view, with its place, dates and legend",
      disabledWhy: unavailable ? "The 3D globe isn't available in this browser" : undefined,
      onPick: () => void downloadPng(),
    },
    {
      id: "json",
      label: exportsLive ? "Result data · JSON" : "Timeline data · JSON",
      sub: exportsLive
        ? "The service's full answer for this question"
        : "One entry per pass, demo flags included",
      disabledWhy: timelineWhy,
      onPick: () => {
        setDownloadOpen(false);
        if (exportsLive && exploredView !== undefined) {
          saveBlob(
            new Blob([explorationJson(exploredView)], { type: "application/json" }),
            `nisar-exploration-${exploredView.id}.json`,
          );
          return;
        }
        if (item === undefined) return;
        saveBlob(
          new Blob([timelineJson(item)], { type: "application/json" }),
          `nisar-${item.id}-timeline.json`,
        );
      },
    },
    {
      id: "csv",
      label: exportsLive ? "Passes · CSV" : "Timeline data · CSV",
      sub: exportsLive ? "One row per scene: date, role, outcome" : "Same rows, for spreadsheets",
      disabledWhy: timelineWhy,
      onPick: () => {
        setDownloadOpen(false);
        if (exportsLive && exploredView !== undefined) {
          saveBlob(
            new Blob([explorationCsv(exploredView)], { type: "text/csv" }),
            `nisar-exploration-${exploredView.id}-passes.csv`,
          );
          return;
        }
        if (item === undefined) return;
        saveBlob(
          new Blob([timelineCsv(item)], { type: "text/csv" }),
          `nisar-${item.id}-timeline.csv`,
        );
      },
    },
    {
      id: "pdf",
      label: "PDF report",
      sub: "Data blocks plus a template summary, ready to print",
      disabledWhy: exportsLive
        ? undefined
        : live !== undefined
          ? "Wait for the answer first"
          : item === undefined
            ? "Open a case first"
            : item.pending === true
              ? "No measurement to report yet"
              : undefined,
      onPick: () => {
        setDownloadOpen(false);
        if (exportsLive && exploredView !== undefined)
          window.open(
            `/report?exploration=${encodeURIComponent(exploredView.id)}`,
            "_blank",
            "noopener",
          );
        else if (item !== undefined)
          window.open(`/report?case=${encodeURIComponent(item.id)}`, "_blank", "noopener");
      },
    },
  ];

  return (
    <ShowRealContext value={showReal}>
      <main
        className="site explorer"
        data-frames={framesState?.status ?? "loading"}
        data-reduce-motion={reduceMotion}
      >
        {unavailable ? (
          <div className="x-nogl" data-testid="no-webgl">
            <p className="x-nogl__pill">3D globe unavailable in this browser · panels still work</p>
          </div>
        ) : (
          <GlobeView
            frames={frames}
            cases={CASES}
            scene={scene}
            view={story ? "story" : sheetOpen ? "sheet" : "panel"}
            reduceMotion={reduceMotion}
            homeRequest={homeRequest}
            onOpenCase={onGlobeOpenCase}
            onAsk={onGlobeAsk}
            drawTool={story ? undefined : draw.tool}
            draft={draftView}
            onDraw={onDraw}
            onUnavailable={() => setUnavailable(true)}
            onViewer={(viewer) => {
              viewerRef.current = viewer;
            }}
          />
        )}

        <TopBar
          switches={
            <div className="x-switches">
              <SourceSwitch />
              {DIRECTION_CHOICE_READY && (
                <DirectionSwitch direction={direction} onChange={setDirection} />
              )}
            </div>
          }
          tools={<AreaTools tool={draw.tool} disabledWhy={toolsOffWhy} onTool={chooseTool} />}
          cases={CASES}
          searchInputRef={searchInputRef}
          helpOpen={helpOpen}
          downloadOpen={downloadOpen}
          downloads={downloads}
          story={story}
          showReal={showReal}
          reduceMotion={reduceMotion}
          searchOpen={searchOpen}
          onHelp={(open) => {
            setHelpOpen(open);
            if (open) {
              setDownloadOpen(false);
              setSearchOpen(false);
            }
          }}
          onDownload={(open) => {
            setDownloadOpen(open);
            if (open) {
              setHelpOpen(false);
              setSearchOpen(false);
            }
          }}
          onSearch={(open) => {
            setSearchOpen(open);
            if (open) {
              setHelpOpen(false);
              setDownloadOpen(false);
            }
          }}
          onPickPlace={pickPlace}
          onOpenCase={(picked) => {
            setSearchOpen(false);
            openCase(picked);
          }}
          onStory={(on) => {
            if (on && !story) startStory();
            if (!on && story) exitStory();
          }}
          onReplayTour={startOnboarding}
          onShowReal={setShowReal}
          onReduceMotion={setReduceMotion}
          onWholeGlobe={wholeGlobe}
        />

        {!story && (
          <AreaGuide
            tool={draw.tool}
            draft={draftView}
            issue={areaIssue}
            corners={draw.corners.length}
            onFinish={() => onDraw({ type: "finish" })}
            onCancel={() => onDraw({ type: "cancel" })}
            onUseSquare={() => {
              if (areaIssue?.kind === "tooLarge")
                askArea({ kind: "point", point: centreOf(areaIssue.area) });
            }}
            onDismiss={() => setAreaIssue(undefined)}
          />
        )}

        {selection === undefined && !story && place === undefined && (
          <>
            <StartCard
              frames={framesState}
              onOpen={openCase}
              onRetryFrames={retryFrames}
              onStory={startStory}
              onSearch={() => searchInputRef.current?.focus()}
            />
            {draw.tool === undefined && <HintPill />}
          </>
        )}

        {selection === undefined && !story && place !== undefined && (
          <SpotCard
            place={place}
            coverage={coverage}
            nearest={nearest}
            canAsk={placeFrame !== undefined}
            onAnalyse={() => askArea({ kind: "point", point: place.point })}
            onRetry={retryCoverage}
            onOpenCase={openCase}
            onClose={close}
          />
        )}

        {selection !== undefined && (
          <CasePanel
            meta={
              item !== undefined
                ? `${item.pending === true ? "Event context" : "Measured case"} · ${item.region}`
                : `Live question · Track ${live?.frame.track} · Frame ${live?.frame.frame}`
            }
            title={
              item !== undefined
                ? `${item.name}, ${country(item)}`
                : live !== undefined
                  ? liveName(live)
                  : ""
            }
            lens={item?.lens ?? live?.lens ?? DEFAULT_LENS}
            collapsed={collapsed || sheetOpen}
            result={showLensCard}
            picker={
              <LensPicker
                lens={item?.lens ?? live?.lens ?? DEFAULT_LENS}
                tabs={showLensCard}
                running={lensRun}
                onLens={chooseLens}
                onCancel={() => void exploration.cancel()}
              />
            }
            onToggle={() => {
              stopLapse();
              if (sheetOpen) setSheetOpen(false);
              else setCollapsed(!collapsed);
            }}
            onClose={close}
          >
            {item?.pending === true && <PendingSummary item={item} />}
            {showLensCard && subject !== undefined && exploredView !== undefined && (
              <LensResultCard
                subject={subject}
                view={exploredView}
                layers={layers}
                shownLayerId={layerId}
                onShowLayer={(id) => pickDock(id === undefined ? undefined : { kind: "layer", id })}
                reduce={reduceMotion}
                onMore={openSheet}
              />
            )}
            {subject !== undefined && !showLensCard && (
              <ResultSummary subject={subject} mode={mode} onMore={openSheet} />
            )}
            {item !== undefined && item.pending !== true && item.lens === "insar" && (
              <button
                type="button"
                className="x-ghost"
                onClick={() => measureLivePair(item)}
                data-testid="measure-live-pair"
              >
                Measure a live NISAR pair here
              </button>
            )}
            {live !== undefined && needsPair && (
              <InsarPairPicker
                key={live.point.join(",")}
                point={live.point}
                onMeasure={(choice) => measurePair(live, choice)}
                onPickCase={close}
              />
            )}
            {liveRuns && running && !modalOpen && live?.lensSwitch !== true && (
              <LiveProgress
                view={exploredView}
                receivedAt={receivedAt}
                onDetails={() => setModalClosedFor("")}
                onCancel={() => void exploration.cancel()}
              />
            )}
            {liveRuns && exploration.state.phase === "error" && (
              <LiveProblem
                reasonCode={exploration.state.error.reasonCode}
                detail={exploration.state.error.message}
                onRetry={exploration.retry}
                onPickCase={close}
              />
            )}
            {liveRuns &&
              phase === "done" &&
              exploredView !== undefined &&
              exploredView.result === null && (
                <LiveProblem
                  reasonCode={exploredView.error?.reasonCode ?? "ANALYSIS_FAILED"}
                  detail={exploredView.error?.detail ?? "The analysis did not produce a result."}
                  notes={exploredView.plan?.notes ?? []}
                  onRetry={exploration.retry}
                  onPickCase={close}
                />
              )}
            {subject?.kind === "live" && exploredView?.status === "partial" && (
              <p className="x-reason" data-testid="partial-note">
                Partial answer: only some of the planned passes could be measured.
              </p>
            )}
            {live !== undefined && <PlanState framePlan={framePlan} today={today} />}
          </CasePanel>
        )}

        {showDock && (
          <LayerDock
            kind={drapeKind}
            opacity={opacity}
            onKind={setDrapeKind}
            onOpacity={setOpacity}
          />
        )}

        {showLiveDock && (
          <LiveLayerDock
            layers={layers}
            pick={dockView.pick}
            date={dockView.date}
            passes={livePasses}
            shownId={layerId}
            opacity={opacity}
            onPick={pickDock}
            onPair={() => chooseLens("insar")}
            onOpacity={setOpacity}
          />
        )}

        {showTimeline && item.timeline !== undefined && (
          <div className="x-timeline-wrap" data-collapsed={collapsed}>
            <PassTimeline key={item.id} data={item.timeline} />
          </div>
        )}

        {showLiveTimeline && (
          <div className="x-timeline-wrap" data-collapsed={collapsed}>
            <PassTimeline
              key={runKey}
              data={liveTimeline}
              demo={false}
              live={{
                date: dockView.date,
                playing: lapsePlaying,
                onPick: pickPass,
                onPlay: togglePlay,
              }}
            />
          </div>
        )}

        {modalOpen && live !== undefined && (
          <JobModal
            lensChip={lensChip}
            placeName={liveName(live)}
            view={exploredView}
            receivedAt={receivedAt}
            reduceMotion={reduceMotion}
            onKeepExploring={() => setModalClosedFor(runKey)}
            onCancel={() => void exploration.cancel()}
          />
        )}

        {sheetOpen && subject !== undefined && (
          <MoreInfoSheet
            subject={subject}
            mode={mode}
            onMode={setMode}
            onClose={() => setSheetOpen(false)}
            onAskNova={() => setNovaOpen(true)}
          />
        )}

        {storyItem !== undefined && (
          <StoryMode
            item={storyItem}
            chapter={chapter}
            playing={playing}
            voice={voice}
            voiceAvailable={canSpeak()}
            onGo={goChapter}
            onTogglePlay={() => setPlaying(!playing)}
            onToggleVoice={() => setVoice(!voice)}
            onExit={exitStory}
            onExplore={exploreFromStory}
          />
        )}

        {!story && (
          <NovaChat
            open={novaOpen}
            context={novaContext}
            lookingAt={lookingAt}
            mode={mode}
            reduceMotion={reduceMotion}
            onMode={setMode}
            onOpen={(open) => {
              setNovaOpen(open);
              if (open) {
                setHelpOpen(false);
                setDownloadOpen(false);
              }
            }}
          />
        )}

        {onboarding !== undefined && (
          <Onboarding
            step={onboarding}
            onNext={nextOnboarding}
            onSkip={() => setOnboarding(undefined)}
          />
        )}
      </main>
    </ShowRealContext>
  );
};

// The story's camera per chapter: the region first, then the chip, then the chip with its change map.
const storyScene = (item: Case, chapter: number, opacity: number): GlobeScene => {
  const view = CHAPTERS[chapter]?.view ?? "region";
  const scene = sceneOf({ kind: "case", item }, true, "change", opacity);
  if (view === "drape") return scene;
  if (view === "chip") return { ...scene, drape: undefined };
  return {
    ...scene,
    target: {
      key: "story-region",
      box: squareBounds(REGION_CENTRE, STORY_REGION_KM),
      zoom: REGION_ZOOM,
      seconds: STORY_REGION_SECONDS,
    },
    outline: undefined,
    drape: undefined,
  };
};

// A picked spot: the point at once; the camera and the dashed square once there is coverage.
const placeScene = (place: Place, sideKm: number | undefined, empty: GlobeScene): GlobeScene =>
  sideKm === undefined
    ? { ...empty, point: place.point }
    : {
        ...empty,
        target: { key: `place|${place.id}`, ...placeFraming(place) },
        outline: {
          ring: squareAround(place.point, sideKm),
          label: `${sideKm.toFixed(2)} km square · ${place.name}`,
          processing: false,
          spot: true,
        },
        point: place.point,
      };

type SceneExtras = {
  // A picked spot waiting to be asked about, and its footprint's side (none without coverage).
  place?: Place | undefined;
  spotSideKm?: number | undefined;
  // The layer of the live result drawn on the globe.
  liveDrape?: Drape | undefined;
  // Posting the service reported for the live result, in metres.
  gridMetres?: number | undefined;
  // The time-lapse stamp, while it plays.
  stamp?: GlobeStamp | undefined;
};

const gridMetresOf = (view: ExplorationView | undefined): number | undefined => {
  const posting = view?.result?.quality["postingMeters"];
  return Array.isArray(posting) && typeof posting[0] === "number" ? posting[0] : undefined;
};

// What the globe draws for the current selection.
const sceneOf = (
  selection: Selection | undefined,
  ready: boolean,
  kind: DrapeKind,
  opacity: number,
  extras: SceneExtras = {},
): GlobeScene => {
  const { place, spotSideKm, liveDrape, gridMetres: liveGrid, stamp } = extras;
  const empty: GlobeScene = {
    target: undefined,
    outline: undefined,
    point: undefined,
    frame: undefined,
    selectedCaseId: undefined,
    drape: undefined,
    drapeAlpha: opacity / 100,
    stamp: undefined,
  };
  if (selection === undefined)
    return place === undefined ? empty : placeScene(place, spotSideKm, empty);
  if (selection.kind === "live") {
    const { area } = selection;
    const ring = ringOf(area);
    return {
      ...empty,
      target: { key: `live|${area.kind}|${ring.join(";")}`, box: boundsOf(ring), zoom: CHIP_ZOOM },
      outline: {
        ring,
        label:
          area.kind === "point"
            ? `Processed area · ${LIVE_CHIP_KM} km${liveGrid === undefined ? "" : ` · ${liveGrid} m grid`}`
            : `Selected area · ${formatKm2(areaKm2Of(area))}`,
        processing: !ready,
      },
      point: selection.point,
      frame: selection.frame,
      drape: liveDrape,
      stamp,
    };
  }
  const { item } = selection;
  if (item.chipKm === undefined) {
    const pending = item.pending === true;
    return {
      ...empty,
      target: {
        key: item.id,
        box: squareBounds(item.focus, pending ? REGION_KM : LIVE_CHIP_KM),
        zoom: pending ? REGION_ZOOM : CHIP_ZOOM,
      },
      selectedCaseId: item.id,
    };
  }
  const box = squareBounds(item.focus, item.chipKm);
  return {
    ...empty,
    target: { key: item.id, box, zoom: CHIP_ZOOM },
    outline: {
      ring: ringOfBox(box),
      label: `Processed area · ${item.chipKm} km · ${gridMetres(item.chipKm)} m grid`,
      processing: false,
    },
    selectedCaseId: item.id,
    drape:
      item.crops === undefined
        ? undefined
        : { url: kind === "change" ? item.crops.change : item.crops.base, bounds: box },
  };
};
