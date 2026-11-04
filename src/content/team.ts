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
  },
  {
    name: "Cristian Santiago Pedraza Rodríguez",
    handle: "@cris-pe",
    degree: "Systems Engineering",
    photo: "/team/cristian.png",
    role: "Design and front end",
    built: "Landing, method page and globe explorer",
  },
  { name: "Andersson David Sánchez Méndez", handle: "@ander_14_73", degree: "Systems Engineering" },
  { name: "David Stiven Sarria Arcila", handle: "@davidsarriaa", degree: "Systems Engineering" },
  {
    name: "Daniel Felipe Martínez Hernández",
    handle: "@chocomilitos",
    degree: "Statistical Engineering",
  },
  { name: "Katheryn Sofía Guasca Chavarro", handle: "@kathee26", degree: "Systems Engineering" },
];

// First name plus the first surname: the third word, or the second when there are only two.
export const initials = (name: string): string => {
  const words = name.split(" ");
  const last = words[2] ?? words[1] ?? "";
  return `${words[0]?.[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
};

export const firstName = (name: string): string => name.split(" ")[0] ?? name;
