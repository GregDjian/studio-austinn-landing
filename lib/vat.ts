// UAE VAT. Every price entered in Sanity (products, size options, price per link, delivery
// rates, installation fee) is VAT-INCLUSIVE, so the site shows prices exactly as entered and
// only ever works the VAT amount out backwards from a paid total.
export const VAT_RATE = 0.05;

/** The VAT contained in a VAT-inclusive amount (e.g. 1420 -> 67.62). */
export const vatPortion = (gross: number): number =>
  Math.round(((gross * VAT_RATE) / (1 + VAT_RATE)) * 100) / 100;

/** A VAT-inclusive amount without its VAT. */
export const excludingVat = (gross: number): number =>
  Math.round((gross - vatPortion(gross)) * 100) / 100;

/** Always two decimals - for VAT / net breakdown lines. */
export const formatFixed = (n: number): string =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
