import { useEffect, useRef, useState, type PointerEvent } from "react";

import type { TeardownScene } from "@/pages/method/teardownScene";
import { TEARDOWN_STEPS, type TeardownStep } from "@/pages/method/teardownSteps";
import { prefersReducedMotion } from "@/pages/site/siteMotion";

type Status = "waiting" | "loading" | "ready" | "error";

const LAST = TEARDOWN_STEPS.length - 1;

// Scroll progress through the section, from 0 (first step) to LAST.
const progressOf = (section: HTMLElement): number => {
  const rect = section.getBoundingClientRect();
  const travel = rect.height - window.innerHeight;
  if (!(travel > 0)) return 0;
  return Math.min(1, Math.max(0, -rect.top / travel)) * LAST;
};

const StepText = ({ step, index }: { step: TeardownStep; index: number }) => (
  <>
    <p className="m-teardown__kicker">
      {String(index + 1).padStart(2, "0")} / 0{TEARDOWN_STEPS.length} · {step.kicker}
    </p>
    <h2 className="m-teardown__title">{step.title}</h2>
    <p className="m-teardown__body">{step.body}</p>
    {step.facts.length > 0 && (
      <div className="m-teardown__facts">
        {step.facts.map(({ value, label }) => (
          <div key={label}>
            <span className="m-teardown__fact-value">{value}</span>
            <span className="m-teardown__fact-label">{label}</span>
          </div>
        ))}
      </div>
    )}
  </>
);

// Without WebGL the six steps read as a plain list beside the artist's concept.
const TeardownFallback = () => (
  <section className="m-teardown-list" aria-label="How NISAR is built" data-testid="teardown">
    <img
      src="/landing/nisar-concept.jpg"
      alt="Artist's concept of NISAR above Earth, its 12 m gold mesh reflector open on a long boom"
      width={1280}
      height={989}
      loading="lazy"
    />
    <ol>
      {TEARDOWN_STEPS.map((step, i) => (
        <li key={step.kicker}>
          <StepText step={step} index={i} />
        </li>
      ))}
    </ol>
  </section>
);

// A scroll-driven, stylised 3D teardown of the NISAR spacecraft. three.js and the model load only
// when the section comes near the viewport, and rendering pauses while it is off screen.
export const SatelliteTeardown = () => {
  const section = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const callout = useRef<HTMLDivElement>(null);
  const scene = useRef<TeardownScene>(undefined);
  const [status, setStatus] = useState<Status>("waiting");
  const [step, setStep] = useState(0);
  const [dragged, setDragged] = useState(false);
  const dragX = useRef<number | undefined>(undefined);

  useEffect(() => {
    const element = section.current;
    const canvasHost = host.current;
    if (element === null || canvasHost === null) return;
    const reduced = prefersReducedMotion();
    let disposed = false;
    let visible = false;
    let frame = 0;
    let shownStep = 0;

    const loop = () => {
      frame = requestAnimationFrame(loop);
      const current = scene.current;
      if (current === undefined) return;
      const p = progressOf(element);
      const near = Math.round(p);
      if (near !== shownStep) {
        shownStep = near;
        setStep(near);
      }
      const point = current.render(p);
      const label = callout.current;
      if (label === null) return;
      if (point === undefined) {
        label.style.opacity = "0";
        return;
      }
      // The label slides back on screen when the part sits near the right edge.
      const maxX = element.clientWidth - label.offsetWidth - 8;
      const x = Math.min(maxX, canvasHost.offsetLeft + point.x - 4);
      label.style.transform = `translate(${x}px, ${canvasHost.offsetTop + point.y - 12}px)`;
      label.style.opacity = String(Math.max(0, 1 - Math.abs(p - near) * 4));
    };

    const load = async () => {
      setStatus("loading");
      try {
        const { createTeardownScene } = await import("@/pages/method/teardownScene");
        if (disposed) return;
        scene.current = createTeardownScene(canvasHost, reduced);
        setStatus("ready");
        if (visible) loop();
      } catch {
        if (!disposed) setStatus("error");
      }
    };

    const nearby = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting !== true) return;
        nearby.disconnect();
        void load();
      },
      { rootMargin: "100% 0px" },
    );
    nearby.observe(element);

    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting === true;
      cancelAnimationFrame(frame);
      if (visible) loop();
    });
    onScreen.observe(element);

    return () => {
      disposed = true;
      nearby.disconnect();
      onScreen.disconnect();
      cancelAnimationFrame(frame);
      scene.current?.dispose();
      scene.current = undefined;
    };
  }, []);

  const goTo = (index: number) => {
    const element = section.current;
    if (element === null) return;
    const travel = element.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: element.offsetTop + (index / LAST) * travel,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragX.current === undefined) return;
    scene.current?.drag(event.clientX - dragX.current);
    dragX.current = event.clientX;
    setDragged(true);
  };
  const onPointerUp = () => {
    dragX.current = undefined;
  };

  if (status === "error") return <TeardownFallback />;

  const current = TEARDOWN_STEPS[step] ?? TEARDOWN_STEPS[0];

  return (
    <section
      ref={section}
      className="m-teardown"
      aria-label="How NISAR is built"
      data-testid="teardown"
    >
      <div className="m-teardown__stage">
        <div
          ref={host}
          className="m-teardown__canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        <div ref={callout} className="m-teardown__callout" aria-hidden="true">
          <span className="m-teardown__callout-dot" />
          <span className="m-teardown__callout-line" />
          <span className="m-teardown__callout-tag">{current?.tag}</span>
        </div>
        <div className="m-teardown__panel" aria-live="polite">
          <div className="m-teardown__text">
            {current !== undefined && <StepText step={current} index={step} />}
          </div>
        </div>
        <nav className="m-teardown__rail" aria-label="Teardown steps">
          {TEARDOWN_STEPS.map(({ kicker }, i) => (
            <button
              key={kicker}
              type="button"
              aria-label={kicker}
              title={kicker}
              aria-current={i === step ? "step" : undefined}
              onClick={() => goTo(i)}
            >
              <span />
            </button>
          ))}
        </nav>
        <p className="m-teardown__hint">
          <span>{dragged ? "SCROLL TO CONTINUE" : "DRAG TO TURN · SCROLL TO TAKE APART"}</span>
          <span className="m-teardown__hint-note">STYLISED MODEL · PROPORTIONS APPROXIMATE</span>
        </p>
        {status !== "ready" && <p className="m-teardown__loading">LOADING MODEL…</p>}
      </div>
    </section>
  );
};
