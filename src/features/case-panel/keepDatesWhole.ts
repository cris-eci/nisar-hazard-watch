// A wrapping value breaks between dates, never inside one: "21 Jul →" / "14 Aug", not "14" / "Aug".
export const keepDatesWhole = (value: string): string =>
  value.replace(/(\d) (?=[A-Z][a-z]{2}\b)/g, "$1\u00a0");
