import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { Icon } from "@/features/case-panel/icons";

type CompareSplitProps = {
  left: { src: string; label: string };
  right: { src: string; label: string };
};

const STEP = 5;
const clamp = (value: number): number => Math.min(100, Math.max(0, value));

// Drag-to-split (SPECS §4): the right image is clipped from the left edge to the handle.
export const CompareSplit = ({ left, right }: CompareSplitProps) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(50);

  const moveTo = (clientX: number) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (box === undefined || box.width === 0) return;
    setSplit(clamp(((clientX - box.left) / box.width) * 100));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    moveTo(event.clientX);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) moveTo(event.clientX);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") setSplit((value) => clamp(value - STEP));
    else if (event.key === "ArrowRight") setSplit((value) => clamp(value + STEP));
    else return;
    event.preventDefault();
  };

  return (
    <div
      ref={boxRef}
      className="x-split"
      role="slider"
      tabIndex={0}
      aria-label={`${left.label} versus ${right.label}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(split)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onKeyDown={onKeyDown}
      data-testid="compare-split"
    >
      <img src={left.src} alt="" draggable={false} />
      <img
        src={right.src}
        alt=""
        draggable={false}
        style={{ clipPath: `inset(0 0 0 ${split}%)` }}
      />
      <span className="x-split__line" style={{ left: `${split}%` }} />
      <span className="x-split__handle" style={{ left: `${split}%` }}>
        <Icon name="split" size={14} />
      </span>
      <span className="x-split__tag x-split__tag--left">{left.label}</span>
      <span className="x-split__tag x-split__tag--right">{right.label}</span>
    </div>
  );
};
