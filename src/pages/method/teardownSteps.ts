export type TeardownPart = "bus" | "solar" | "radars" | "boom" | "reflector";

type Camera = { d: number; az: number; el: number; look: [number, number, number] };

export type TeardownStep = {
  kicker: string;
  title: string;
  body: string;
  tag: string;
  callout?: TeardownPart;
  focus?: TeardownPart[];
  exploded: number;
  beam: number;
  camera: Camera;
  facts: { value: string; label: string }[];
};

export const TEARDOWN_STEPS: TeardownStep[] = [
  {
    kicker: "THE SPACECRAFT",
    title: "A radar you can take apart",
    body: "NISAR is a joint NASA–ISRO mission, launched in July 2025. Scroll to take it apart piece by piece. Drag at any time to turn it.",
    tag: "",
    exploded: 0,
    beam: 0,
    camera: { d: 34, az: 0.32, el: 0.2, look: [5, 4.5, 0] },
    facts: [
      { value: "747 km", label: "ORBIT ALTITUDE" },
      { value: "12 days", label: "REPEAT CYCLE" },
    ],
  },
  {
    kicker: "REFLECTOR",
    title: "A 12 m dish made of wire mesh",
    body: "Folded like an umbrella for launch and opened in orbit, it is the largest radar reflector NASA has flown. It focuses each pulse into a beam and gathers the faint echo coming back.",
    tag: "REFLECTOR · 12 M",
    callout: "reflector",
    focus: ["reflector"],
    exploded: 1,
    beam: 0,
    camera: { d: 26, az: 0.95, el: 0.3, look: [12, 7.5, 0] },
    facts: [{ value: "12 m", label: "DIAMETER" }],
  },
  {
    kicker: "BOOM",
    title: "A 9 m arm holds it out",
    body: "The deployable boom sets the reflector at the right distance from the radars, so the beam lands beside the ground track and sweeps a strip 242 km wide.",
    tag: "BOOM · 9 M",
    callout: "boom",
    focus: ["boom"],
    exploded: 1,
    beam: 0,
    camera: { d: 19, az: 0.75, el: 0.18, look: [6.5, 5, 0] },
    facts: [{ value: "242 km", label: "SWATH WIDTH" }],
  },
  {
    kicker: "RADARS",
    title: "Two radars, two wavelengths",
    body: "The L-band feed (24 cm, built by JPL) and the S-band feed (10 cm, built by ISRO) fire pulses into the reflector. Waves that long pass through cloud, smoke and darkness, so the radar brings its own light.",
    tag: "L-BAND + S-BAND FEEDS",
    callout: "radars",
    focus: ["radars"],
    exploded: 1,
    beam: 0,
    camera: { d: 13, az: 0.45, el: 0.22, look: [2.2, 4.4, 0] },
    facts: [
      { value: "24 cm", label: "L-BAND" },
      { value: "10 cm", label: "S-BAND" },
    ],
  },
  {
    kicker: "BUS",
    title: "Power, pointing, downlink",
    body: "ISRO's spacecraft bus and solar array keep the radars powered, the antenna pointed and the data flowing to ground stations, pass after pass.",
    tag: "BUS + SOLAR ARRAY",
    callout: "bus",
    focus: ["bus", "solar"],
    exploded: 1,
    beam: 0,
    camera: { d: 17, az: -0.55, el: 0.25, look: [0, -1, -2.5] },
    facts: [],
  },
  {
    kicker: "IN ORBIT",
    title: "Same place, every 12 days",
    body: "NISAR revisits each spot from the same orbit. Compare the phase of two echoes and the difference reveals how many centimetres the ground moved. That is what the explorer shows.",
    tag: "",
    exploded: 0,
    beam: 1,
    camera: { d: 40, az: 0.3, el: 0.12, look: [5, 1, 0] },
    facts: [
      { value: "cm", label: "MOTION RESOLVED" },
      { value: "day & night", label: "ALL WEATHER" },
    ],
  },
];

// Each step holds still at both ends; the move between two steps eases through its middle half.
export const stepBlend = (raw: number): number => {
  if (raw < 0.35) return 0;
  if (raw > 0.85) return 1;
  const x = (raw - 0.35) / 0.5;
  return x * x * (3 - 2 * x);
};
