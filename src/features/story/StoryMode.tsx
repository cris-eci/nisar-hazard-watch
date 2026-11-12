import { useState } from "react";

import { Icon } from "@/features/case-panel/icons";
import { Prov } from "@/features/case-panel/Prov";
import { SOURCE } from "@/features/case-panel/verdicts";
import type { Case } from "@/features/cases/cases";
import { ContrastBars } from "@/features/charts/ContrastBars";
import { gridMetres, GRID_CELLS } from "@/features/live/liveQuestion";
import { NovaGlyph } from "@/features/nova/NovaGlyph";
import { CHAPTERS, chapterCount, LAST_CHAPTER, type Chapter } from "@/features/story/chapters";
import { formatDay } from "@/features/timeline/timelineLayout";

const CHANGE_RAMP = "linear-gradient(90deg,#2f6db5,#f2f0eb,#c2473a)";
const PHOTO_SLOTS = 3;
const SLOT_SOURCE = "Left as a slot until a credited, linked item is copied from its source";

type StoryModeProps = {
  item: Case;
  chapter: number;
  playing: boolean;
  voice: boolean;
  voiceAvailable: boolean;
  onGo: (chapter: number) => void;
  onTogglePlay: () => void;
  onToggleVoice: () => void;
  onExit: () => void;
  onExplore: () => void;
};

// SPECS §5: one card per chapter on the right, the caption bar along the bottom.
export const StoryMode = ({
  item,
  chapter,
  playing,
  voice,
  voiceAvailable,
  onGo,
  onTogglePlay,
  onToggleVoice,
  onExit,
  onExplore,
}: StoryModeProps) => {
  const current = CHAPTERS[chapter] ?? CHAPTERS[0];
  if (current === undefined) return null;
  const last = chapter === LAST_CHAPTER;
  return (
    <div className="x-story" data-testid="story" data-chapter={chapter + 1}>
      <div className="x-story__shade" aria-hidden="true" />
      <div className="x-story__card-wrap">
        <article
          className="x-story__card x-glass"
          aria-label={current.title}
          data-testid="story-card"
        >
          <p className="x-story__kicker">{current.kicker}</p>
          <h2 className="x-story__title">{current.title}</h2>
          <ChapterBody chapter={current} item={item} onExplore={onExplore} />
        </article>
      </div>

      <section className="x-story__bar" aria-label="Story narration" data-testid="story-bar">
        <div className="x-story__progress">
          {CHAPTERS.map((entry, index) => (
            <button
              key={entry.kicker}
              type="button"
              aria-label={`Chapter ${index + 1}: ${entry.title}`}
              title={`Chapter ${index + 1}: ${entry.title}`}
              aria-current={index === chapter ? "step" : undefined}
              data-done={index <= chapter}
              onClick={() => onGo(index)}
              data-testid={`story-segment-${index + 1}`}
            />
          ))}
        </div>
        <div className="x-story__narration">
          <NovaGlyph size={36} />
          <div className="x-story__text">
            <p className="x-story__count" data-testid="story-count">
              {chapterCount(chapter)}
            </p>
            <p className="x-story__caption" aria-live="polite" data-testid="story-caption">
              {current.caption}
            </p>
          </div>
        </div>
        <div className="x-story__controls">
          <button type="button" className="x-story__exit" onClick={onExit} data-testid="story-exit">
            Exit story
          </button>
          <span className="x-top__fill" />
          {voiceAvailable && (
            <button
              type="button"
              className="x-story__round"
              aria-pressed={voice}
              aria-label={voice ? "Mute Nova's voice" : "Turn on Nova's voice"}
              title={voice ? "Mute Nova's voice" : "Turn on Nova's voice"}
              onClick={onToggleVoice}
              data-testid="story-voice"
            >
              <VoiceIcon on={voice} />
            </button>
          )}
          <button
            type="button"
            className="x-story__button"
            onClick={() => onGo(chapter - 1)}
            disabled={chapter === 0}
            aria-label="Previous chapter"
            data-testid="story-back"
          >
            Back
          </button>
          <button
            type="button"
            className="x-story__round"
            onClick={onTogglePlay}
            aria-label={playing ? "Pause the story" : "Play the story"}
            data-testid="story-play"
          >
            <Icon name={playing ? "pause" : "play"} size={13} filled />
          </button>
          <button
            type="button"
            className="x-story__next"
            onClick={() => (last ? onExplore() : onGo(chapter + 1))}
            data-testid="story-next"
          >
            {last ? "Explore" : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
};

type BodyProps = { chapter: Chapter; item: Case; onExplore: () => void };

const ChapterBody = ({ chapter, item, onExplore }: BodyProps) => {
  switch (chapter.card) {
    case "facts":
      return <WhatHappened item={item} />;
    case "where":
      return <Where item={item} />;
    case "map":
      return <MapTiles item={item} />;
    case "witness":
      return <Witness item={item} />;
    case "ground":
      return <OnTheGround />;
    case "end":
      return (
        <>
          <p className="x-story__body">
            At Qadirabad the radar caught most new water, and also flagged existing water. The
            report says so. That honesty is the point: the radar shows what changed and leaves the
            cause open.
          </p>
          <button
            type="button"
            className="x-story__cta"
            onClick={onExplore}
            data-testid="story-explore"
          >
            Explore it yourself
          </button>
        </>
      );
  }
};

type Fact = { k: string; v: string; todo?: boolean };

const Facts = ({ facts }: { facts: Fact[] }) => (
  <dl className="x-story__facts">
    {facts.map((fact) => (
      <div key={fact.k} data-todo={fact.todo === true}>
        <dt>{fact.k}</dt>
        <dd>
          {fact.todo === true ? <span className="x-story__slot">{fact.v}</span> : fact.v}
          {fact.todo === true && <Prov kind="todo" source={SLOT_SOURCE} />}
        </dd>
      </div>
    ))}
  </dl>
);

const WhatHappened = ({ item }: { item: Case }) => {
  const bulletin = item.sources[0];
  return (
    <>
      <Facts
        facts={[
          { k: "River", v: "Chenab, Punjab, Pakistan" },
          { k: "Bulletins", v: "PMD / FFD · 22–24 Jul 2026" },
          { k: "Surveyed flood map", v: "None supplied" },
          { k: "Areas affected", v: "[from the PMD/FFD bulletin]", todo: true },
          { k: "People affected", v: "[official figure only]", todo: true },
        ]}
      />
      <p className="x-story__note">
        Facts come from the PMD/FFD bulletin. Bracketed items stay empty until we copy them from the
        source.{" "}
        {bulletin !== undefined && (
          <a href={bulletin.href} target="_blank" rel="noopener">
            Open the bulletin
          </a>
        )}
      </p>
    </>
  );
};

const Where = ({ item }: { item: Case }) => {
  const [lon, lat] = item.focus;
  const baseline = item.timeline?.passes.filter((pass) => pass.kind === "base").length;
  return (
    <Facts
      facts={[
        { k: "Point", v: `${lat.toFixed(3)}° N, ${lon.toFixed(3)}° E` },
        {
          k: "Area asked",
          v:
            item.chipKm === undefined
              ? `${GRID_CELLS} × ${GRID_CELLS} analysis cells`
              : `${GRID_CELLS} × ${GRID_CELLS} cells · ${item.chipKm} km · ${gridMetres(item.chipKm)} m grid`,
        },
        { k: "NISAR repeat", v: "Every 12 days" },
        ...(baseline === undefined || item.timeline?.onset === undefined
          ? []
          : [
              {
                k: "Baseline",
                v: `${baseline} passes before ${formatDay(item.timeline.onset.date, false)}`,
              },
            ]),
      ]}
    />
  );
};

type TileProps = { src: string; label: string };

const Tile = ({ src, label }: TileProps) => (
  <figure className="x-story__tile">
    <img src={src} alt={label} />
    <figcaption>
      {label}
      <Prov kind="real" source={SOURCE.crop} />
    </figcaption>
  </figure>
);

const targetDay = (item: Case): string =>
  item.target === undefined ? "" : formatDay(item.target, false);

const MapTiles = ({ item }: { item: Case }) =>
  item.crops === undefined ? null : (
    <>
      <div className="x-story__tiles">
        <Tile src={item.crops.base} label="Before · baseline median HH" />
        <Tile src={item.crops.change} label={`Change · ${targetDay(item)}`} />
      </div>
      <div className="x-story__ramp" style={{ background: CHANGE_RAMP }} />
      <p className="x-story__scale">
        <span>−8 dB darker</span>
        <span>0</span>
        <span>+8 dB brighter</span>
      </p>
      <p className="x-story__note">
        Real change map, first assessment minus the baseline median. Blue darkened, red brightened.
      </p>
    </>
  );

const Witness = ({ item }: { item: Case }) => {
  const group = item.groups?.[0];
  const optical = item.timeline?.optical ?? [];
  const opticalLabel =
    optical.length === 2
      ? `OPERA · ${formatDay(optical[0]?.date ?? "", false)} → ${formatDay(optical[1]?.date ?? "", false)}`
      : "OPERA optical";
  return (
    <>
      {item.crops !== undefined && (
        <div className="x-story__tiles">
          <Tile src={item.crops.change} label={`NISAR change · ${targetDay(item)}`} />
          <Tile src={item.crops.optical} label={opticalLabel} />
        </div>
      )}
      {group !== undefined && (
        <div className="x-story__bars">
          <p className="x-kicker x-kicker--split">
            <span>{group.title} · whole area</span>
            <Prov kind="real" source={SOURCE.groups} />
          </p>
          <ContrastBars group={group} mode="plain" compact />
        </div>
      )}
    </>
  );
};

// Chapter 5 is all slots until credited, linked photos and articles are added (DATA_PROVENANCE).
const OnTheGround = () => {
  const [photo, setPhoto] = useState(0);
  const step = (by: number) => setPhoto((value) => (value + by + PHOTO_SLOTS) % PHOTO_SLOTS);
  return (
    <>
      <div className="x-story__photo" data-testid="story-photo-slot">
        <span>Credited photo goes here</span>
        <span className="x-story__photo-n">
          {photo + 1} / {PHOTO_SLOTS}
        </span>
      </div>
      <div className="x-story__credit">
        <button
          type="button"
          className="x-story__round"
          aria-label="Previous photo"
          onClick={() => step(-1)}
        >
          ‹
        </button>
        <p className="x-story__slot">[Photographer · outlet · licence]</p>
        <Prov kind="todo" source={SLOT_SOURCE} />
        <button
          type="button"
          className="x-story__round"
          aria-label="Next photo"
          onClick={() => step(1)}
        >
          ›
        </button>
      </div>
      <div className="x-story__news">
        <p className="x-kicker x-kicker--split">
          <span>In the news</span>
          <Prov kind="todo" source={SLOT_SOURCE} />
        </p>
        <ul>
          {[1, 2, 3].map((n) => (
            <li key={n} data-testid="story-news-slot">
              <span className="x-story__slot">[Headline]</span>
              <span className="x-story__meta">[Outlet · date]</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="x-story__note">
        Photos and articles are slots: add only credited, linked material.
      </p>
    </>
  );
};

const VoiceIcon = ({ on }: { on: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path
      d={
        on
          ? "M4 9v6h4l5 4V5L8 9H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"
          : "M4 9v6h4l5 4V5L8 9H4zM17 9l5 6M22 9l-5 6"
      }
    />
  </svg>
);
