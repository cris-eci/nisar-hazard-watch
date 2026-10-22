import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

gsap.registerPlugin(ScrollTrigger);

type CompareSliderProps = {
  reducedMotion: boolean;
};

const KEY_STEP = 5;

const clamp = (value: number): number => Math.max(0, Math.min(100, value));

// Radar on the left of the split, optical on the right. Drag anywhere on the frame, or focus the
// handle and use the arrow keys.
export const CompareSlider = ({ reducedMotion }: CompareSliderProps) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const intro = useRef<gsap.core.Tween>(undefined);
  const [split, setSplit] = useState(reducedMotion ? 50 : 92);

  useEffect(() => {
    const frame = frameRef.current;
    if (reducedMotion || frame === null) return;
    // Opens almost all radar, then slides to the middle once, so the reader sees it can move.
    const value = { split: 92 };
    intro.current = gsap.to(value, {
      split: 50,
      duration: 1.6,
      ease: "power3.inOut",
      scrollTrigger: { trigger: frame, start: "top 55%", once: true },
      onUpdate: () => {
        if (!dragging.current) setSplit(value.split);
      },
    });
    return () => {
      intro.current?.scrollTrigger?.kill();
      intro.current?.kill();
    };
  }, [reducedMotion]);

  const takeOver = () => {
    intro.current?.scrollTrigger?.kill();
    intro.current?.kill();
  };

  const splitAt = (clientX: number) => {
    const frame = frameRef.current;
    if (frame === null) return;
    const { left, width } = frame.getBoundingClientRect();
    setSplit(clamp(((clientX - left) / width) * 100));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    takeOver();
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    splitAt(event.clientX);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) splitAt(event.clientX);
  };

  const onPointerEnd = () => {
    dragging.current = false;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next: Record<string, (value: number) => number> = {
      ArrowLeft: (value) => value - KEY_STEP,
      ArrowDown: (value) => value - KEY_STEP,
      ArrowRight: (value) => value + KEY_STEP,
      ArrowUp: (value) => value + KEY_STEP,
      Home: () => 0,
      End: () => 100,
    };
    const step = next[event.key];
    if (step === undefined) return;
    event.preventDefault();
    takeOver();
    setSplit((value) => clamp(Math.round(step(value))));
  };

  const value = Math.round(split);

  return (
    <div
      ref={frameRef}
      className="l-compare__frame"
      data-reveal
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onPointerLeave={onPointerEnd}
    >
      <img
        src="/landing/optical-north-dakota.jpg"
        alt="Sentinel-2 view of farmland along the Forest River, North Dakota, mostly hidden under cumulus cloud"
        width={1580}
        height={851}
        draggable={false}
      />
      <img
        src="/landing/radar-north-dakota.jpg"
        alt="NISAR radar view of the same farmland, every field visible"
        width={2048}
        height={1103}
        draggable={false}
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
      />
      <div className="l-compare__line" style={{ left: `${split}%` }}>
        <div
          className="l-compare__handle"
          role="slider"
          tabIndex={0}
          aria-label="Radar and optical split"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={`${value}% radar`}
          onKeyDown={onKeyDown}
          data-testid="compare-slider"
        >
          <span aria-hidden="true">◂ ▸</span>
        </div>
      </div>
      <span className="s-chip l-compare__chip l-compare__chip--left">
        NISAR RADAR · 23 AUG 2025
      </span>
      <span className="s-chip l-compare__chip l-compare__chip--right">
        SENTINEL-2 · 24 AUG 2025
      </span>
    </div>
  );
};
