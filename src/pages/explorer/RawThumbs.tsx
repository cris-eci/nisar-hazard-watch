import { STEP_4 } from "@/content/copyV8";
import { Prov } from "@/features/case-panel/Prov";
import { SOURCE } from "@/features/case-panel/verdicts";
import type { TimelinePass } from "@/features/cases/cases";
import type { DockPick } from "@/features/explore/exploreDock";
import { changeLayer, passLayer, type LiveLayer } from "@/features/explore/exploreLayers";
import { formatDay } from "@/features/timeline/timelineLayout";

type RawThumbsProps = {
  layers: LiveLayer[];
  passes: TimelinePass[];
  date: string;
  pick: DockPick;
  onPick: (pick: DockPick) => void;
};

type Thumb = {
  key: "hh" | "hv" | "change";
  label: string;
  scale: string;
  layer: LiveLayer | undefined;
  pick: DockPick;
};

// SPECS-v8 §4: the selected pass's HH and HV, and the change map. A missing image is an empty tile,
// never another date's image.
export const RawThumbs = ({ layers, passes, date, pick, onPick }: RawThumbsProps) => {
  const k = passes.findIndex((item) => item.date === date) + 1;
  const change = changeLayer(layers);
  const thumbs: Thumb[] = [
    {
      key: "hh",
      label: STEP_4.thumbHH,
      scale: STEP_4.thumbHHScale,
      layer: passLayer(layers, date, "HH"),
      pick: { kind: "pass", pol: "HH" },
    },
    {
      key: "hv",
      label: STEP_4.thumbHV,
      scale: STEP_4.thumbHVScale,
      layer: passLayer(layers, date, "HV"),
      pick: { kind: "pass", pol: "HV" },
    },
    {
      key: "change",
      label: STEP_4.thumbChange,
      scale: STEP_4.thumbChangeScale,
      layer: change,
      pick: change === undefined ? undefined : { kind: "layer", id: change.id },
    },
  ];
  const isOn = (thumb: Thumb): boolean =>
    thumb.layer !== undefined &&
    pick !== undefined &&
    thumb.pick !== undefined &&
    (pick.kind === "pass"
      ? thumb.pick.kind === "pass" && thumb.pick.pol === pick.pol
      : thumb.pick.kind === "layer" && thumb.pick.id === pick.id);
  return (
    <div className="x-raw" data-testid="raw-thumbs">
      <p className="x-kicker x-kicker--split">
        <span data-testid="raw-kicker">
          {STEP_4.kicker(formatDay(date).toUpperCase(), k, passes.length)}
        </span>
        <Prov kind="realDates" source={SOURCE.liveTimeline} />
      </p>
      <div className="x-raw__grid">
        {thumbs.map((thumb) => (
          <button
            key={thumb.key}
            type="button"
            className="x-raw__thumb"
            aria-pressed={isOn(thumb)}
            disabled={thumb.layer === undefined}
            onClick={() => onPick(thumb.pick)}
            data-testid={`raw-thumb-${thumb.key}`}
          >
            {thumb.layer === undefined ? (
              <span className="x-raw__empty" data-testid={`raw-empty-${thumb.key}`}>
                {STEP_4.noImage}
              </span>
            ) : (
              <img className="x-raw__img" src={thumb.layer.href} alt={thumb.layer.title} />
            )}
            <span className="x-raw__label">{thumb.label}</span>
            <span className="x-raw__scale">{thumb.scale}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
