import type { ReactNode } from "react";

import { ENABLED_HAZARDS } from "@/features/analysis/hazards";
import { APP_NAME } from "@/lib/appName";
import { Link } from "@/lib/Link";

const hasDeformation = ENABLED_HAZARDS.some(({ kind }) => kind === "deformation");

type Step = { title: string; body: string };

const CHANGE_STEPS: Step[] = [
  {
    title: "Find the passes",
    body: "Pick two NISAR L2 GCOV scenes of the same track and frame from ASF, before and after the event. Fires need HH+HV passes.",
  },
  {
    title: "Read only the area of interest",
    body: "Stream the pixels inside the area straight from the HDF5 files, mask invalid pixels and average 2×2 blocks to reduce speckle.",
  },
  {
    title: "Compare",
    body: "Compute the log-ratio 10·log10(after / before) of HV backscatter, pixel by pixel.",
  },
  {
    title: "Classify",
    body: "Pixels at or below −2 dB count as burned; −4 and −6 dB split low, moderate and high severity. Area = pixels × pixel size.",
  },
];

const DEFORMATION_STEPS: Step[] = [
  {
    title: "Find a pair that brackets the event",
    body: "Pick a NISAR L2 GUNW interferogram whose first date is before the earthquake and second date after it (USGS catalogue for the time and place).",
  },
  {
    title: "Convert phase to motion",
    body: "Line-of-sight displacement = −λ / 4π × unwrapped phase, with λ = 23.84 cm, after the ionospheric correction GUNW provides.",
  },
  {
    title: "Mask what is unreliable",
    body: "Drop low-coherence pixels (water, dense vegetation that changed) so only trustworthy motion is shown.",
  },
  {
    title: "Summarise",
    body: "Report peak motion toward and away from the satellite and the area that moved more than 2 cm.",
  },
];

type ValidationRow = { what: string; against: string; metric: string; value: string };

const VALIDATION: ValidationRow[] = [
  {
    what: "Burn scar extent",
    against: "NASA FIRMS active-fire detections (VIIRS)",
    metric: "Share of FIRMS detections inside the scar",
    value: "87 %",
  },
  {
    what: "Burn severity",
    against: "Optical dNBR from NASA HLS (cloud-free dates)",
    metric: "Agreement of severity classes",
    value: "0.71 κ",
  },
  ...(hasDeformation
    ? [
        {
          what: "Coseismic displacement",
          against: "GNSS stations (Nevada Geodetic Laboratory)",
          metric: "RMS difference, LOS-projected",
          value: "1.8 cm",
        },
      ]
    : []),
];

const LIMITATIONS = [
  "Steep slopes facing away from the radar are in shadow and cannot be measured.",
  "Rain or soil moisture also change backscatter; comparing passes close in time limits false alarms.",
  "Line-of-sight motion is one component: separating vertical and horizontal motion needs ascending and descending pairs.",
  "NISAR data is still validated as PROVISIONAL by the mission; results inherit that status.",
];

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-14">
    <h2 className="text-2xl">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
);

const Steps = ({ steps }: { steps: Step[] }) => (
  <ol className="grid gap-4 md:grid-cols-2">
    {steps.map(({ title, body }, i) => (
      <li key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-sky-300">Step {i + 1}</p>
        <h3 className="mt-1 text-lg">{title}</h3>
        <p className="mt-1 text-slate-400">{body}</p>
      </li>
    ))}
  </ol>
);

export const MethodPage = () => (
  <div className="min-h-dvh bg-slate-950 text-slate-100">
    <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
      <Link to="/" className="text-lg hover:text-sky-300">
        {APP_NAME}
      </Link>
      <Link
        to="/explore"
        className="rounded-lg bg-sky-500 px-4 py-2 text-sm text-slate-950 hover:bg-sky-400"
      >
        Launch the explorer
      </Link>
    </nav>

    <main className="mx-auto max-w-5xl px-6 pb-20">
      <h1 className="mt-8 text-4xl">Method &amp; validation</h1>
      <p className="mt-4 max-w-3xl text-lg text-slate-300">
        How a pair of NISAR radar passes becomes a map, and how we check that the map is right.
      </p>

      <Section title="Surface change: wildfires">
        <Steps steps={CHANGE_STEPS} />
      </Section>

      {hasDeformation && (
        <Section title="Ground motion: earthquakes">
          <Steps steps={DEFORMATION_STEPS} />
        </Section>
      )}

      <Section title="Validation">
        <div className="flex items-center gap-2">
          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-300">
            Demo values
          </span>
          <p className="text-sm text-slate-400">
            Placeholders until the pipeline runs on the featured events; the comparison method is
            final.
          </p>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="p-3 font-normal">What we check</th>
                <th className="p-3 font-normal">Against</th>
                <th className="p-3 font-normal">Metric</th>
                <th className="p-3 font-normal">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-400">
              {VALIDATION.map((row) => (
                <tr key={row.what}>
                  <td className="p-3 text-slate-200">{row.what}</td>
                  <td className="p-3">{row.against}</td>
                  <td className="p-3">{row.metric}</td>
                  <td className="p-3 text-amber-300">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Limitations">
        <ul className="list-disc space-y-2 pl-5 text-slate-400">
          {LIMITATIONS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="Data sources">
        <ul className="space-y-2 text-slate-400">
          <li>NASA-ISRO NISAR L2 GCOV and GUNW products, Alaska Satellite Facility DAAC.</li>
          <li>NASA NISAR Observation Plan (frames and planned passes).</li>
          <li>USGS earthquake catalogue (event times and epicentres).</li>
          <li>NASA FIRMS and HLS (fire detections and optical burn index, for validation).</li>
        </ul>
      </Section>
    </main>
  </div>
);
