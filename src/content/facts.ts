export type Fact = { id: string; text: string; source: { label: string; href: string } };

const NASA_MISSION = {
  label: "NASA Science · NISAR",
  href: "https://science.nasa.gov/mission/nisar/",
};
const FIVE_THINGS = {
  label: "NASA · 5 things to know about NISAR",
  href: "https://www.nasa.gov/missions/nisar/5-things-to-know-about-powerful-new-u-s-india-satellite-nisar/",
};
const ANTENNA = {
  label: "NASA Science · the antenna reflector blooms",
  href: "https://science.nasa.gov/blogs/nisar/2025/08/15/giant-radar-antenna-reflector-on-nasa-isro-satellite-in-full-bloom/",
};
const LAUNCH = {
  label: "NASA Science · NISAR lifts off",
  href: "https://science.nasa.gov/earth/earth-observatory/advanced-us-india-radar-mission-lifts-off-154617/",
};

// Every fact names where it comes from. Nothing here is a number from our own analysis.
const FACTS: Fact[] = [
  {
    id: "launch",
    text: "NISAR, a joint NASA and ISRO satellite, launched on 30 July 2025 from the Satish Dhawan Space Centre in Sriharikota, India.",
    source: LAUNCH,
  },
  {
    id: "twice",
    text: "Its two radars image nearly all of Earth's land and ice surfaces twice every 12 days.",
    source: FIVE_THINGS,
  },
  {
    id: "clouds",
    text: "A radar brings its own light: NISAR can see through clouds and light rain, day and night.",
    source: FIVE_THINGS,
  },
  {
    id: "bands",
    text: "The L-band radar has a 24 cm wavelength and the S-band radar, built by ISRO, 9.4 cm. This explorer reads the L-band.",
    source: NASA_MISSION,
  },
  {
    id: "canopy",
    text: "The L-band system can see through clouds and forest canopy; the S-band system is more sensitive to light vegetation and moisture in snow.",
    source: FIVE_THINGS,
  },
  {
    id: "antenna",
    text: "The radar antenna reflector is about 12 metres (39 feet) wide, the largest radar reflector NASA has sent into space; it unfurled from 0.6 metres in 37 minutes.",
    source: ANTENNA,
  },
  {
    id: "open",
    text: "NISAR data is archived by the Alaska Satellite Facility DAAC and is openly available to the public.",
    source: NASA_MISSION,
  },
  {
    id: "purpose",
    text: "The mission's goal is to measure and understand changes in Earth's land, ice, water and vegetation.",
    source: NASA_MISSION,
  },
];

// The seam for dynamic facts later: callers only ask for a list.
export const getFacts = (): Fact[] => FACTS;
