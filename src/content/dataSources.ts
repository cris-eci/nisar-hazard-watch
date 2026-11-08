// The archives and catalogues behind every number on the site (handoff v7-cases.js → DATA_SOURCES).
export type DataSource = { tag: string; name: string; what: string; href: string };

export const DATA_SOURCES: DataSource[] = [
  {
    tag: "NASA · ASF DAAC",
    name: "NISAR L2 GCOV",
    what: "Radar backscatter in HH and HV, the base of every lens",
    href: "https://nisar-docs.asf.alaska.edu/gcov/",
  },
  {
    tag: "NASA · ASF DAAC",
    name: "NISAR L2 GUNW",
    what: "Interferograms and coherence for earthquakes",
    href: "https://nisar-docs.asf.alaska.edu/gunw/",
  },
  {
    tag: "NASA · JPL",
    name: "NISAR Observation Plan",
    what: "Where and when NISAR passes, including planned passes",
    href: "https://nisar.jpl.nasa.gov/mission/get-to-know-sar/observation-plan/",
  },
  {
    tag: "NASA · JPL OPERA",
    name: "DSWx-HLS and DIST-ALERT",
    what: "Optical water and vegetation loss, the second witness",
    href: "https://www.jpl.nasa.gov/go/opera/products/dist-product-suite/",
  },
  {
    tag: "SERVICIO GEOLÓGICO COLOMBIANO",
    name: "SGC event reports",
    what: "Official facts for the Chocó earthquake",
    href: "https://www.sgc.gov.co",
  },
];
