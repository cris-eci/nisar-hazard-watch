import "@/pages/site/site.css";
import "@/features/charts/charts.css";
import "@/pages/explorer/explorer.css";
import "@/pages/explorer/story.css";

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
import { areaFromParams, areaToParams, pointToParams } from "@/features/geo/areaLink";
import {
  draftOf,
  isDrawing,
  reduceDraw,
  startTool,
  type DrawEvent,
  type DrawState,
} from "@/features/geo/drawMachine";
import type { Area, DrawTool } from "@/features/geo/geo.types";
import { AOI_SIDE_KM, formatKm2, levelOf } from "@/features/geo/limits";
import { boundsOf } from "@/features/geo/longitude";
import { areaKm2Of, centreOf, ringAreaKm2, ringOf } from "@/features/geo/measure";
import { toGeoJson } from "@/features/geo/serialize";
import { ringOfBox, squareAround, squareBounds } from "@/features/geo/square";
import type { Drape } from "@/features/globe/frameEntities";
import { GlobeView, type GlobeScene } from "@/features/globe/GlobeView";
import { isLiveLens, type ExplorationRequest } from "@/features/explore/exploreApi";
import type { InsarChoice } from "@/features/insar/insarApi";
import { InsarPairPicker } from "@/features/insar/InsarPairPicker";
import { insarFromParams } from "@/features/insar/insarLink";
import { explorationCsv, explorationJson } from "@/features/explore/exploreExport";
import { defaultLayerId, liveLayers } from "@/features/explore/exploreLayers";
import type { ExplorationView } from "@/features/explore/exploreSchemas";
import { exploreSubject } from "@/features/explore/exploreSubject";
import { exploreTimeline } from "@/features/explore/exploreTimeline";
import { useExploration } from "@/features/explore/useExploration";
import { JobModal } from "@/features/live/JobModal";
import { formatLonLat, gridMetres, LIVE_CHIP_KM } from "@/features/live/liveQuestion";
import { LiveProblem, LiveProgress } from "@/features/live/LiveStatus";
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
import { placeFraming } from "@/features/search/placeFraming";
import type { Place } from "@/features/search/placesApi";
import { StoryMode } from "@/features/story/StoryMode";
import { PassTimeline } from "@/features/timeline/PassTimeline";
import { formatDay } from "@/features/timeline/timelineLayout";
import { useAsync } from "@/lib/useAsync";
import { AreaGuide, type AreaIssue } from "@/pages/explorer/AreaGuide";
import { AreaTools } from "@/pages/explorer/AreaTools";
import { PlaceCard } from "@/pages/explorer/PlaceCard";
import { LEGEND, type DrapeKind } from "@/pages/explorer/drapeLegend";
import { LayerDock } from "@/pages/explorer/LayerDock";
import { LiveLayerDock } from "@/pages/explorer/LiveLayerDock";
import { SourceSwitch } from "@/pages/explorer/SourceSwitch";
import { HintPill, StartCard } from "@/pages/explorer/StartCard";
import { TopBar, type ContextChip, type DownloadItem } from "@/pages/explorer/TopBar";

type Selection =
  | { kind: "case"; item: Case }
  | {
      kind: "live";
      frame: Frame | undefined;
      // Where the question is asked: the clicked point, or the centre of a drawn area.
      point: LonLat;
      area: Area;
      lens: LensId;
      // A live question started from a case's lens chips can go back to that case.
      fromCase: Case | undefined;
      // Ground motion measures one pair, chosen first from the picker.
      insar: InsarChoice | undefined;
      run: number;
    };

const DEFAULT_LENS: LensId = "flood_wetland";
const CHIP_ZOOM = 3.2;
// Chocó has no processed square yet, so the camera shows the region around the event instead.
const REGION_KM = 240;
const REGION_ZOOM = 1;
const DEFAULT_OPACITY = 85;
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

const paramsOf = (
  selection: Selection | undefined,
  story: boolean,
  frame: Frame | undefined,
): string => {
  if (story) return "story=1";
  if (selection === undefined) return "";
  if (selection.kind === "case") return new URLSearchParams({ case: selection.item.id }).toString();
  const lens = selection.lens !== DEFAULT_LENS && { lens: selection.lens };
  const pair = selection.insar !== undefined && {
    pair: selection.insar.pairId,
    coherence: String(selection.insar.threshold),
  };
  const params = new URLSearchParams({
    ...(areaToParams(selection.area) ?? {
      ...(frame && { frame: frame.id }),
      ...pointToParams(selection.point),
    }),
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
  const [selection, setSelection] = useState<Selection | undefined>(() => {
    if (initial.story) return undefined;
    if (initial.item) return { kind: "case", item: initial.item };
    if (initial.area === undefined) return undefined;
    return {
      kind: "live",
      point: centreOf(initial.area),
      area: initial.area,
      lens: initial.lens,
      frame: undefined,
      fromCase: undefined,
      insar: initial.insar,
      run: 0,
    };
  });
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
  // Legacy frame links need the snapshot to derive a coordinate.
  const opensLink = initial.item === undefined && !initial.story;
  const linkRef = useRef(opensLink && initial.area === undefined ? initial.frameId : null);
  const [linkPending, setLinkPending] = useState(
    opensLink && initial.area === undefined && initial.frameId !== null,
  );
  const [draw, setDraw] = useState<DrawState>(() => startTool(undefined));
  const drawRef = useRef(draw);
  const [areaIssue, setAreaIssue] = useState<AreaIssue>();
  const [searchOpen, setSearchOpen] = useState(false);
  // A place picked from the search bar, waiting for the user to ask about it.
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
      frame: Frame | undefined,
      point: LonLat,
      lens: LensId = DEFAULT_LENS,
      fromCase?: Case,
      area?: Area,
      insar?: InsarChoice,
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
      if (linked !== null) {
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
  const framesRef = useRef(frames);
  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  // The catalog decides coverage; the frame outline is optional context.
  const askArea = useCallback(
    (area: Area) => {
      const centre = centreOf(area);
      ask(frameUnder(framesRef.current, centre), centre, DEFAULT_LENS, undefined, area);
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
  const liveFrame = live && (live.frame ?? frameUnder(frames, live.point));
  const framePlan = useFramePlan(liveFrame, runKey);
  const phase = exploration.state.phase;
  const running = phase === "starting" || phase === "running";
  const exploredView =
    exploration.state.phase === "running" || exploration.state.phase === "done"
      ? exploration.state.view
      : undefined;
  const receivedAt = exploration.state.phase === "running" ? exploration.state.receivedAt : 0;
  // The wait modal can be closed while the job runs; it stays closed for that run.
  const [modalClosedFor, setModalClosedFor] = useState("");
  const modalOpen = liveRuns && running && modalClosedFor !== runKey && !story;
  const layers = useMemo(
    () => (phase === "done" && exploredView !== undefined ? liveLayers(exploredView) : []),
    [phase, exploredView],
  );
  const [layerChoice, setLayerChoice] = useState<{ runKey: string; id: string | undefined }>();
  const layerId = layerChoice?.runKey === runKey ? layerChoice.id : defaultLayerId(layers);

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
  const onGlobeAsk = useCallback(
    (frame: Frame | undefined, point: LonLat) => {
      if (!storyRef.current) ask(frame, point);
    },
    [ask],
  );

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
    url.search = paramsOf(selection, story, liveFrame);
    window.history.replaceState(null, "", url);
  }, [selection, story, linkPending, liveFrame]);

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

  const chooseLens = (lens: LensId) => {
    if (selection === undefined) return;
    if (selection.kind === "case") {
      if (lens === selection.item.lens) return;
      const frame = frameUnder(frames, selection.item.focus);
      ask(frame, selection.item.focus, lens, selection.item);
      return;
    }
    if (lens === selection.lens) return;
    if (selection.fromCase !== undefined && lens === selection.fromCase.lens) {
      openCase(selection.fromCase);
      return;
    }
    ask(selection.frame, selection.point, lens, selection.fromCase, selection.area);
  };

  // The pair is chosen after the lens: the choice starts the run and goes into the shared link.
  const measurePair = (current: typeof live, choice: InsarChoice) => {
    if (current === undefined) return;
    ask(current.frame, current.point, current.lens, current.fromCase, current.area, choice);
  };
  const measureLivePair = (fromCase: Case) => {
    const frame = frameUnder(frames, fromCase.focus);
    ask(frame, fromCase.focus, "insar", fromCase);
  };

  const item = selection?.kind === "case" ? selection.item : undefined;
  const subject: Subject | undefined =
    item !== undefined && item.pending !== true
      ? caseSubject(item)
      : live !== undefined && phase === "done" && exploredView !== undefined
        ? exploreSubject(exploredView, {
            name: liveName(live),
            frameLabel:
              exploredView.plan?.seriesKey ??
              (liveFrame ? `Track ${liveFrame.track} · Frame ${liveFrame.frame}` : "NISAR catalog"),
            point: live.point,
          })
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
  const liveLayer = layers.find((layer) => layer.id === layerId);

  const tourItem = storyCase();
  const storyItem = story ? tourItem : undefined;
  const scene =
    storyItem === undefined
      ? sceneOf(selection, !running, drapeKind, opacity, {
          place,
          liveDrape: liveLayer && { url: liveLayer.href, bounds: liveLayer.bounds },
          gridMetres: gridMetresOf(exploredView),
        })
      : storyScene(storyItem, chapter, opacity);
  const context: ContextChip | undefined =
    item !== undefined
      ? { icon: item.hazard, name: item.name, when: item.when }
      : live !== undefined
        ? {
            icon: findLens(live.lens)?.icon ?? "flood",
            name: liveName(live),
            when: "Live question",
          }
        : undefined;

  const draft = draftOf(draw);
  const draftKm2 = draft?.closed === true ? ringAreaKm2(draft.ring) : 0;
  const draftView = draft && { ...draft, km2: draftKm2, level: levelOf(draftKm2) };
  const toolsOffWhy = story
    ? "Not available during the guided tour"
    : unavailable
      ? "The 3D globe isn't available in this browser"
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
          context={context}
          tools={
            <>
              <AreaTools tool={draw.tool} disabledWhy={toolsOffWhy} onTool={chooseTool} />
              <SourceSwitch />
            </>
          }
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
              onSearch={() => setSearchOpen(true)}
            />
            {draw.tool === undefined && <HintPill />}
          </>
        )}

        {selection === undefined && !story && place !== undefined && (
          <PlaceCard
            place={place}
            frame={placeFrame}
            onAnalyse={() => askArea({ kind: "point", point: place.point })}
            onClose={close}
          />
        )}

        {selection !== undefined && (
          <CasePanel
            meta={
              item !== undefined
                ? `${item.pending === true ? "Event context" : "Measured case"} · ${item.region}`
                : liveFrame
                  ? `Live question · Track ${liveFrame.track} · Frame ${liveFrame.frame}`
                  : "Live question · NISAR catalog"
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
            onLens={chooseLens}
            onToggle={() => (sheetOpen ? setSheetOpen(false) : setCollapsed(!collapsed))}
            onClose={close}
          >
            {item?.pending === true && <PendingSummary item={item} />}
            {subject !== undefined && (
              <ResultSummary subject={subject} mode={mode} onMore={() => setSheetOpen(true)} />
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
            {liveRuns && running && !modalOpen && (
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
            selectedId={layerId}
            opacity={opacity}
            onSelect={(id) => setLayerChoice({ runKey, id })}
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
            <PassTimeline key={runKey} data={liveTimeline} demo={false} />
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
            exploration={subject.kind === "live" ? exploredView : undefined}
            isArea={live !== undefined && live.area.kind !== "point"}
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

// A searched place: the camera goes there and the square the radar would read is drawn.
const placeScene = (place: Place, empty: GlobeScene): GlobeScene => ({
  ...empty,
  target: { key: `place|${place.id}`, ...placeFraming(place) },
  outline: {
    ring: squareAround(place.point, AOI_SIDE_KM),
    label: `${AOI_SIDE_KM} km square · ${place.name}`,
    processing: false,
  },
  point: place.point,
});

type SceneExtras = {
  // A searched place waiting to be asked about.
  place?: Place | undefined;
  // The layer of the live result drawn on the globe.
  liveDrape?: Drape | undefined;
  // Posting the service reported for the live result, in metres.
  gridMetres?: number | undefined;
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
  const { place, liveDrape, gridMetres: liveGrid } = extras;
  const empty: GlobeScene = {
    target: undefined,
    outline: undefined,
    point: undefined,
    frame: undefined,
    selectedCaseId: undefined,
    drape: undefined,
    drapeAlpha: opacity / 100,
  };
  if (selection === undefined) return place === undefined ? empty : placeScene(place, empty);
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
