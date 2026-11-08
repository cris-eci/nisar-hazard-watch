import "@/pages/site/site.css";
import "@/features/charts/charts.css";
import "@/pages/explorer/explorer.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CasePanel } from "@/features/case-panel/CasePanel";
import { PendingSummary, ResultSummary } from "@/features/case-panel/CaseSummary";
import { ShowRealContext } from "@/features/case-panel/showReal";
import { caseSubject, liveSubject, type Subject } from "@/features/case-panel/subject";
import {
  CASES,
  chipBounds,
  findCase,
  findLens,
  LENSES,
  type Case,
  type LensId,
} from "@/features/cases/cases";
import type { ChartMode } from "@/features/charts/chartTokens";
import type { Frame, LonLat } from "@/features/frames/frame.types";
import { findFrameAt, loadFrames } from "@/features/frames/frames";
import { GlobeView, type GlobeScene } from "@/features/globe/GlobeView";
import { formatLonLat, gridMetres, LIVE_CHIP_KM, liveAnswer } from "@/features/live/liveQuestion";
import { JobChecklist, JobProblem, PlanPasses } from "@/features/live/LiveSummary";
import { useLiveJob } from "@/features/live/useLiveJob";
import { MoreInfoSheet } from "@/features/sheet/MoreInfoSheet";
import { PassTimeline } from "@/features/timeline/PassTimeline";
import { useAsync } from "@/lib/useAsync";
import { LayerDock, type DrapeKind } from "@/pages/explorer/LayerDock";
import { HintPill, StartCard } from "@/pages/explorer/StartCard";
import { TopBar, type ContextChip } from "@/pages/explorer/TopBar";

type Selection =
  | { kind: "case"; item: Case }
  | {
      kind: "live";
      frame: Frame;
      point: LonLat;
      lens: LensId;
      // A live question started from a case's lens chips can go back to that case.
      fromCase: Case | undefined;
      run: number;
    };

const DEFAULT_LENS: LensId = "flood_wetland";
const CHIP_ZOOM = 3.2;
// Chocó has no processed square yet, so the camera shows the region around the event instead.
const REGION_KM = 240;
const REGION_ZOOM = 1;
const STEP_MS = 1000;
const REDUCED_STEP_MS = 80;
const DEFAULT_OPACITY = 85;
const today = new Date().toISOString().slice(0, 10);

const isLens = (value: string | null): value is LensId => LENSES.some((lens) => lens.id === value);

// Shared links: ?case=<id>, or ?frame=<track-frame>[&lens=<id>] for a live question.
const readParams = () => {
  const params = new URLSearchParams(window.location.search);
  const lens = params.get("lens");
  return {
    item: findCase(params.get("case")),
    frameId: params.get("frame"),
    lens: isLens(lens) ? lens : DEFAULT_LENS,
  };
};

const paramsOf = (selection: Selection | undefined): string => {
  if (selection === undefined) return "";
  if (selection.kind === "case") return new URLSearchParams({ case: selection.item.id }).toString();
  return new URLSearchParams({
    frame: selection.frame.id,
    ...(selection.lens !== DEFAULT_LENS && { lens: selection.lens }),
  }).toString();
};

const frameUnder = (frames: Frame[], point: LonLat): Frame | undefined =>
  findFrameAt(frames, point, "A") ?? findFrameAt(frames, point, "D");

const bboxCentre = ({ bbox: [west, south, east, north] }: Frame): LonLat => [
  (west + east) / 2,
  (south + north) / 2,
];

const country = (item: Case): string => item.place.split(",").at(-1)?.trim() ?? item.place;

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const ExplorerPage = () => {
  const [initial] = useState(readParams);
  const [selection, setSelection] = useState<Selection | undefined>(
    initial.item && { kind: "case", item: initial.item },
  );
  // A shared ?frame= link can only open once the frames snapshot is in.
  const linkRef = useRef(initial.item === undefined ? initial.frameId : null);
  const [linkPending, setLinkPending] = useState(
    initial.item === undefined && initial.frameId !== null,
  );
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
    (frame: Frame, point: LonLat, lens: LensId = DEFAULT_LENS, fromCase?: Case) => {
      setSelection((previous) => ({
        kind: "live",
        frame,
        point,
        lens,
        fromCase,
        run: previous?.kind === "live" ? previous.run + 1 : 0,
      }));
      setCollapsed(false);
      setSheetOpen(false);
      setHelpOpen(false);
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
        if (frame !== undefined) ask(frame, bboxCentre(frame), initial.lens);
        setLinkPending(false);
      }
      return loaded;
    },
    [ask, initial.lens],
  );
  const { state: framesState, retry: retryFrames } = useAsync(loadFramesAndLink, "frames");
  const frames = useMemo(
    () => (framesState?.status === "success" ? framesState.data : []),
    [framesState],
  );

  const live = selection?.kind === "live" ? selection : undefined;
  const runKey = live === undefined ? "" : `${live.point.join(",")}|${live.lens}|${live.run}`;
  const job = useLiveJob(live?.frame, runKey, reduceMotion ? REDUCED_STEP_MS : STEP_MS);
  const liveFrameId = live?.frame.id;
  const answer = useMemo(
    () => (liveFrameId === undefined ? undefined : liveAnswer(liveFrameId)),
    [liveFrameId],
  );

  const openCase = useCallback((item: Case) => {
    setSelection({ kind: "case", item });
    setCollapsed(false);
    setSheetOpen(false);
    setHelpOpen(false);
    setDrapeKind("change");
  }, []);

  const onGlobeAsk = useCallback((frame: Frame, point: LonLat) => ask(frame, point), [ask]);

  useEffect(() => {
    if (linkPending) return;
    const url = new URL(window.location.href);
    url.search = paramsOf(selection);
    window.history.replaceState(null, "", url);
  }, [selection, linkPending]);

  const close = useCallback(() => {
    setSelection(undefined);
    setSheetOpen(false);
  }, []);

  const wholeGlobe = () => {
    close();
    setHelpOpen(false);
    setHomeRequest((count) => count + 1);
  };

  // Esc closes the innermost thing first: menu, then sheet, then the selection (SPECS §4).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (helpOpen) setHelpOpen(false);
      else if (sheetOpen) setSheetOpen(false);
      else close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen, sheetOpen, close]);

  const chooseLens = (lens: LensId) => {
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
    ask(selection.frame, selection.point, lens, selection.fromCase);
  };

  const item = selection?.kind === "case" ? selection.item : undefined;
  const subject: Subject | undefined =
    item !== undefined && item.pending !== true
      ? caseSubject(item)
      : live !== undefined && answer !== undefined && job.ready
        ? liveSubject(
            live.point,
            live.lens,
            `Track ${live.frame.track} · Frame ${live.frame.frame}`,
            answer,
          )
        : undefined;

  const scene = sceneOf(selection, job.ready, drapeKind, opacity);
  const context: ContextChip | undefined =
    item !== undefined
      ? { icon: item.hazard, name: item.name, when: item.when }
      : live !== undefined
        ? {
            icon: findLens(live.lens)?.icon ?? "flood",
            name: formatLonLat(live.point),
            when: "Live question",
          }
        : undefined;

  const showTimeline = item?.timeline !== undefined && item.pending !== true && !sheetOpen;
  const showDock = item?.crops !== undefined && !sheetOpen;

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
            view={sheetOpen ? "sheet" : "panel"}
            reduceMotion={reduceMotion}
            homeRequest={homeRequest}
            onOpenCase={openCase}
            onAsk={onGlobeAsk}
            onUnavailable={() => setUnavailable(true)}
          />
        )}

        <TopBar
          context={context}
          helpOpen={helpOpen}
          showReal={showReal}
          reduceMotion={reduceMotion}
          onHelp={setHelpOpen}
          onShowReal={setShowReal}
          onReduceMotion={setReduceMotion}
          onWholeGlobe={wholeGlobe}
        />

        {selection === undefined && (
          <>
            <StartCard frames={framesState} onOpen={openCase} onRetryFrames={retryFrames} />
            <HintPill />
          </>
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
                : formatLonLat(live?.point ?? [0, 0])
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
            {live !== undefined &&
              !job.ready &&
              (job.plan?.status === "error" ||
              (job.plan?.status === "success" && job.plan.data.length === 0) ? (
                <JobProblem job={job} onPickCase={close} />
              ) : (
                <JobChecklist lens={live.lens} done={job.done} />
              ))}
            {live !== undefined && job.plan?.status === "success" && job.plan.data.length > 0 && (
              <PlanPasses passes={job.plan.data} today={today} />
            )}
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

        {showTimeline && item.timeline !== undefined && (
          <div className="x-timeline-wrap" data-collapsed={collapsed}>
            <PassTimeline key={item.id} data={item.timeline} />
          </div>
        )}

        {sheetOpen && subject !== undefined && (
          <MoreInfoSheet
            subject={subject}
            mode={mode}
            onMode={setMode}
            onClose={() => setSheetOpen(false)}
          />
        )}
      </main>
    </ShowRealContext>
  );
};

// What the globe draws for the current selection.
const sceneOf = (
  selection: Selection | undefined,
  ready: boolean,
  kind: DrapeKind,
  opacity: number,
): GlobeScene => {
  const empty: GlobeScene = {
    target: undefined,
    outline: undefined,
    point: undefined,
    frame: undefined,
    selectedCaseId: undefined,
    drape: undefined,
    drapeAlpha: opacity / 100,
  };
  if (selection === undefined) return empty;
  if (selection.kind === "live") {
    const box = chipBounds(selection.point, LIVE_CHIP_KM);
    return {
      ...empty,
      target: { key: `live|${selection.point.join(",")}`, box, zoom: CHIP_ZOOM },
      outline: {
        box,
        label: `Processed area · ${LIVE_CHIP_KM} km · ${gridMetres(LIVE_CHIP_KM)} m grid`,
        processing: !ready,
      },
      point: selection.point,
      frame: selection.frame,
    };
  }
  const { item } = selection;
  if (item.chipKm === undefined) {
    const pending = item.pending === true;
    return {
      ...empty,
      target: {
        key: item.id,
        box: chipBounds(item.focus, pending ? REGION_KM : LIVE_CHIP_KM),
        zoom: pending ? REGION_ZOOM : CHIP_ZOOM,
      },
      selectedCaseId: item.id,
    };
  }
  const box = chipBounds(item.focus, item.chipKm);
  return {
    ...empty,
    target: { key: item.id, box, zoom: CHIP_ZOOM },
    outline: {
      box,
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
