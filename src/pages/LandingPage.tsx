import type { ReactNode } from "react";

import { ENABLED_HAZARDS } from "@/features/analysis/hazards";
import { FEATURED_EVENTS } from "@/features/events/events";
import { APP_NAME } from "@/lib/appName";
import { Link } from "@/lib/Link";

const enabledIds = new Set<string>(ENABLED_HAZARDS.map(({ id }) => id));
const events = FEATURED_EVENTS.filter(({ hazard }) => enabledIds.has(hazard));
const hasDeformation = ENABLED_HAZARDS.some(({ kind }) => kind === "deformation");

const WHY_RADAR = [
  {
    title: "Sees through clouds and smoke",
    body: "Optical satellites go blind over an active fire or a tropical storm. Radar brings its own signal and still sees the ground.",
  },
  {
    title: "Every 12 days, day and night",
    body: "NISAR maps almost all of Earth's land on a fixed 12-day cycle, so every change has a clean before and after.",
  },
  {
    title: "Down to the centimetre",
    body: "L-band radar reaches through forest canopy and, comparing two passes, measures how far the ground moved.",
  },
];

const Badge = ({ children }: { children: ReactNode }) => (
  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-300">
    {children}
  </span>
);

export const LandingPage = () => (
  <div className="min-h-dvh bg-slate-950 text-slate-100">
    <a
      href="#main"
      className="sr-only rounded-md bg-sky-500 px-4 py-2 text-slate-950 focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10"
    >
      Skip to content
    </a>
    <header className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.18),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(249,115,22,0.15),transparent_55%)]"
      />
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg">{APP_NAME}</span>
        <div className="flex gap-5 text-sm text-slate-300">
          <Link to="/method" className="hover:text-white">
            Method
          </Link>
          <Link to="/explore" className="hover:text-white">
            Explorer
          </Link>
        </div>
      </nav>

      <div id="main" className="relative mx-auto max-w-4xl px-6 pt-16 pb-24 text-center">
        <div className="flex flex-wrap justify-center gap-2">
          <Badge>NASA-ISRO NISAR · L-band radar</Badge>
          <Badge>Data: ASF DAAC</Badge>
          <Badge>NASA Space Apps 2026</Badge>
        </div>
        <h1 className="mt-8 text-4xl leading-tight sm:text-6xl">
          See how Earth changes,{" "}
          <span className="bg-gradient-to-r from-sky-300 to-orange-400 bg-clip-text text-transparent">
            through clouds, smoke and darkness
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          {APP_NAME} turns NISAR radar passes into maps anyone can read: where a fire burned
          {hasDeformation ? ", how far the ground moved in an earthquake" : ""}, and how sure we are
          about it.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/explore"
            testId="cta-explore"
            className="rounded-lg bg-sky-500 px-6 py-3 text-slate-950 hover:bg-sky-400"
          >
            Launch the explorer
          </Link>
          {events[0] !== undefined && (
            <Link
              to={`/explore?event=${events[0].id}`}
              className="rounded-lg border border-white/20 px-6 py-3 hover:border-white/40"
            >
              See a real event
            </Link>
          )}
          <Link
            to="/method"
            className="rounded-lg border border-white/20 px-6 py-3 hover:border-white/40"
          >
            Method &amp; validation
          </Link>
        </div>
      </div>
    </header>

    <main>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl">Why radar</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {WHY_RADAR.map(({ title, body }) => (
            <article key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg">{title}</h3>
              <p className="mt-2 text-slate-400">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl">Featured events</h2>
        <p className="mt-2 text-slate-400">
          Real events with real NISAR passes before and after. Open one to fly there.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/explore?event=${event.id}`}
              className="block rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:border-white/30"
            >
              <p className="text-xs tracking-wide text-slate-500 uppercase">
                {event.date} · {event.place}
              </p>
              <h3 className="mt-1 text-lg">{event.title}</h3>
              <p className="mt-2 text-slate-400">{event.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-orange-500/10 p-8">
          <h2 className="text-2xl">Validated, not just visualised</h2>
          <p className="mt-2 max-w-3xl text-slate-300">
            Each map is checked against an independent source: burn scars against NASA FIRMS fire
            detections and optical burn indices
            {hasDeformation ? ", ground motion against GNSS stations" : ""}.
          </p>
          <p className="mt-2 text-sm text-amber-300">
            Prototype: validation figures are demo values until the pipeline runs on the featured
            events.
          </p>
          <Link to="/method" className="mt-4 inline-block text-sky-300 hover:underline">
            Read the method and validation →
          </Link>
        </div>
      </section>
    </main>

    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-500">
        Data: NASA-ISRO NISAR via the Alaska Satellite Facility DAAC, NASA NISAR Observation Plan,
        USGS earthquake catalogue. Imagery © Esri. Built for the NASA International Space Apps
        Challenge 2026.
      </div>
    </footer>
  </div>
);
