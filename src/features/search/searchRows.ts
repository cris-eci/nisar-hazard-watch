import { TOP_BAR } from "@/content/copyV8";
import type { Case } from "@/features/cases/cases";
import { pointLabel } from "@/features/search/coordinates";
import type { Place } from "@/features/search/placesApi";

// One row of the search list: a geocoder hit asks the radar live, a known case opens instantly.
export type SearchRow =
  | {
      kind: "place";
      id: string;
      name: string;
      sub: string;
      where: string;
      tag: string;
      place: Place;
    }
  | {
      kind: "case";
      id: string;
      name: string;
      sub: string;
      where: undefined;
      tag: string;
      item: Case;
    };

// "Chókwè" matches "chokwe": accents and case don't decide whether a case is found.
const fold = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const countryOf = (item: Case): string => item.place.split(", ").at(-1) ?? item.place;

// Cases whose name appears in the query or whose name and place contain it ("Qadirabad",
// "qadirabad pakistan", "Chenab").
export const caseHits = (text: string, cases: readonly Case[]): Case[] => {
  const query = fold(text);
  if (query.length === 0) return [];
  return cases.filter((item) => {
    const name = fold(item.name);
    return query.includes(name) || fold(`${item.name} ${item.place}`).includes(query);
  });
};

export const placeRow = (place: Place): SearchRow => ({
  kind: "place",
  id: place.id,
  name: place.name,
  sub: TOP_BAR.searchLiveSub(pointLabel(place.point)),
  where: place.displayName,
  tag: TOP_BAR.tagLive,
  place,
});

export const caseRow = (item: Case): SearchRow => ({
  kind: "case",
  id: `case:${item.id}`,
  name: `${item.name}, ${countryOf(item)}`,
  sub: TOP_BAR.searchCaseSub(item.hazard, item.when),
  where: undefined,
  tag: TOP_BAR.tagInstant,
  item,
});

// Geocoder hits first, as the provider ranked them, then the known cases the query names.
export const searchRows = (places: readonly Place[], cases: readonly Case[]): SearchRow[] => [
  ...places.map(placeRow),
  ...cases.map(caseRow),
];
