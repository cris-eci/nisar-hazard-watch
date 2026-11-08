// Team data for /about, kept apart from the layout so the team can fill in roles, links and photos.
// A missing field renders as grey placeholder copy.
export type TeamMember = {
  name: string;
  handle: string;
  degree: "Systems Engineering" | "Statistical Engineering";
  owner?: boolean;
  photo?: string;
  role?: string;
  built?: string;
  github?: string;
  linkedin?: string;
};

export const TEAM: TeamMember[] = [
  {
    name: "Jesús Alfonso Pinzón Vega",
    handle: "@jesus_pinzon",
    degree: "Systems Engineering",
    owner: true,
    role: "Architect · team lead",
    built: "Backend API and system design",
  },
  {
    name: "Cristian Santiago Pedraza Rodríguez",
    handle: "@cris-pe",
    degree: "Systems Engineering",
    photo: "/team/cristian.png",
    role: "Front end · design",
    built: "Landing, explorer, method and the design system",
  },
  { name: "Andersson David Sánchez Méndez", handle: "@ander_14_73", degree: "Systems Engineering" },
  { name: "David Stiven Sarria Arcila", handle: "@davidsarriaa", degree: "Systems Engineering" },
  {
    name: "Daniel Felipe Martínez Hernández",
    handle: "@chocomilitos",
    degree: "Statistical Engineering",
    role: "Machine learning · radar science",
    built: "NISAR-Modeling and NISAR-Models",
  },
  {
    name: "Katheryn Sofía Guasca Chavarro",
    handle: "@kathee26",
    degree: "Systems Engineering",
    photo: "/team/katheryn-guasca.png",
    role: "Front-end developer",
    built: "Flood analysis interface, event timeline and data visualizations",
    github: "https://github.com/KillerZeus666",
    linkedin: "https://www.linkedin.com/in/katheryn-sof%C3%ADa-guasca-chavarro-73a93b35a/",
  },
];

// First name plus the first surname: the third word, or the second when there are only two.
export const initials = (name: string): string => {
  const words = name.split(" ");
  const last = words[2] ?? words[1] ?? "";
  return `${words[0]?.[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
};

export const firstName = (name: string): string => name.split(" ")[0] ?? name;
