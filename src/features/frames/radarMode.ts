// NISAR radar mode mnemonics look like "L:SCI:DH:40M+05N:FS:B4:D02".
// Field 1 is the band (L or S) and field 3 the polarization mode.
// A single mode can hold an L and an S mnemonic separated by spaces.

const CROSS_POL_MODES = new Set(["DH", "DV", "QP", "QD", "QQ"]);

const isLBandCrossPol = (mnemonic: string): boolean => {
  const [band, , polarization] = mnemonic.split(":");
  return band === "L" && polarization !== undefined && CROSS_POL_MODES.has(polarization);
};

export const hasCrossPol = (mnemonics: string): boolean =>
  mnemonics.split(/[\s,]+/).some(isLBandCrossPol);
