import { useState } from "react";

import { Prov } from "@/features/case-panel/Prov";
import { SOURCE } from "@/features/case-panel/verdicts";
import type { ExplorationResult } from "@/features/explore/exploreSchemas";
import { CompareSplit } from "@/features/sheet/CompareSplit";
import {
  aligned,
  categoryColor,
  gridDescription,
  legendStyle,
  rastersOf,
} from "@/features/sheet/radarViews";

type Props = {
  result: ExplorationResult;
  date: string;
  dates: string[];
  target: string;
  onDate: (date: string) => void;
};

export const RadarImagePanel = ({ result, date, dates, target, onDate }: Props) => {
  const [choice, setChoice] = useState("");
  const [originalChannel, setOriginalChannel] = useState("");
  const [failed, setFailed] = useState<string[]>([]);
  const { layers, visualizations } = rastersOf(result);
  const insar = result.insar != null;
  const availableLayers = layers.filter(
    (layer) =>
      insar ||
      (layer.dates.length === 0 && date === target) ||
      (layer.id.startsWith("display_optical") ? date === target : layer.dates.at(-1) === date),
  );
  const originals = availableLayers.filter((layer) => layer.original);
  const diagnostics = availableLayers.filter((layer) => !layer.original);
  const lensOverlay =
    date === target &&
    diagnostics.find(
      (layer) => layer.kind === "diagnostic" && !layer.id.startsWith("display_optical"),
    );
  const defaultView =
    (lensOverlay || undefined) ??
    diagnostics.find((layer) => layer.kind === (insar ? "coherence" : "change")) ??
    originals[0] ??
    diagnostics[0];
  const views = [
    ...diagnostics,
    ...originals,
    ...visualizations.filter((view) => view.dates.at(-1) === date),
  ];
  const selected = views.find((view) => view.id === choice) ?? defaultView ?? views[0];
  const overlay =
    selected !== undefined &&
    "kind" in selected &&
    ["change", "diagnostic"].includes(selected.kind) &&
    selected.dates.at(-1) === date &&
    !selected.id.startsWith("display_optical");
  const polarization = selected?.id.split("_").at(-1);
  const original = overlay
    ? (originals.find(
        (layer) => layer.polarization === originalChannel && aligned(layer, selected),
      ) ??
      originals.find((layer) => layer.polarization === polarization && aligned(layer, selected)) ??
      originals.find((layer) => aligned(layer, selected)))
    : undefined;
  const grid = selected?.grid;
  const imageFailed = selected !== undefined && failed.includes(selected.url);
  const reportFailure = (url: string) => setFailed((items) => [...items, url]);
  const observation = result.observations.find((row) => row.date === date);
  const support =
    selected && "polarization" in selected && selected.polarization
      ? observation?.valid_pixel_count_by_pol?.[selected.polarization]
      : undefined;
  const ramp = selected && legendStyle(selected.colormap);

  return (
    <section className="x-sheet__section x-radar" aria-label="Measured imagery">
      <header className="x-kicker--split">
        <h3 className="x-sheet__kicker">{insar ? "Interferometric pair" : "Radar imagery"}</h3>
        {selected && <Prov kind="real" source={SOURCE.liveQuality} />}
      </header>
      {!insar && dates.length > 0 && (
        <label className="x-radar__date">
          <span>Acquisition · {date}</span>
          <input
            type="range"
            min={0}
            max={dates.length - 1}
            value={dates.indexOf(date)}
            disabled={dates.length < 2}
            aria-label="Acquisition date"
            aria-valuetext={date}
            onChange={(event) => onDate(dates[Number(event.target.value)] ?? date)}
          />
          <span className="x-radar__ends">
            <span>{dates[0]}</span>
            <span>{dates.at(-1)}</span>
          </span>
        </label>
      )}
      {selected === undefined ? (
        <p className="x-muted" role="status">
          No image is available for this acquisition.
        </p>
      ) : (
        <>
          <label className="x-radar__select">
            View
            <select
              value={selected.id}
              onChange={(event) => {
                setChoice(event.target.value);
                const channel = originals.find(
                  (layer) => layer.id === event.target.value,
                )?.polarization;
                if (channel) setOriginalChannel(channel);
              }}
            >
              {views.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.title}
                </option>
              ))}
            </select>
          </label>
          {imageFailed ? (
            <p className="x-muted" role="status">
              This image could not be loaded.{" "}
              <button
                type="button"
                onClick={() => setFailed((items) => items.filter((url) => url !== selected.url))}
              >
                Retry image
              </button>
            </p>
          ) : original !== undefined && grid != null && !failed.includes(original.url) ? (
            <CompareSplit
              key={selected.id + original.id}
              left={{ src: original.url, label: original.title }}
              right={{ src: selected.url, label: selected.title }}
              aspectRatio={grid.width / grid.height}
              onImageError={reportFailure}
              overlay
            />
          ) : (
            <img
              className="x-radar__image"
              src={selected.url}
              alt={selected.title}
              onError={() => reportFailure(selected.url)}
              style={{ aspectRatio: grid ? grid.width / grid.height : undefined }}
            />
          )}
          <div className="x-radar__legend">
            {selected.legend ? (
              <ul className="x-swatches">
                {Object.entries(selected.legend).map(([key, label]) => (
                  <li key={key}>
                    <i style={{ background: categoryColor(key) }} />
                    {label.replaceAll("_", " ")}
                  </li>
                ))}
              </ul>
            ) : (
              ramp && <span className="x-radar__ramp" style={{ background: ramp }} />
            )}
            {selected.detail.map((line) => (
              <span key={line}>{line}</span>
            ))}
            {selected.dates.length > 0 && <span>Image dates · {selected.dates.join(" · ")}</span>}
            {grid && <span>{gridDescription(grid)}</span>}
            <span>
              Display bounds W, S, E, N ·{" "}
              {selected.bounds.map((value) => value.toFixed(5)).join(", ")}°
            </span>
            {support !== undefined && grid && (
              <span>
                {support.toLocaleString("en-US")} of{" "}
                {(grid.width * grid.height).toLocaleString("en-US")} native cells have usable
                return.
              </span>
            )}
            {overlay && original === undefined && (
              <span>Shown separately. An aligned original is unavailable.</span>
            )}
          </div>
        </>
      )}
      {result.quality.windowTruncated === true && (
        <p className="x-muted">The measured window covers only part of the requested area.</p>
      )}
      {observation?.status !== undefined && observation.status !== "observed" && (
        <p className="x-muted">
          Point return · {(observation.reason ?? observation.status).replaceAll("_", " ")}
        </p>
      )}
      {insar && result.insar?.phaseCells === 0 && (
        <p className="x-muted">Wrapped phase is unavailable at this coherence threshold.</p>
      )}
    </section>
  );
};
